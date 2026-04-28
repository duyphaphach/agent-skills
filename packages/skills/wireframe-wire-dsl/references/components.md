# wire-dsl component catalog

Use these names verbatim. Don't invent components or variants — the parser will reject unknowns.

## Text

| Component | Common props |
|-----------|--------------|
| `Heading` | `text: "..."`, `level: 1..6`, `variant: default\|muted` |
| `Text` | `text: "..."`, `variant: default\|muted` |
| `Label` | `text: "..."` |

## Inputs

| Component | Common props |
|-----------|--------------|
| `Input` | `label: "..."`, `placeholder: "..."`, `value: "..."` |
| `Textarea` | `label`, `placeholder`, `rows: N` |
| `Select` | `label`, `options: "A,B,C"`, `value` |
| `Checkbox` | `label`, `checked: true\|false` |
| `Radio` | `label`, `options: "A,B,C"`, `value` |
| `Toggle` | `label`, `checked: true\|false` |

## Buttons

| Component | Common props |
|-----------|--------------|
| `Button` | `text: "..."`, `variant: default\|primary\|secondary\|success\|warning\|danger\|info`, `onClick: ...` |
| `IconButton` | `icon: "name"`, `variant`, `onClick` |

## Navigation

| Component | Common props |
|-----------|--------------|
| `Topbar` | `title: "..."`, `actions: "Settings,Logout"` |
| `SidebarMenu` | `items: "A,B,C"`, `active: "A"`, `onItemsClick: "..."` |
| `Breadcrumbs` | `items: "Home,Users,Detail"` |
| `Tabs` | `tabs: "One,Two,Three"`, `active: "One"`, paired with `tabs { tab "..." { } }` layout |

## Data

| Component | Common props |
|-----------|--------------|
| `Table` | `columns: "Col1,Col2,Col3"`, `rows: N` |
| `List` | `items: "A,B,C"`, `onItemsClick: "..."` |

## Media

| Component | Common props |
|-----------|--------------|
| `Image` | `type: square\|landscape\|avatar`, `alt: "..."` |
| `Icon` | `name: "feather-icon-name"` (Feather Icons set, ~287 names) |

## Misc

| Component | Common props |
|-----------|--------------|
| `Divider` | `orientation: horizontal\|vertical` |
| `Badge` | `text: "..."`, `variant` |
| `Link` | `text: "..."`, `onClick` |
| `Chart` | `type: "bar"\|"line"\|"pie"\|"area"`, `height: N` |
| `Alert` | `text: "..."`, `variant` |
| `Stat` | `title: "..."`, `value: "..."`, `delta: "..."` |
| `Code` | `text: "..."` |

## Property syntax reminders

- Strings in double quotes: `text: "Hello"`
- Numbers bare: `rows: 4`, `height: 300`
- Booleans bare: `checked: true`
- Comma-separated lists go inside one string: `items: "A,B,C"` (NOT `["A","B","C"]`)
- Variants are bare keywords, not strings: `variant: primary` (NOT `variant: "primary"`)

## Icons

The wire-dsl repo ships ~287 [Feather Icons](https://feathericons.com). Common ones: `home`, `user`, `users`, `settings`, `search`, `bell`, `mail`, `plus`, `minus`, `x`, `check`, `chevron-right`, `chevron-down`, `menu`, `more-horizontal`, `edit`, `trash`, `download`, `upload`, `eye`, `eye-off`, `lock`, `unlock`, `calendar`, `clock`, `file`, `folder`, `image`, `bar-chart`, `pie-chart`, `trending-up`. For the full list see `docs/ICONS-GUIDE.md` in the wire-dsl repo.
