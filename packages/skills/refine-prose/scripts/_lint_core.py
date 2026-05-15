"""Shared word-set logic for the refine-prose skill.

LIST ARCHITECTURE
-----------------
Three base lists ship with the skill under wordlists/:

  - ngsl-nawl-combined.txt   NGSL + NAWL flattened: the base spoken and
                             academic English vocabulary.
  - tech-terms.txt           Curated real technical jargon (protocols,
                             languages, frameworks, engineering vocabulary).
  - block.txt                Fancy machine-coded words, always rejected.

Exceptions load from two places and merge into one EXCEPTIONS set:

  - exceptions/*.txt                          categorized files that ship
                                              with the skill.
  - ~/.refine-prose/*.txt                     the user's own files, managed
                                              by scripts/add-exception.py.

DECISION CHAIN (per word, lowercased)
-------------------------------------
  1. word in BLOCKED                           -> blocked
  2. word in ALLOWED or TECH or EXCEPTIONS     -> allowed
  3. stem(word) in any of those stem sets      -> allowed
  4. otherwise                                 -> unknown

Block beats allow. Exact match beats stem. Stem is the fallback.

Stem sets are content-hashed and cached under ~/.cache/refine-prose so the
skill folder stays read-only at runtime. The cache rebuilds when any list
changes.
"""
from __future__ import annotations

import hashlib
import os
import re
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
WORDLIST_DIR = SKILL_DIR / "wordlists"
SKILL_EXCEPTIONS_DIR = SKILL_DIR / "exceptions"
USER_EXCEPTIONS_DIR = Path.home() / ".refine-prose"
CACHE_DIR = Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache")) / "refine-prose"
try:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
except OSError:
    CACHE_DIR = Path("/tmp")

try:
    import snowballstemmer  # type: ignore

    _SNOWBALL = snowballstemmer.stemmer("english")

    def stem(word: str) -> str:
        return _SNOWBALL.stemWord(word)

    STEMMER_NAME = "snowball"
except Exception:
    _SUFFIXES = ("ingly", "edly", "ies", "ied", "ing", "ed", "ly",
                 "est", "er", "ness", "tion", "ment", "es", "s")

    def stem(word: str) -> str:
        for suffix in _SUFFIXES:
            if len(word) > len(suffix) + 2 and word.endswith(suffix):
                return word[:-len(suffix)]
        return word

    STEMMER_NAME = "fallback"


def _load_set(path: Path) -> set[str]:
    """Load one word file into a lowercased set, skipping blanks and # lines."""
    if not path.exists():
        return set()
    return {
        word.strip().lower()
        for word in path.read_text(errors="replace").splitlines()
        if word.strip() and not word.startswith("#")
    }


def _load_dir(directory: Path) -> set[str]:
    """Merge every .txt file under a directory into one set."""
    if not directory.is_dir():
        return set()
    merged: set[str] = set()
    for path in sorted(directory.glob("*.txt")):
        merged |= _load_set(path)
    return merged


def _stem_set(source: set[str], cache_path: Path) -> set[str]:
    """Stem every word in source, with a content-hashed disk cache."""
    raw = "\n".join(sorted(source))
    digest = hashlib.md5(raw.encode("utf-8")).hexdigest()
    header = f"# md5:{digest}\n# stemmer:{STEMMER_NAME}\n"
    if cache_path.exists():
        content = cache_path.read_text(errors="replace")
        if content.startswith(header):
            return set(content[len(header):].split())
    stems = {stem(word) for word in source if word}
    try:
        cache_path.write_text(header + "\n".join(sorted(stems)) + "\n")
    except OSError:
        pass
    return stems


ALLOWED = _load_set(WORDLIST_DIR / "ngsl-nawl-combined.txt")
TECH = _load_set(WORDLIST_DIR / "tech-terms.txt")
BLOCKED = _load_set(WORDLIST_DIR / "block.txt")
EXCEPTIONS = _load_dir(SKILL_EXCEPTIONS_DIR) | _load_dir(USER_EXCEPTIONS_DIR)

ALLOWED_STEMS = _stem_set(ALLOWED, CACHE_DIR / "allowed-stems.cache")
TECH_STEMS = _stem_set(TECH, CACHE_DIR / "tech-stems.cache")
EXCEPTIONS_STEMS = _stem_set(EXCEPTIONS, CACHE_DIR / "exceptions-stems.cache")

SKIP_PATTERNS = [
    re.compile(r"```.*?```", re.DOTALL),
    re.compile(r"~~~.*?~~~", re.DOTALL),
    re.compile(r"`[^`]+`"),
    re.compile(r"https?://\S+"),
    re.compile(r"\[[^\]]+\]\([^)]+\)"),
    re.compile(r"<[^>]+>"),
    re.compile(r"^---.*?^---", re.DOTALL | re.MULTILINE),
]

WORD_RE = re.compile(r"\b[A-Za-z][A-Za-z']*\b")


def strip_skips(text: str) -> str:
    """Blank out code spans, links, URLs, HTML, and frontmatter so they are
    not scanned. Lengths are preserved so line and column numbers stay true."""
    for pattern in SKIP_PATTERNS:
        text = pattern.sub(lambda m: " " * len(m.group()), text)
    return text


def classify(word_lower: str) -> str:
    """Return 'blocked', 'allowed', or 'unknown' for a lowercased word."""
    if word_lower in BLOCKED:
        return "blocked"
    if word_lower in ALLOWED or word_lower in TECH or word_lower in EXCEPTIONS:
        return "allowed"
    word_stem = stem(word_lower)
    if word_stem in ALLOWED_STEMS or word_stem in TECH_STEMS or word_stem in EXCEPTIONS_STEMS:
        return "allowed"
    return "unknown"


def is_allowed(word_lower: str) -> bool:
    """True when the word passes the gate."""
    return classify(word_lower) == "allowed"


def find_violations(text: str) -> list[tuple[int, int, str, str]]:
    """Return (line, col, word, kind) for each word that does not pass.

    kind is one of:
      blocked   on the blocklist; must be rewritten, cannot be excepted.
      unknown   in no list; rewrite it or add an exception.

    Any word written with a leading capital is skipped, so names, headings,
    and acronyms are left alone. The skip is per appearance: a word that also
    shows up in lowercase is still checked on that lowercase use.

    Each distinct lowercased word is reported once, at its first lowercase
    appearance. Words of two characters or fewer are skipped.
    """
    scan = strip_skips(text)
    issues: list[tuple[int, int, str, str]] = []
    seen: set[str] = set()
    for match in WORD_RE.finditer(scan):
        word = match.group()
        if word[0].isupper():
            continue
        lower = word.lower()
        if len(lower) <= 2 or lower in seen:
            continue
        seen.add(lower)
        kind = classify(lower)
        if kind == "allowed":
            continue
        line = text.count("\n", 0, match.start()) + 1
        col = match.start() - text.rfind("\n", 0, match.start())
        issues.append((line, col, word, kind))
    return issues
