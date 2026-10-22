# Maintainex visual direction v2

21 October 2026. Generated design concepts using the built-in image-generation tool. These images are visual references, not implemented screens, tested interfaces or evidence of production readiness. All depicted records and metrics are illustrative.

## Accepted direction and constraints

- Reference current Kaggle's public homepage and Code page for hierarchy, neutral controls and reusable component families; Deep-ML for technical identity and adjacent work context; LeetCode for practical catalogue density; CodeChef for predictable categories. Reference screenshots are in `references/`.
- Preserve a dark charcoal/lime identity. One consistent brand accent; no arbitrary per-feature bright colors.
- Use an original contour-and-commit graphic on the public homepage. Inside the application, restrict the motif to a subtle header detail so it does not compete with daily work.
- Keep all six withdrawn features absent: leaderboards, reports, repository discovery, quests, recommendations and saved opportunities.
- Public-first: entering the site must not require login or signup. Visitors should have useful static, account-independent content. Private work and account-specific features remain a separate concern. Detailed public/private boundaries and authentication changes are explicitly deferred. No authentication behavior was changed by this design task.
- A static product preview must be labeled as example content. Never imply anonymous access to private records or fabricated live data.

## Shared palette

| Semantic token | Value | Usage |
| --- | --- | --- |
| canvas | #101211 | Page background |
| surface | #181b19 | Panels, rows and forms |
| elevated | #202521 | Menus, inspectors and selected neutral surfaces |
| border | #303632 | Fine structural dividers |
| text | #f0f2ed | Primary text |
| muted | #a8b1aa | Supporting text |
| accent | #c4e876 | Main action, selection, focus, single-series data |
| on-accent | #101211 | Text on a filled accent control |

Do not introduce per-page palettes. All charts use neutral shades plus the same accent. Status differences use text and icons. If a semantic danger color is later approved, give it a single central token and restrict it to real destructive/error states, never ordinary category decoration. Generated activity form artwork includes a conventional red field error; that is a deviation from the stricter monochrome-plus-lime direction and must not be copied into implementation without that decision.

## Reusable implementation contract

Tokens belong in one shared theme source. Colors, radii, spacing, typography, focus, selected, disabled, loading and error behavior must be centralized. These are reference tokens, not an accessibility conformance claim; measure contrast in implementation.

Implement shared AppShell, PageHeader, Button, Input, Select, FilterBar, FilterChip, Tabs, StatusBadge, SourceBadge, MetricStrip, DataTable, DetailPanel, FormSection, AsyncState and Feedback components. Page components compose these rather than copying their styling. New/edit forms for the same entity share one form component with a mode and initial values. List/board views share query state and records. Link-backed detail routes remain available even when an inspector is used.

Reference token names are in `tokens.css`. This file is design documentation; it is not imported into the running application.

## Review before implementation

Image models can introduce inconsistent sample counts, labels, source semantics, navigation selection, colors and form validation. Generated microcopy is not authoritative. The implementation must follow the research brief, real schema/API contracts, and this shared system rather than reproduce incidental image mistakes.

Daily-use readiness still needs keyboard/focus testing, narrow-screen layouts, long titles, realistic record counts, pagination, exact scope labels, loading/empty/error/stale states, failed-save recovery and account/privacy behavior. A visual mockup cannot establish those properties.

## Coverage

The public homepage is `00-public-home.png`. The generated boards use four screen compositions per image. See `coverage.md` for exact completion status, routes and prompt references. Older concepts are superseded, not an alternative palette.

## Live references inspected

- [Kaggle public homepage](https://www.kaggle.com/)
- [Kaggle Code](https://www.kaggle.com/code)
- [Deep-ML homepage](https://www.deep-ml.com/)
- [LeetCode problem catalogue](https://leetcode.com/problemset/)
- [CodeChef practice](https://www.codechef.com/practice)

Only public layouts were inspected; account-specific experiences were not accessed.
