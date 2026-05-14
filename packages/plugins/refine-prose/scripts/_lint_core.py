"""Shared lint logic for the refine-prose plugin.

LIST ARCHITECTURE
-----------------
Three fixed lists ship with the plugin and never change at runtime:

  - wordlists/ngsl-nawl-combined.txt   NGSL+NAWL flattened, the base spoken
                                       and academic English vocabulary
  - wordlists/tech-terms.txt           curated real technical jargon
                                       (protocols, languages, frameworks,
                                       engineering vocabulary)
  - wordlists/block.txt                fancy LLM-coded words always rejected

Two exception sources are loaded as a single EXCEPTIONS set:

  - exceptions/*.txt                   bundled categorized files
                                       (numbers, ordinals, days/months,
                                       brands, file-formats, streams,
                                       plugin-internal). Fixed by plugin.
  - ~/.claude/refine-prose-exceptions/*.txt
                                       user-owned folder. Grows over time.
                                       Writes are validated by the PreToolUse
                                       hook before they take effect.

DECISION CHAIN
--------------
For each word in the prose, in this order:

  1. word in BLOCKED                                 -> REJECT
  2. word in (ALLOWED or TECH or EXCEPTIONS)         -> ACCEPT
  3. stem(word) in (ALLOWED or TECH or EXCEPTIONS)   -> ACCEPT
  4. otherwise                                       -> REJECT

Block beats allow. Exact match beats stem. Stem is the fallback.

Stem caches are content-hashed and stored under ~/.cache/refine-prose so the
plugin folder stays read-only. Caches regenerate when any list changes.
"""
import re
import hashlib
import os
from pathlib import Path

PLUGIN_DIR = Path(__file__).resolve().parent.parent
WORDLIST_DIR = PLUGIN_DIR / "wordlists"
PLUGIN_EXCEPTIONS_DIR = PLUGIN_DIR / "exceptions"
USER_EXCEPTIONS_DIR = Path.home() / ".claude" / "refine-prose-exceptions"
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
        w = word
        for suf in _SUFFIXES:
            if len(w) > len(suf) + 2 and w.endswith(suf):
                return w[:-len(suf)]
        return w
    STEMMER_NAME = "fallback"

def _load_set(path: Path) -> set:
    if not path.exists():
        return set()
    return {
        w.strip().lower()
        for w in path.read_text(errors="replace").splitlines()
        if w.strip() and not w.startswith("#")
    }

def _load_dir(directory: Path) -> set:
    """Merge every .txt file under a directory into one set."""
    if not directory.exists() or not directory.is_dir():
        return set()
    merged = set()
    for path in sorted(directory.glob("*.txt")):
        merged |= _load_set(path)
    return merged

def _stem_set(source: set, cache_path: Path) -> set:
    raw = "\n".join(sorted(source))
    digest = hashlib.md5(raw.encode("utf-8")).hexdigest()
    header = f"# md5:{digest}\n# stemmer:{STEMMER_NAME}\n"
    if cache_path.exists():
        content = cache_path.read_text(errors="replace")
        if content.startswith(header):
            return set(content[len(header):].split())
    stems = {stem(w) for w in source if w}
    try:
        cache_path.write_text(header + "\n".join(sorted(stems)) + "\n")
    except OSError:
        pass
    return stems

ALLOWED = _load_set(WORDLIST_DIR / "ngsl-nawl-combined.txt")
TECH = _load_set(WORDLIST_DIR / "tech-terms.txt")
BLOCKED = _load_set(WORDLIST_DIR / "block.txt")
EXCEPTIONS = _load_dir(PLUGIN_EXCEPTIONS_DIR) | _load_dir(USER_EXCEPTIONS_DIR)

ALLOWED_STEMS = _stem_set(ALLOWED, CACHE_DIR / "allowed-stems.cache")
TECH_STEMS = _stem_set(TECH, CACHE_DIR / "tech-stems.cache")
EXCEPTIONS_STEMS = _stem_set(EXCEPTIONS, CACHE_DIR / "exceptions-stems.cache")

# No hand-curated swap map. The hook message frames a process for the model
# to find alternatives itself, verify them with the linter, score them, and
# either pick the best or fall back to categorizing into an exception folder.

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
    for pat in SKIP_PATTERNS:
        text = pat.sub(lambda m: " " * len(m.group()), text)
    return text

def is_allowed(word_lower: str) -> bool:
    # 1. Blocklist beats everything
    if word_lower in BLOCKED:
        return False
    # 2. Exact match in any allow source
    if word_lower in ALLOWED or word_lower in TECH or word_lower in EXCEPTIONS:
        return True
    # 3. Stem fallback
    s = stem(word_lower)
    return s in ALLOWED_STEMS or s in TECH_STEMS or s in EXCEPTIONS_STEMS

def find_violations(text: str):
    """Return list of (line, word) for words that fail the decision chain."""
    scan = strip_skips(text)
    issues = []
    seen = set()
    for m in WORD_RE.finditer(scan):
        word = m.group()
        lower = word.lower()
        if len(lower) <= 2: continue
        if lower in seen: continue
        seen.add(lower)
        if is_allowed(lower):
            continue
        line = text[:m.start()].count("\n") + 1
        issues.append((line, word))
    return issues
