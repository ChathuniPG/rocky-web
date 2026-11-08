# Continuous integration — rocky-web

CI runs on GitHub Actions (issue #16, NFR-MNT-02). The workflow is
`.github/workflows/ci.yml`; if this page and the workflow disagree, the workflow wins.

## When it runs

- Every pull request (any target branch).
- Every push to `main`.

A newer push to the same branch or PR cancels the run it supersedes.

## What it checks

| Job (status check name)        | Steps                                                                                                                                   |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `Lint, typecheck, test, build` | `npm ci`, `npm run lint`, `npm run format:check`, API types check, `npm run typecheck`, `npm test` (unit tests), `npm run build` |

The job uses Ubuntu and the Node.js version in `.nvmrc`. The npm cache is enabled through
`actions/setup-node`, and `.next/cache` is cached with `actions/cache` as the Next.js CI build
caching guide recommends, so repeat builds are faster.

**API types check.** `src/lib/api/schema.d.ts` is generated from `docs/openapi.json`. CI runs
`npm run generate:api` and then `git diff --exit-code -- src/lib/api/schema.d.ts`, which fails the
job if the contract was updated without regenerating the types. Fix: run `npm run generate:api`
locally and commit the result.

## Why no secrets are needed

- There is no `.env` in CI.
- `next.config.ts` validates two server-only variables through `parseServerEnv`
  (`src/lib/server-env-schema.ts`): `FIREBASE_STORAGE_BUCKET` (required) and `API_INTERNAL_URL`
  (optional). They are used only for the `next/image` allow-list and the `/api` rewrite, which
  matter when the app is served. CI only builds and never serves, so the workflow sets clearly
  fake placeholders (`rocky-ci-placeholder.invalid`, `http://rocky-api.invalid`). Neither is a
  secret in production either.
- The frontend never handles tokens (ADR-003) and never calls Firebase or the database (ADR-004),
  so there are no credentials to provide.

## Supply-chain hardening

- The workflow token is read-only (`permissions: contents: read`).
- `actions/checkout` runs with `persist-credentials: false`, so the token is not left in `.git/config`.
- Every action is pinned to a full commit SHA, with the release in a comment.

**Bumping a pinned action.** Find the new release on the action's releases page (e.g.
`https://github.com/actions/checkout/releases`) and read its changelog. Look up the commit the tag
points to, for example:

```bash
git ls-remote --tags https://github.com/actions/checkout.git "refs/tags/v7.0.1" "refs/tags/v7.0.1^{}"
```

If a `^{}` line is printed (an annotated tag), use its SHA; otherwise use the single SHA. Update the
SHA and the version comment together, everywhere the action is used.

## What CI does not cover

CI runs no end-to-end tests: they would need a running rocky-api with its live Firebase project.
End-to-end behaviour is verified manually under `next dev` against a local rocky-api, and by the
accessibility audit (`docs/accessibility-audit.md`).

## Branch protection

Under **Settings → Branches → Branch protection rule for `main`**, enable "Require status checks
to pass before merging" and add the check `Lint, typecheck, test, build`. A check only shows up in
the search box after it has run at least once in the repository.
