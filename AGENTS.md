# AGENTS

AI coding guidance for this repository.

## Purpose

This repository publishes `@dills1220/tmdb`, a TypeScript Node.js SDK for The Movie Database
(TMDb) v3 API.

Optimize for:

- preserving the public SDK behavior used by downstream projects
- keeping TMDb response mapping and error behavior explicit and well tested
- small, explicit changes over broad refactors
- tests and documentation when behavior, contracts, setup, or commands change

## Architecture Boundaries

Primary areas:

- `src/Tmdb.ts`: HTTP transport plus the public TMDb client methods
- `src/types.ts`, `src/errors.ts`, and `src/index.ts`: public types, errors, and package exports
- `test/client.test.js`: Node test-runner coverage with Nock-owned HTTP fixtures

Treat `package.json`, `README.md`, and the exports and TypeScript types under `src/` as public package
contracts. Do not edit generated `dist/` output directly.

## Scope Control

- Keep changes localized to the requested behavior.
- Avoid unrelated refactors and generated artifact churn.
- Call out follow-up modernization separately from the current change.
- Do not change public methods, returned object shapes, error classes, or package entrypoints without
  explicit intent.
- Preserve compatibility with Node.js 22.13 and newer until a runtime change is deliberate and
  documented as a breaking release.

## Repository Conventions

- This is an npm project with a committed `package-lock.json`; use npm consistently.
- Source is strict TypeScript compiled to explicit CommonJS output with declaration maps.
- Follow the existing ESLint configuration and single-quote style.
- Use Node's built-in test runner and Nock for deterministic TMDb HTTP tests; do not require a live
  API key in the unit suite.
- Add focused tests for behavior changes and update the README for public API changes.

## Useful Commands

- Install dependencies: `npm ci`
- Lint and typecheck: `npm run lint`
- Test: `npm test`
- Build: `npm run build`

## Branch And PR Metadata

- The current default branch is `master`; use a feature branch for behavior, contract, test, or
  documentation changes.
- When work is ready, provide the branch name, PR title, PR summary, and test evidence.
