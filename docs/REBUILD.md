# Rebuild notes and Level 3 checklist

## Repairs made to the uploaded source

- Replaced unsupported/misaligned package configuration with a tested Next.js 16 / React 19 dependency set and refreshed lockfile; removed unused Tailwind/PostCSS configuration.
- Moved alias configuration to the project root; fixed broken API import paths.
- Added the missing slot GET endpoint and real dashboard/analytics reads.
- Replaced arbitrary user ID form fields with database sessions and server-side authorization.
- Added scrypt password verification, token-hashed sessions, logout and Redis-backed login throttling.
- Added vehicle ownership, row-locked reservations, generated uniqueness constraints, checkout/cancellation, SQL fee function, release trigger and simulated payment records.
- Implemented incident list/create/status update/withdrawal with validation and ownership enforcement.
- Removed fake Redis hit rates/latency and misleading stream/cache claims; implemented actual Redis streams and rate-limit counters.
- Added responsive UI, explicit errors/loading feedback, seed/setup scripts, container configuration, tests, CI and documentation.
- Removed unrelated R history from the distributable. Secrets/build artifacts/dependencies are excluded.

## Requirement coverage

| Requirement | Evidence / status |
| --- | --- |
| Meaningful non-CRUD problem | Concurrency-safe campus parking, fees and incident resolution |
| Two paradigms | MySQL + Redis; instructor should confirm Redis acceptance |
| ER / relational model | PROJECT_REPORT.md + database/mysql_schema.sql |
| CREATE / ALTER / DROP | Schema and isolated demonstration in queries.sql |
| INSERT / UPDATE / DELETE / SELECT | Booking, incident, session and payment route handlers |
| Advanced database concepts (minimum four) | Transactions/locking, view, function, trigger, indexes, atomic Redis operations |
| Next.js web integration | All pages and route handlers; no fake dashboard statistics |
| Minimum two roles | Customer and Staff, API enforcement tested |
| Validation and integrity | Prepared SQL, enum/check/FK/unique constraints, transactional validation |
| Environment / hashed passwords | .env.example, scrypt hashes and hashed session tokens |
| Report / screenshots / testing | docs/ and screenshots/ |
| Git / GitHub | .gitignore, README publishing steps, CI and clean source archive; remote not created |
| Two individual contributions | Team must enter real names and make genuine individual commits |
| Title uniqueness / originality | Team must confirm title uniqueness and disclose assistance per course policy |
| Vector database | Optional; intentionally omitted with justification |

## Not claimed as completed

No GitHub account login, repository push, Codespaces creation or public deployment. Docker/Dev Container configuration is supplied but was not executed because Docker is unavailable here. Runtime database validation used isolated MySQL 8.0.36 and Redis 7.0.15 binaries, while Compose/CI target MySQL 8.4 and Redis 7.4. Re-run the included checks in the target environment. No teammate contributions have been fabricated.
