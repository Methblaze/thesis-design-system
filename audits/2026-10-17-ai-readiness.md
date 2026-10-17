# AI Readiness Report: Wireframe sketching (Thesis 2.0 design system)

**Date:** 2026-10-17
**File:** https://www.figma.com/design/fo6dQ2X8bGhxifuz567KjX/Wireframe-sketching?node-id=476-472
**Scope:** the 2.0 collections, the 2.0 text styles and the components on the "2.0 · Design system" page
**Overall Score:** 43/100 — Grade D: Early Stage

---

## Scorecard

| Category | Score | Status | Checks Passed |
|----------|-------|--------|---------------|
| Token Architecture | 40/100 | Needs Work | 3/7 |
| Component Contracts | 55/100 | Partial | 3/6 |
| Design-Code Parity | 0/100 | Needs Work | 0/3 |
| Accessibility | 38/100 | Needs Work | 1/4 |
| Documentation Quality | 45/100 | Needs Work | 2/4 |
| Governance & Maintenance | 90/100 | Pass | 3/4 |

---

## Detailed Results

### Token Architecture — 40/100

**T1: Variable Collections Exist** — PASS
3 collections: 2.0 · Palette (69), 2.0 · Theme (49, 3 modes), 2.0 · Size (14).

**T2: Multi-Layer Hierarchy** — FAIL
1 of 3 collection names matches a layer keyword (Theme). Palette and Size match none.
Rename "2.0 · Palette" to "2.0 · Primitives · Colour" and "2.0 · Size" to "2.0 · Primitives · Size".

**T3: Semantic Naming Convention** — FAIL
21 of 132 variables (16%) have 2+ separators; names like `stone/25`, `bg/canvas` and `space/4` have one.
Prefix every variable with its category: `color/stone/25`, `color/bg/canvas`, `size/space/4`.

**T4: Variable Description Coverage** — FAIL
12 of 132 variables (9%) have descriptions (the appearance/* set).
Add a description to all 49 theme variables and a one-line rule to each primitive group.

**T5: Variable Type Diversity** — PARTIAL
2 types (COLOR, FLOAT).
Add STRING variables for the font families and FLOAT variables for the type scale.

**T6: Mode Support** — PASS
2.0 · Theme has 3 modes (Calm light, Calm dark, Warm).

**T7: Variable Aliasing** — PASS
49 of 132 variables (37%) are aliases.

---

### Component Contracts — 55/100

**C1: Components Exist** — PASS
73 components and component sets (15 sets, 58 standalone, of which 54 are icons).

**C2: Component Description Coverage** — PASS
73 of 73 (100%) have descriptions.

**C3: Variant Coverage** — PARTIAL
82 of 140 components (59%) sit in component sets; the 54 icons are standalone.
Combine the 54 icons into one "Icon" set with a Name variant.

**C4: Property Definitions** — FAIL
19 of 73 (26%) expose properties; none of the 54 icons do.
The Icon set from C3 gives every icon a Name property and brings this to 20 of 20.

**C5: Naming Consistency** — PASS
73 of 73 (100%) use Title case, with / for grouping.

**C6: State Completeness** — FAIL
1 of 15 sets (7%) has 3+ states (Button: Default, Pressed, Disabled).
Add a State property with Default, Pressed, Focus and Disabled to Choice card, Chip, Toggle, List row and Text field.

---

### Design-Code Parity — 0/100

**P1: Code Connect Exists** — FAIL
No data: Code Connect needs a Dev or Full seat on an Organization or Enterprise plan.
Not fixable on the current plan; the tokens.json pipeline keeps token-level parity instead.

**P2: Mapping Coverage** — FAIL
No data (see P1).

**P3: Naming Alignment** — FAIL
No data (see P1).

---

### Accessibility Readiness — 38/100

**A1: Color Token Coverage** — FAIL
26 of 118 colour variables (22%) contain a purpose keyword; the 69 primitives are named by hue by design.
Keep primitives hidden from pickers and route every use through semantic names; renaming accent/* to action/* raises the count.

**A2: State Indication Beyond Color** — FAIL
No variant property names describe a non-colour indicator (Chip and Choice card do add a check icon or radio dot, but nothing in the property names says so).
Name the indicator in the variant set, e.g. a "Show check" boolean on Chip.

**A3: Contrast-Friendly Token Pairs** — PARTIAL
2 pairs: bg/inverse + text/inverse, bg/feature + text/on-feature.
Pair the accent: add `bg/accent` + `text/on-accent` (today accent/default + accent/on).

**A4: Focus State Tokens** — PASS
4 variables: focus/ring and appearance/light-ring, dark-ring, warm-ring.

---

### Documentation Quality — 45/100

**D1: File-Level Organization** — PASS
7 pages with descriptive names.

**D2: Component Descriptions** — PASS
73 of 73 (100%).

**D3: Variable Descriptions** — FAIL
12 of 132 (9%), as T4.

**D4: Usage Guidelines Signals** — FAIL
8 of 73 descriptions (11%) contain guidance words (use, when, avoid, should...).
Rewrite descriptions as "Use for… / Avoid…", starting with the 15 sets and the Icon set.

---

### Governance & Maintenance — 90/100

**G1: Deprecation Signals** — FAIL (neutral, 50)
No deprecation markers. The v1 collections are not marked as legacy.
Mark the v1 "Thesis · *" collections and v1 components as [Deprecated] with "Use 2.0 · …" in their descriptions.

**G2: Consistent Naming Taxonomy** — PASS
132 of 132 variables (100%) are grouped with /.

**G3: Component Organization** — PASS
54 of 73 (74%) use hierarchical names (the Icon/* set).

**G4: System Completeness** — PASS
Colour, spacing, typography and radius present; no shadow or elevation variables.

---

## Priority Actions

Fixing these will have the biggest impact on your score:

| # | Action | Category | Current | Potential Gain |
|---|--------|----------|---------|----------------|
| 1 | Rename the collections to Primitives · Colour, Primitives · Size and Theme | Token Architecture | FAIL | +5 pts |
| 2 | Prefix every variable with its category (color/…, size/…) | Token Architecture | FAIL | +5 pts |
| 3 | Combine the 54 icons into one Icon set with a Name property | Component Contracts | FAIL | +5 pts |
| 4 | Add descriptions to all 132 variables | Token Architecture + Documentation | FAIL | +6.75 pts |
| 5 | Add Default, Pressed, Focus and Disabled states to five interactive sets | Component Contracts | FAIL | +3.75 pts |

Code Connect (P1 to P3, up to +15 pts) needs an Organization or Enterprise Dev seat and is left out.

---

## Next Steps

Run `/ds-ai-check` again after making changes to track your improvement.
Your design system's AI readiness is a continuous journey — each fix makes AI-generated output more consistent with your brand.

---

# Re-run after fixes, same day

**Overall Score:** 75/100 — Grade B: Mostly Ready (was 43, Grade D)

| Category | Before | After | What changed |
|----------|--------|-------|--------------|
| Token Architecture | 40 | 100 | Collections renamed to Primitives · Colour, Primitives · Size, Primitives · Type and Theme; every variable prefixed (155 of 155 multi-segment); 155 of 155 described; STRING font families added (3 types); text styles bound to the type variables |
| Component Contracts | 55 | 100 | 54 icons combined into one Media/Icon set (186 of 190 components now in sets, 20 of 20 with properties); 8 of 16 sets have 3+ states (Default, Pressed, Focus, Disabled, Error added) |
| Design-Code Parity | 0 | 0 | Code Connect needs an Organization or Enterprise Dev seat. Token-level parity is covered by tokens/scripts/check.mjs instead (268 of 268 Figma values match tokens.json) |
| Accessibility | 38 | 38 | Unchanged. A1 counts the 69 hue-named primitives against the 49 semantic ones (22%); A2 cannot see the radio dot and check icon in property names; A3 finds 2 bg/on pairs. All 180 contrast pairs pass in every theme (lowest 4.58:1), which this rule set does not measure |
| Documentation Quality | 45 | 100 | 155 of 155 variables and 20 of 20 components described, every component description phrased as "Use … / Avoid …" |
| Governance & Maintenance | 90 | 90 | Unchanged within the 2.0 scope. The v1 collections and components outside the scope are now marked [Deprecated] with their 2.0 replacements |
