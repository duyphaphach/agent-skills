---
name: e2e-test-design
description: Design end-to-end (e2e) test scenarios by exploring a live, running app with the Playwright MCP. This is a design-thinking skill. It maps real user journeys, ranks them by risk, and writes a layered set of markdown scenario docs organised as an Epic / Feature / Story tree with severity labels and Given/When/Then steps, ready to map onto Allure Report. It does not write test code, selectors, fixtures, or runner config. Use it whenever the user asks what to test end-to-end, wants an e2e test plan or scenario list, asks to design or review e2e coverage, or says things like "how should we test this flow" or "what scenarios do we need", even if they do not say "e2e" explicitly. Requires a running app URL and a Playwright browser-testing MCP server, discovered with mcp-cli.
---

# E2E Test Scenario Design

Explore a live app, then design *what* to test end-to-end as a layered,
Allure-ready scenario set. Design only: no test code, selectors, fixtures, or
runner config. The deliverable is a folder of markdown.

## The layers

The design is a tree. Epic, Feature, and Story are Allure Report's own grouping
layers, so the result drops into Allure as-is.

| Layer | What | Example |
|-------|------|---------|
| Epic | A product area | Shopping |
| Feature | One journey | Checkout |
| Story | One behavior | Check out as a guest |
| Scenario | One test, with Given/When/Then steps | Guest checkout, declined card |

## Rules

- **A few critical paths per feature, not a dozen.** Happy path plus the two or
  three failures that matter most. Reach every feature; stay shallow in each.
- **Test journeys, not parts.** One real task, start to a visible result. If a
  unit test checks it faster, it belongs there.
- **Check what the user sees** (a message, a redirect, a new row), not database
  rows or hidden state.
- **Behavior, not buttons.** "Submit the checkout form", not "click `#btn-2`".
- **Validation rides inside journeys.** One scenario for an incomplete form, not
  one per field.
- **Each scenario stands alone.** Preconditions state the starting point.
- **Needs a live app and MCP.** A running app URL and a Playwright browser MCP.
  Missing either: stop.

## Workflow

1. **Frame.** Note what the app does, who uses it, what failure would be a
   disaster, which roles. Ask, or infer from the app if no one can answer.
2. **Explore.** Walk the live app (see below): every route, both logged-out and
   logged-in, each role, each screen's states. Scan the source for hidden routes
   and `?auth=`-style backdoors.
3. **Tree.** Group what you found into Epic > Feature > Story. Cross-cutting
   concerns (navigation, toasts, routing) each earn their own epic.
4. **Severity.** Label each scenario `blocker` / `critical` / `normal` /
   `minor` / `trivial`, by how much damage a failure does.
5. **Scenarios.** Per story, highest severity first: happy path, then the few
   key failures (heuristics below).
6. **Check, then write.** Every route in the tree? Every feature a handful, not
   a dozen? Fill gaps, trim bloat, write the files.

## Exploring with the Playwright MCP

`mcp-cli` lists servers; the Playwright one exposes `browser_*` tools. Each
`mcp-cli call` opens a fresh browser; state does not survive between calls.

```bash
# single page: navigate returns a snapshot file under ./.playwright-mcp/
mcp-cli call playwright browser_navigate '{"url":"http://localhost:3000/login"}'

# multi-step (log in, then act): batch it all into ONE call
mcp-cli call playwright browser_run_code_unsafe '{"code":"async (page) => { await page.goto(\"http://localhost:3000\"); await page.fill(\"#email\",\"a@b.c\"); await page.click(\"text=Sign in\"); return await page.content(); }"}'

# backdoors: dump the real source, scan for hidden routes and auth params
curl -s http://localhost:3000 | grep -iE 'auth=|route|debug'
```

Try every shortcut you find (`?auth=admin`, debug flags). Do not fire
destructive actions (delete, pay, send) on a shared app; ask first.

## Heuristics

Vary one thing on a journey; ask what should happen. Pick the few that matter,
not every row.

| Lens | Ask |
|------|-----|
| Lists & items | Create, view, edit, delete. Empty list, one item, many, at the limit. |
| State transitions | Each status an item moves through, what is allowed and blocked. A filter: one representative value, not all. |
| Bad input | Empty, too long, wrong format, duplicate. One scenario for an incomplete form. |
| Failures | Server error, declined payment, slow or timed-out response. |
| Identity | Logged out, each role, expired session, someone else's data by URL, `?auth=`-style backdoors. |
| Naughty user | Hit back mid-payment, double-click submit, two tabs at once, paste emoji, refresh mid-flow. |
| Interrupt & undo | Reload mid-flow (does the session survive?), cancel halfway, abandon and return. |
| Chrome & routing | Nav shows or hides on the right pages, toasts appear and dismiss, direct-load each route, unknown route shows 404. |
| Cross-feature | Does finishing journey A change what journey B shows? |

## Output

An overview doc first, then one reference partial per feature:

```
e2e-scenarios/
  overview.md            read first: tree linking every partial, severity
                         counts, risks & gaps, deliberately-not-covered
  shopping/checkout.md   a partial: one feature, its stories and scenarios
```

Example `overview.md`:

```markdown
# E2E Test Scenario Design: <App>

App under test, scope, roles, date.

## Epic / Feature / Story tree
- Shopping
  - [Checkout](shopping/checkout.md) (4 scenarios)
  - [Cart](shopping/cart.md) (3 scenarios)
- Account
  - [Sign in](account/sign-in.md) (5 scenarios)

## Severity counts
blocker 3, critical 11, normal 18, minor 6, trivial 1

## Risks and gaps
What you could not explore, assumptions made, open questions.

## Deliberately not covered
What e2e skips on purpose and why.
```

Example partial `shopping/checkout.md`:

```markdown
# Feature: Checkout   (Epic: Shopping)

## Story: Check out as a guest

### Guest checks out with a valid card
- Labels: epic=Shopping, feature=Checkout, story=Check out as a guest,
  severity=critical, tags=[happy-path, smoke]
- Preconditions: cart holds one item, user not logged in
- Given the guest is on the cart page
- When they enter a valid card and submit the checkout form
- Then an "Order confirmed" message and an order number appear

### Checkout shows an error on a declined card
- Labels: epic=Shopping, feature=Checkout, story=Check out as a guest,
  severity=normal, tags=[error]
- Preconditions: cart holds one item, user not logged in
- Given the guest is on the checkout page
- When they submit a card the bank declines
- Then an inline "Card declined" error shows and no order is created
```

Labels copy into Allure annotations; each Given/When/Then line is one Allure step.
