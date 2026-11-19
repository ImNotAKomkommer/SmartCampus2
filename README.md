# Smart Campus Room Availability Checker - Practice #11

A fictional, read-only React + TypeScript campus room checker with an **optional mock AI-style explanation**. The original availability decision is produced exclusively by `src/availability.ts`; explanations cannot change booking status or data.

## Requirements

- Node.js 20+ with npm.
- Internet access is required once for `npm ci` (unless the npm package cache is already populated).
- No LLM API key, account, server, database, or production service is needed. **The explanation adapter is intentionally a mock.**

## Setup and verify

```bash
npm ci
npm run dev
npm test
npm run typecheck
npm run lint
npm run build
```

Run these in the `SmartCampus_Final` directory. `npm test` compiles pure TypeScript modules using `tsconfig.tests.json` and runs Node's built-in test runner against the compiled modules. The local test runner does not require the React application or browser.

## Feature walkthrough

1. Select one of four fictional rooms (Athena 101, Curie 204, Newton 310, Darwin 112).
2. Use the attendee count and required-equipment checkboxes to filter rooms.
3. Enter a candidate time. The application uses a fixed fictional current time of 09:00.
4. Read the **authoritative** Available/Unavailable result and timeline.
5. Click **Explain availability** under the result. The optional mock adapter gives at most two sentences explaining the already-confirmed status. It never creates a booking.
6. Try a blocked room (Newton 310), a conflicting time (Curie 204 at 10:00-11:00), and an available time (Athena 101 at 10:00-11:00).

The optional explanation uses only `roomLabel`, `startTime`, `endTime`, `isAvailable`, and `reasonCode`. No fictional booking titles or owner labels are sent to the mock. Input shape/length and output contents are validated. A timeout or adapter error returns a **deterministic fallback**. A strict allowlist of explanations prevents unsupported claims from an untrusted adapter response.

## Main source files

- `src/availability.ts`, `src/availabilityView.ts`: unchanged deterministic decision and room-specific view logic.
- `src/explanation/explanation.ts`: mock adapter, three prompt-design candidates, input/output checks, timeout and fallback.
- `src/explanation/reasonCode.ts`: maps a confirmed status/reason to an explanation reason code; does **not** make availability decisions.
- `src/components/ExplanationPanel.tsx`: opt-in button and separately labeled mock explanation.
- `src/App.tsx`: renders the optional explanation panel below the confirmed result, keyed to the selected room/interval to avoid stale context.
- `tests/logic.test.cjs`: 28 original availability/filter/integration tests.
- `tests/explanation.test.cjs`: 18 new explanation and failure-mode tests.

## Real verification results in this package

- Baseline (`npm test` before feature): **28 passed / 0 failed**.
- First feature version (`npm test`): **44 passed / 2 failed**. Confirmed missing label length limit and missing timeout.
- Final feature (`npm test`): **46 passed / 0 failed** (28 original plus 18 explanation tests).
- `npm run build` and `npm run lint` were attempted in the offline analysis environment but could not execute because `vite` and `eslint` are not installed. These must be repeated after `npm ci` in a development environment; do **not** treat a passing Node test as proof that the React bundle builds.
- **Browser interaction, mobile responsiveness for the new component, and deployment are not yet independently verified.** Capture screenshots after running the app.

## Limitations and trust boundaries

- This project uses a clearly labeled mock adapter; it does not call a real LLM and does not demonstrate real model latency, cost, or nondeterminism. The prompts are design candidates, not results of three live LLM calls.
- The adapter timeout does not abort an underlying network request; a future server-side adapter would need `AbortSignal`, server-side secret management, budgets, and logging.
- `reasonCodeFromResult` classifies the existing checker's English reason strings. If those messages change, update and retest the mapping. A first-class reason code in the deterministic engine would be a future improvement.
- HTML time inputs cannot directly enter a 24:00 endpoint; the numeric engine tests that boundary separately.
- No login, personally identifying data, external service, persistence, or payment feature is used.
