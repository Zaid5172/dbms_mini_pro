# DBMS audit and repairs — 2 November 2026

This audit covers the saved project running against isolated real MySQL and Redis services. The user's laptop and its localhost URL were not remotely accessed. Local data should be checked with the supplied read-only audit command.

## Repairs

| Finding | Repair |
| --- | --- |
| SQL fee function returned a minimum fee even for cancelled stays | Cancelled stays return zero in the SQL function, matching cancellation records |
| Database accepted a booking user who did not own the referenced vehicle | Composite vehicle/owner unique key and matching booking foreign key enforce ownership in MySQL |
| Driver timezone conversion did not set SQL session timezone | Every pooled API connection sets MySQL time_zone to UTC; tested with database default +05:30 |
| Empty parking lots disappeared from the occupancy view | LEFT JOIN and zero-coalesced aggregates retain empty lots |
| Malformed JSON values or coercible IDs could reach the wrong error path | JSON object validation and strict positive integer validation |
| Whitespace variants used different Redis login counters | Canonical email is shared by SQL lookup and Redis rate-limit key |
| Overlapping startup probes could open multiple browser tabs | Browser-open flag is checked again after each awaited probe |
| Changing MYSQL_PORT required editing Compose separately | Compose host port now reads MYSQL_PORT from .env.local |

## Test results

The optimized production build passed. On real MySQL 8.0.36 and Redis 7.0.15, **13 tests passed, 0 failed, 0 skipped**. This includes the original integration and security tests plus nested regression tests for:

- Malformed bodies, boolean identifiers and cross-origin rejection.
- Concurrent requests for one vehicle across different spaces.
- A database-level rejection of vehicle/owner mismatch.
- Unauthorized checkout rejection.
- Forced payment failure: a temporary test-only trigger rejects payment INSERT; checkout returns an error and booking status, exit timestamp, fee and slot state all roll back.
- Ninety-minute fee calculation, simultaneous checkout and exactly one payment.
- Zero cancellation fee and no cancellation payment.
- Invalid foreign key and description CHECK rejection.
- Whitespace-resistant Redis login throttling.
- Empty-lot occupancy.

The six read-only integrity checks passed after test cleanup: slot/active-booking agreement, ownership, completed-payment amounts, unexpected payments/cancellation fees, lifecycle timestamps, and declared capacity vs actual spaces.

Fresh schema initialization passed. Migration from the previous schema was applied twice successfully and seeded users were preserved. Full command output is in dbms-audit-results.txt. MySQL DDL is not transactional: stop the website while migrating. The script refuses to add the ownership constraint if existing records violate it; it does not guess how to repair business data. Routine replacement briefly drops and recreates the fee function; retry the migration if it is interrupted.

The runtime used MySQL's default timezone +05:30 to exercise the connection timezone fix. Docker Compose targets MySQL 8.4 / Redis 7.4; those versions were not run in this cloud workspace. Earlier browser checks are recorded separately in TESTING.md; this audit focused on APIs and DBMS behavior.

## Apply to an existing local installation

1. Stop the website with Ctrl+C. Keep Docker Desktop running.
2. Copy the updated project contents into your existing smart-parking-level3 folder. Keep your existing .env.local, including MYSQL_PORT=3307 and your actual passwords. Do not delete Docker volumes or run db:init on an existing database.
3. Run:

```powershell
npm.cmd run db:migrate
npm.cmd run db:audit
npm.cmd run local
```

Migration preserves users, bookings and payments. The audit only reads records and exits with failure if it finds inconsistencies, displaying IDs rather than silently changing them. If it reports failures, retain those results for diagnosis.

For a fresh installation, use npm run local normally; the updated schema is created by db:init.
