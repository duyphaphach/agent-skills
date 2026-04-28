# Case 03 — Branching onboarding wizard

**Tier**: very-complex (10 screens, conditional branches, edit-back convergence)

## Brief

Build a `.wire` file modelling an onboarding wizard with a conditional fork at step 2 and convergence at the confirm step.

1. **Welcome** — centered hero, "Get started" primary → AccountType.
2. **AccountType** — Step 1 of 3 indicator (use a Text component). Heading "Pick your account type". Two large card-style buttons: "Personal" → ProfilePersonal, "Business" → ProfileBusiness.
3. **ProfilePersonal** — Step 2 of 3. Display name Input, date-of-birth Input (text placeholder), avatar Image type:avatar, Continue primary → InterestsConsumer.
4. **ProfileBusiness** — Step 2 of 3. Company name Input, tax ID Input, business type Select (LLC/Corp/Sole prop), employees Select. Continue → IndustryBusiness.
5. **InterestsConsumer** — Step 3 of 3. Heading "What are you interested in?". 8 Checkboxes laid out in 2 columns via a 12-col grid (span: 6 each cell with stack inside). Continue → ConfirmConsumer.
6. **IndustryBusiness** — Step 3 of 3. Heading "Tell us about your business". Industry Select (8+ options), revenue Radio with 4 brackets, team size Radio with 4 brackets. Continue → IntegrationsBusiness.
7. **IntegrationsBusiness** — Step 4 of 4 (business path). Heading "Connect your tools", 6 integration cards in 12-col grid (span: 4, 2 rows). Continue → ConfirmBusiness.
8. **ConfirmConsumer** — review panel of submitted info, "Edit profile" Link → ProfilePersonal, "Edit interests" Link → InterestsConsumer, Confirm primary → Done.
9. **ConfirmBusiness** — review panel, "Edit profile" → ProfileBusiness, "Edit industry" → IndustryBusiness, "Edit integrations" → IntegrationsBusiness, Confirm primary → Done.
10. **Done** — "You're all set 🎉" heading, "Welcome." muted Text.

Use the documented cool monochrome `colors {}` block.

## Acceptance criteria

- `wire validate <file>` exits 0.
- `wire render <file> --pdf <out>` succeeds with 10 pages.
- Both confirm screens converge on `Done`.
- Edit-back Links navigate to the relevant earlier step.
- The two paths (consumer / business) never share a screen between AccountType and the confirm step.
- No invented components.

## What this case tests

- Cross-screen navigation graph with branching and convergence.
- Forward-reference resolution (`navigate(Done)` declared before `Done` itself).
- Edit-back Links from review screens.
- Step-indicator pattern (manual `Text "Step N of M"`).
- `Radio` with 4-bracket option strings.
- 12-col grid with `span: 6` for 2-column checkbox layout.
