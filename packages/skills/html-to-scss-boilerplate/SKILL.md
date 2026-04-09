---
name: html-to-scss-boilerplate
description: Generate blank SCSS scaffold from HTML structure. Keywords: scss boilerplate, scss blocks, scss structure, scaffold scss, style this, set up scss, generate scss, css skeleton.
---

# HTML → SCSS Boilerplate

Read the HTML and output a blank SCSS scaffold — nested selectors mirroring the HTML hierarchy, empty bodies ready to fill in. No styles, just the skeleton.

## Input

Accept HTML from any of:

- The currently open file in the IDE
- A file path the user provides
- An inline snippet in the conversation

## Selector picking rules

An element gets a SCSS block **only** if it has a semantic selector or it is an interactive element (`a`, `button`, `input`, `textarea`, `select`). If not, skip the block but still recurse into its children — they bubble up to the nearest semantic ancestor.

Pick the selector in this priority order:

1. `#id` — if the element has an ID
2. First **semantic class** — the first class that is NOT in the utility list below

### State classes are semantic

Classes like `active`, `open`, `disabled`, `collapsed`, `show` describe meaningful UI states that need styling. When an element's **primary** selector is already a semantic class, generate `&.state` child blocks for any state classes also present on that element.

```scss
.dropdown-menu {
  &.show {
  }
}
```

Do **not** generate a block for an element whose _only_ selector would be a state class — they only make sense as modifiers on an already-identified semantic block.

### Utility classes to ignore

Use your knowledge of common CSS frameworks to identify utility classes. These include — but are not limited to — utility classes from:

- **Bootstrap**: spacing (`m-*`, `p-*`), layout (`d-*`, `col-*`, `row`, `flex-*`), color (`text-*`, `bg-*`), sizing, display helpers, and generic component base classes (`btn`, `navbar`, `nav-link`, `fa`, etc.)
- **Tailwind CSS**: any single-purpose atomic class (`flex`, `mt-4`, `text-sm`, `rounded-lg`, `hover:bg-blue-500`, etc.)
- Icon classes (`fa`, `fas`, `far`, `fa-*`)

## Pseudo-class blocks

For interactive elements, scaffold the relevant pseudo-classes as empty `&:pseudo` blocks inside the selector:

| Element                             | Pseudo-classes to scaffold                     |
| ----------------------------------- | ---------------------------------------------- |
| `<a>`                               | `&:hover`, `&:active`, `&:focus`, `&:visited`  |
| `<button>`                          | `&:hover`, `&:active`, `&:focus`, `&:disabled` |
| `<input>`, `<textarea>`, `<select>` | `&:focus`, `&:disabled`, `&:placeholder`       |

Only apply based on the **HTML tag**, not the class name — a `<div class="btn-custom">` does not get pseudo-class blocks unless the tag itself is interactive.

Example:

```scss
.app-sidebar-toggle {
  &:hover {
  }

  &:active {
  }

  &:focus {
  }

  &:disabled {
  }
}
```

## Nesting

Mirror the HTML nesting depth. Cap at 5 levels — if deeper, flatten remaining descendants at level 5 with a `// ...` comment.

Skip elements that have no semantic selector and no semantic descendants (e.g., a lone `<i>` icon, `<br>`, `<hr>`).

## Output format

```scss
.parent {
  .child {
    .grandchild {
    }
  }

  #some-id {
  }
}
```

- Opening brace on the same line as the selector
- One blank line between sibling blocks
- Empty body: blank line between braces (room to type)
- No generated properties or placeholder comments inside blocks

## Example

**Input:**

```html
<nav class="navbar navbar-expand navbar-light topbar static-top">
  <button
    id="sidebarToggleTop"
    class="btn btn-link app-sidebar-toggle d-md-none rounded-circle mr-3"
  >
    <i class="fa fa-bars"></i>
  </button>
  <div class="container-fluid">
    <h1 class="text-black-10 header-index">Title</h1>
    <span class="header-date">Monday</span>
  </div>
  <ul class="navbar-nav">
    <li class="nav-item dropdown no-arrow">
      <a class="nav-link dropdown-toggle column-gap-8" href="#">Link</a>
      <div class="dropdown-menu dropdown-menu-right shadow animated--grow-in">
        <a class="dropdown-item" href="#">Item</a>
      </div>
    </li>
  </ul>
</nav>
```

**Output:**

```scss
.topbar {
  #sidebarToggleTop {
    &:hover {
    }

    &:active {
    }

    &:focus {
    }

    &:disabled {
    }
  }

  .header-index {
  }

  .header-date {
  }

  .navbar-nav {
    .nav-item {
      a {
        &:hover {
        }

        &:active {
        }

        &:focus {
        }

        &:visited {
        }
      }

      .dropdown-menu {
        .dropdown-item {
          &:hover {
          }

          &:focus {
          }
        }
      }
    }
  }
}
```

## Deliver

Output the SCSS in a fenced code block. Then offer to write it to a `.scss` file — suggest a filename based on the HTML partial name (e.g., `_topbar.php` → `_topbar.scss`).
