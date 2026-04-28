# wireframe-wire-dsl test cases

Each `NN-<name>.md` file is a self-contained scenario brief. Use these for:

- **Eval**: spawn an agent that reads SKILL.md + a case brief, produces a `.wire` file in `/tmp/`, validates and renders, reports first-attempt outcome and iterations needed.
- **Regression checks**: after editing the skill, re-run the affected case(s) to confirm output still validates and renders.
- **Onboarding**: read these to learn what the skill is expected to handle.

## Authoring rules for new cases

- Specify the brief, **not** the implementation. Cases describe screens and behaviors, not the literal `.wire` source.
- State acceptance criteria concretely (e.g., "render produces a 4-page PDF", not "looks correct").
- Tag a complexity tier: `medium` (3-5 screens), `complex` (6-9 screens or shared layouts), `very-complex` (10+ screens, branching, or stress on a known weak area).
- Don't bake outputs into the case — agents write artifacts to `/tmp/` and clean up.
