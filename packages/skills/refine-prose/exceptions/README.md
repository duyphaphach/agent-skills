# Built-in exceptions

Each `.txt` file here is a category of words that pass the gate even though
they are not in the base lists. The gate loads every `.txt` file in this
folder and joins it into one set. The blocklist still wins over any exception.

For the category list and what each one holds, see
`../references/decision-process.md`.

## Adding your own

Do not change these built-in files by hand. Add words to your personal folder
through the script instead:

```bash
python3 ../scripts/add-exception.py CATEGORY WORD ...
```

It writes to `~/.claude/refine-prose-exceptions/`, one file per category, and
checks each word first: a word is taken only when it is a single lowercase
token, is not on the blocklist, and does not already pass another way.
