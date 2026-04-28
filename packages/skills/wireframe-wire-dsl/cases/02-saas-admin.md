# Case 02 — Multi-tenant SaaS admin

**Tier**: very-complex (8 screens, `define Layout` reused across 6 screens)

## Brief

Build a `.wire` file with 8 screens for a multi-tenant SaaS admin app. Use `define Layout "AppShell"` to factor the sidebar+topbar chrome and reuse it across screens 3-8. The sidebar's `active` highlight must match each screen.

1. **Login** — centered card: logo image, email Input, password Input, "Sign in" primary, "Forgot password?" Link, Divider, "Sign in with Google" secondary.
2. **OrgSelect** — heading "Choose an organization", List of 4 org names. Click navigates to OrgDashboard.
3. **OrgDashboard** — `AppShell` with active="Dashboard". Topbar "Acme Corp". 12-col grid of 4 KPI cards (Users / MRR / Active Sessions / Churn) at span: 3 each. Then a line Chart (height 280) and a bar Chart (height 280) side-by-side via grid. Then a recent-activity Table (Date, User, Event, Status) with 8 rows.
4. **Members** — `AppShell` active="Members". Horizontal stack of search Input + role Select + "Invite member" primary button → `InviteMember`. Table (Name, Email, Role, 2FA, Last seen, Status) with 12 rows.
5. **InviteMember** — `AppShell` active="Members". Modal-style screen: email Input, role Select (Admin/Editor/Viewer/Billing), 4-checkbox permissions group, Cancel + "Send invite" primary buttons.
6. **Billing** — `AppShell` active="Billing". Current plan Stat card with delta. Usage bar Chart (height 280). Invoices Table (Date, Amount, Status, Action) with 6 rows. "Upgrade plan" primary button.
7. **Integrations** — `AppShell` active="Integrations". 12-col grid with 9 cards at span: 4 each (3×3): icon Image type:square, name, status Badge, "Configure" button per card.
8. **AuditLog** — `AppShell` active="Audit". Horizontal stack of 4 filters (date Select, actor Input, action Select, severity Select). Table (Timestamp, Actor, Action, Resource, IP, Severity) with 15 rows.

Sidebar items: `Dashboard,Members,Billing,Integrations,Audit,Settings`.

Use the documented cool monochrome `colors {}` block.

## Acceptance criteria

- `wire validate <file>` exits 0.
- `wire render <file> --pdf <out>` succeeds and produces an 8-page PDF.
- The same `define Layout "AppShell"` block is declared exactly once and invoked from screens 3-8.
- Each screen-3-through-8's sidebar `active` reflects the current page.
- No invented components.

## What this case tests

- `define Layout` declaration **and** invocation (the load-bearing complex feature).
- Reuse with per-instance `active` parameterization.
- Dense table content (15 rows on AuditLog, 12 on Members).
- Integrations grid with 9 cells in 3 rows.
- Mixed Charts (line + bar) on Dashboard.
- Many cross-screen `navigate(...)` references.
