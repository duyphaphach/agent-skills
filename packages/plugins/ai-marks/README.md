# ai-marks

A Claude Code plugin that strips AI-trace characters from files and replies.

Em dashes, smart quotes, ellipsis characters, and odd unicode spaces are the
typographic tells that mark text as AI-written. This plugin removes them and
puts plain keyboard characters in their place.

## What it does

Two hooks run automatically when the plugin is enabled:

| Hook | When it fires | What it does |
|------|---------------|--------------|
| `PostToolUse` on `Write`, `Edit`, `MultiEdit`, `NotebookEdit` | After the agent writes or edits a file | Silently rewrites any AI-trace character in the file to its plain equivalent. No prompt, no friction. |
| `Stop` | After the agent finishes a reply | Scans the reply text. If it finds AI-trace characters, it blocks the reply and asks for a rewrite using plain characters. |

The `PostToolUse` hook is a true silent fix: the file lands clean and you are
not prompted. The `Stop` hook cannot edit a reply already shown on screen, so
it exits with status 2 instead. Claude Code routes that to the model, which
rewrites the reply. The retry is clean; the first version is not.

## Replacement map

| AI mark | Replaced with |
|---------|---------------|
| em dash, en dash, horizontal bar, minus sign, figure dash, both hyphens | `-` (one ASCII hyphen) |
| left/right double smart quotes, low and high-reversed double quotes, both guillemets | `"` |
| left/right single smart quotes, low and high-reversed single quotes | `'` |
| horizontal ellipsis | `...` |
| non-breaking, thin, hair, narrow no-break, figure, punctuation spaces | regular space |
| zero-width space, zero-width non-joiner, zero-width joiner, byte-order mark | removed |

## Opt out per file

The file fixer skips any file that contains the marker `ai-marks: keep` on
any line. Use it for files where the unicode is intentional: test fixtures,
documentation about typography, or the plugin's own ruleset.

```python
# ai-marks: keep
```

It also skips binary files, lock files (`package-lock.json`, `Cargo.lock`,
and friends), and known binary extensions (images, archives, fonts, media,
executables).

## Naming a mark on purpose

The reply linter strips fenced code blocks and inline backtick spans before
scanning. To write about a mark without tripping the hook, wrap it in
backticks. Plain prose that uses the mark still gets flagged.

## Layout

```
ai-marks/
  .claude-plugin/plugin.json   plugin manifest
  hooks/hooks.json             hook registration
  scripts/_marks.py            shared character map and helpers
  scripts/fix-file.py          PostToolUse file fixer
  scripts/lint-reply.py        Stop hook reply linter
  bin/ai-marks-fix-file        manual wrapper for the file fixer
  bin/ai-marks-reply-lint      manual wrapper for the reply linter
```

## Requirements

Python 3.9 or newer on `PATH` as `python3`. No third-party packages.

## License

MIT
