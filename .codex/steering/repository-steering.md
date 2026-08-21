# Repository Scope And Priorities

This repository builds and publishes `@dills1220/tmdb`, a small Node.js SDK for The Movie Database
v3 API.

Primary deliverables:

- the `Tmdb` client and its public methods in `src/Tmdb.ts`
- TypeScript declarations and stable error classes exported from `src/`
- compiled package output generated into `dist/` during build and publish

Core priorities:

- compatibility for existing downstream consumers
- deterministic request, response-mapping, throttling, and error behavior
- stable typed contracts and intentional package exports
- maintainable pnpm-based local workflows

## Active Boundaries

- `src/Tmdb.ts` owns TMDb HTTP calls, rate-limit handling, and resource mapping.
- `src/types.ts`, `src/errors.ts`, and `src/index.ts` own the public package contract.
- `test/client.test.js` owns behavior tests and isolated Nock fixtures.

## Safe Refactor Boundaries

Do not refactor these without explicit instruction:

- public class methods and returned object shapes
- exported errors and TypeScript types
- the package name, entrypoint, or supported runtime range
- API authentication and rate-limit behavior

Safe default changes:

- focused client-method additions
- defensive response and error handling
- isolated test additions
- typing and documentation improvements that preserve runtime behavior
