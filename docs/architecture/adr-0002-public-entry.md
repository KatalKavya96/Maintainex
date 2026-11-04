# ADR 0002 — Public entry and daily workspace

Date: 2026-10-22. Status: accepted by the user ("all good implement it").

`/` becomes an account-free, backend-independent explanation of Maintainex. Its preview is explicitly illustrative. `/dashboard` is the signed-in Overview; `/community` owns the existing feed; `/feed` remains an alias. Private routes redirect to login with a validated local return path. Auth never returns to externally supplied URLs. No server auth or ownership rules change.

Private activity state mounts inside the workspace, rather than issuing personal-record requests from the public homepage. Public entry renders even if session validation is unavailable. Theme preference persists on this device.

Work and Pins default to compact lists, retain optional board/grid presentations, and fetch 25 records per page. Request responses from superseded filters are ignored. Totals come from list responses; a board shows its current page. Overview fetches three records for each of three active statuses and uses server totals per status. It is a status queue, not an exhaustive overdue-work report. Activity analytics explicitly describe their existing 1,000-record loading cap.

Shared collection controls own presentation only. Features own API operations, filters, pending/error state and drafts. A pin can seed a work form; only a successful explicit save creates work. No persistent pin/work relation is claimed. Existing archive/favorite/icon values survive pin edits.

Withdrawn features remain withdrawn. No migrations, deployment or branch-protection changes are part of this decision. Local rules and CI remain engineering guardrails, not an absolute agent sandbox.
