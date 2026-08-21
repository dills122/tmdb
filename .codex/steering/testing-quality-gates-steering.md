# Testing And Quality Gates

Testing should protect the SDK's public behavior, TypeScript contracts, and TMDb integration
boundary.

## Default Expectations

- Add or update focused Node test-runner tests for behavior changes.
- Mock all TMDb traffic with Nock; unit tests must not depend on a live service or API key.
- Cover response-key mapping, HTTP error translation, empty/multiple results, and rate-limit behavior
  when those paths change.
- Keep fixtures small and assertions explicit.

## Before Finishing Work

Run the smallest relevant check first, followed by the complete local gates when dependencies are
available:

- Lint and TypeScript typecheck: `pnpm run lint`
- Unit tests: `pnpm test`
- Build: `pnpm run build`

There is no separate integration-test command. If a gate cannot run locally, document why and the
remaining risk.

## Quality Gates

- No known failing tests introduced by the change.
- No unrelated formatting or generated `dist/` churn.
- Public exports, TypeScript declarations, and README examples updated when behavior changes.
- `package.json` and `pnpm-lock.yaml` remain synchronized for dependency changes.
