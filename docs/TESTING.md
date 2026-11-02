# Validation evidence — 2 November 2026

**Latest DBMS regression run:** 13 tests passed, zero failures or skips; six integrity checks passed. See [DBMS_AUDIT.md](DBMS_AUDIT.md) for fixes, migration, timezone conditions and expanded coverage. The original run below is retained as earlier evidence.

## Environment

Cloud development workspace, Node.js 24.22.1, npm 11.9.0, Next.js 16.4.3 / React 19 (exact resolved packages in package-lock.json), real MySQL 8.0.36 and Redis 7.0.15. System packages were unpacked into an isolated workspace runtime because the default package mirror/system installation was restricted. MySQL was bound to loopback with its unsupported Unix socket disabled. Services and tests ran together because separate execution commands have isolated network namespaces.

The distributable contains standard Docker Compose configuration targeting MySQL 8.4 and Redis 7.4; those container versions and GitHub Actions have not been executed here. No account login or hosted deployment was performed.

## Automated tests

`npm run build`: **PASS** — optimized production routes compile. The final build uses webpack to avoid an environment-specific Turbopack persistence error.

`RUN_INTEGRATION=1 npm test`: **3 tests passed, 0 failures, 0 skipped** in the real-service run. Two unit tests cover salted password verification and token/identifier behavior. One integration test exercises this sequence:

| Check | Expected outcome | Observed |
| --- | --- | --- |
| Anonymous space listing | 401 | Pass |
| Customer and staff login, browser-style Origin header | 200 and session cookies | Pass |
| Customer attempts staff incident update | 403 | Pass |
| Invalid/injection-like slot identifier | 400 | Pass |
| Simultaneous reservation requests for one space | Exactly one 200 and one 409 | Pass |
| Immediate checkout | ₹15 minimum fee | Pass |
| Second checkout | 409 | Pass |
| Release trigger | Space becomes Available | Pass |
| Payment uniqueness | Exactly one payment record | Pass |
| Incident submission | Record inserted | Pass |
| Staff resolves incident | 200 | Pass |
| Customer withdraws resolved incident | 409 | Pass |
| Redis diagnostics | Online | Pass |
| Logout and old-session reuse | Logout 200, subsequent access 401 | Pass |

`GET /api/health`: **200**, `{"mysql":true,"redis":true}`.

`npm audit --omit=dev --audit-level=high`: **0 reported vulnerabilities** in the installed production dependency tree at verification time. This is dependency evidence, not a comprehensive security audit.

`git diff --cached --check`: **PASS** before packaging. Runtime credentials, database data, build artifacts and dependencies are excluded from the archive.

## Browser validation

**PASS:** sign-in, reservation, checkout, incident create/withdraw, analytics and mobile overflow check; zero browser page errors.

The Playwright script is `scripts/browser-test.cjs`. It signs in, visits the dashboard and parking pages, reserves a space, checks out, submits/withdraws an incident, visits analytics, checks mobile horizontal overflow and collects page errors. Captures are in `docs/screenshots/`.

The environment required Chrome Headless Shell in single-process mode because Unix sockets are blocked; the standard Playwright browser download failed, so an independently downloaded headless binary was used. Normal target environments should use `npx playwright install chromium` and `npm run test:browser` with the app and databases running. The script expects a fresh seeded development database and leaves a completed demo stay; do not run it against production.

A real browser check caught and led to a fix for Origin validation: Next.js's internal URL origin differed from the browser-facing Host. Mutation checks now use configured APP_ORIGIN or the actual request Host. The API suite was updated to always send an Origin header.

## Limits

No public hosting, Codespaces creation, Docker execution, real payments, load/penetration testing, comprehensive accessibility audit, or team-authored contribution history is claimed. UI values refresh on navigation or explicit refresh rather than a push feed. Screenshots are demo data, not real customer activity.
