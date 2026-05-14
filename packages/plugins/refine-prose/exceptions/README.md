# refine-prose exceptions/

Bundled exception lists, organized by category. Each `.txt` file is loaded by
the linter and merged into the `EXCEPTIONS` set. A word in any of these files
passes the linter (subject to the blocklist, which always beats exceptions).

## Categories shipped here

| File | Holds |
|------|-------|
| `numbers.txt` | Number words NGSL drops (`zero`, `two` ... `million`) |
| `ordinals.txt` | Ordinal words (`first`, `second` ... `twelfth`) |
| `days-and-months.txt` | Calendar words (`monday`, `january`, ...) |
| `brands.txt` | Brand and product names commonly referenced in tech docs |
| `file-formats.txt` | File extensions and format names (`md`, `png`, `csv`, ...) |
| `streams.txt` | POSIX standard channels (`stdin`, `stdout`, `stderr`) |
| `plugin-internal.txt` | Words the plugin itself uses in its docs |

## How to add your own

Do not edit these bundled files. Create or extend files in your personal folder:

```text
~/.claude/refine-prose-exceptions/
```

Anything in there is loaded and merged with the bundled categories. Use one
file per category, for example:

```text
~/.claude/refine-prose-exceptions/team-products.txt
~/.claude/refine-prose-exceptions/internal-acronyms.txt
~/.claude/refine-prose-exceptions/work.txt
```

The PreToolUse hook validates every write to the user folder. A word is only
accepted if it is:

- A single lowercase token (hyphens allowed)
- Not in the blocklist
- Not already allowed via NGSL+NAWL, the tech-terms list, or its stem

This protects the user folder from being used as an escape hatch for fancy
English.
