# wireframe-excalidraw test cases

Each `NN-<name>.md` file is a self-contained scenario brief. Use these for:

- **Eval**: spawn an agent that reads SKILL.md + a case brief, produces a `.mjs` generator + `.excalidraw` output in `/tmp/`, validates JSON, reports first-attempt outcome and iterations needed.
- **Regression checks**: after editing the skill, re-run the affected case(s) to confirm output still parses cleanly.
- **Onboarding**: read these to learn what the skill is expected to handle.

## Authoring rules for new cases

- Specify the brief, **not** the implementation. Cases describe frames, content, and behaviors, not literal JS source.
- State acceptance criteria concretely (e.g., "valid JSON, ≥150 elements, no frame overflow per `assertFits`").
- Tag a complexity tier: `medium` (1-3 frames), `complex` (4-5 frames or parameterized shells), `very-complex` (6+ frames, multi-state, or stress on layout overflow).
- Don't bake outputs into the case — agents write artifacts to `/tmp/` and clean up.
