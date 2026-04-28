# Case 01 — E-commerce checkout flow

**Tier**: medium (4 screens, linear navigation)

## Brief

Build a `.wire` file with 4 screens in a linear navigation chain modelling a typical online-store checkout:

1. **ProductList** — topbar with cart icon + badge count "3", 3-column grid (12-col, span: 4) of 6 product cards. Each card: image placeholder, name, price, "Add to cart" primary button.
2. **ProductDetail** — breadcrumbs `Home,Headphones,Wireless Headphones`. Split layout: large image left, right side stacked with title heading, price, qty Input, Color Radio (Black/Silver/Navy), Size Select, "Add to cart" primary button, "Buy now" secondary button.
3. **Cart** — heading "Your cart", Table with columns `Product,Qty,Price,Subtotal` and 3 rows. Order summary panel/card with subtotal/tax/total Stat block. "Checkout" primary button → `Checkout`.
4. **Checkout** — breadcrumbs `Cart,Checkout`. Two-column form: shipping address inputs left (full name, address line 1/2, city, country select, postal code), payment inputs right (cardholder name, card number, expiry, CVC, save-card checkbox). Order summary card at the bottom with a 3-row table. "Place order" primary button.

Use `onClick: navigate(...)` to link the screens (List → Detail → Cart → Checkout).

Use the documented cool monochrome `colors {}` block.

## Acceptance criteria

- `wire validate <file>` exits 0.
- `wire render <file> --pdf <out>` succeeds and produces a 4-page PDF.
- `wire render <file> -s ProductList --svg <out>` succeeds and produces a non-empty SVG.
- All `navigate(...)` targets resolve to declared screens.
- No invented components or variants.

## What this case tests

- Multi-screen navigation chain.
- 12-col grid with `span: 4` for the product cards.
- `split` layout with stacked right-side controls.
- Mixed component types: Table, Stat, Radio, Select, Checkbox.
- The `colors {}` block (post-fix bare-hex syntax).
