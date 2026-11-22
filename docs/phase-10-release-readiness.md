# Code Grand Prix 2026 Phase 10 release report

**Decision for November 23, 2026 — NO-GO for live judging.** Select a dedicated Linux Judge0 VM for the rehearsal. The application passed its outage and ordinary browser regression checks. There is no approved live judge endpoint, credential, or confirmed contestant capacity in this session. Treat the existing Compose profile as a development rehearsal profile until it passes the gates below.

## Deployment options

| Criterion | Hosted Judge0 CE | Dedicated Linux Judge0 CE |
| --- | --- | --- |
| Availability and access | Judge0's official RapidAPI listing advertises pay-per-use Basic and paid plans with 2,000, 5,000, or 10,000 submissions per day before overages. An organizer-owned account, selected plan and server-side application key are required. The provider also lists dedicated cloud options, with terms to confirm directly. | An organizer-provisioned x86_64 Ubuntu 22.04 VM with Docker Engine and Compose. The Judge0 CE 1.13.1 release procedure calls for cgroup v1. The repository start script checks the actual engine and rejects Docker Desktop. |
| Compatibility | RapidAPI requires `X-RapidAPI-Key` and `X-RapidAPI-Host`. The existing adapter sends native `X-Auth-Token`, verifies CE version 1.13.1, and resolves exact active runtime names. RapidAPI requires a separately verified adapter change. A provider-issued direct CE endpoint with native authentication may be compatible after testing. | The repository pins the upstream `judge0/judge0:1.13.1` tag and configures native authentication. Verify the deployed image digest and OS, then discover the exact active Python, Java, C++ and JavaScript runtime IDs from that instance. |
| Limits and reliability | The daily quotas are billing allowances. They do not establish peak requests per second, concurrent jobs, queue time, or per-runtime CPU and memory ceilings. Confirm the plan's limits and how it meters job creation and result polling. Test latency and error rates from the backend's actual egress during the rehearsal window. | The profile sets two workers and a 16-job Judge0 queue. The backend defaults to four concurrent execution requests per process and one per candidate. Actual sustainable throughput, queue delay, and memory requirements are unmeasured. |
| Privacy and security | The provider would receive contestant source and per-case input, including hidden input on Submit. Expected output comparison stays in the competition backend. Obtain organizer approval of processing, region, retention, deletion, network policy and support terms before sending competition data. | Contest source and inputs stay on organizer-controlled infrastructure. The worker runs privileged for Isolate. Give its VM no application database, application secrets, unrelated workloads, host data mounts or Docker socket. Restrict private ingress and outbound access, and review the VM, image digests and bundled runtimes. |
| Competition suitability | Conditional on compatible authentication, confirmed burst capacity, processing terms, and a successful regional rehearsal. A daily advertised quota or public demo endpoint is insufficient. | Preferred for the current adapter and for keeping source and hidden input under organizer control. Completion depends on the approved VM and live isolation, capacity and recovery checks. |

[Official Judge0 CE marketplace plans](https://rapidapi.com/judge0-official/api/Judge0%20CE/pricing) · [RapidAPI authentication](https://docs.rapidapi.com/v2/docs/configuring-api-security) · [RapidAPI rate-limit headers](https://docs.rapidapi.com/docs/response-headers) · [Judge0 pricing and support](https://judge0.com/) · [Judge0 CE API](https://ce.judge0.com/docs) · [Judge0 CE 1.13.1 release](https://github.com/judge0/judge0/releases/tag/v1.13.1)

## Evidence from this host

- Docker Desktop reports Linux x86_64, **cgroup v2**, 12 CPUs and approximately 7.4 GiB of memory. Docker Compose v5.6.0 accepted the repository profile with environment-file resolution disabled. This validates the Compose structure. The existing launcher rejects the engine's cgroup mode. The PostgreSQL port at 5433 was reachable and Judge0 port 2358 refused connections.
- `npm.cmd run test:judge0` exited at configuration. There was no authenticated live endpoint. Python, Java, C++ and JavaScript execution were **blocked and unverified**. Live verdicts, time and memory enforcement, isolation, real scoring, simultaneous load, and recovery under live load remain unverified.
- Frontend ESLint and the API-mode production build, including TypeScript, passed. The backend build and six automated suites passed. The latter included 94 admin/round HTTP checks and 24 Judge0 protocol-fixture HTTP checks. The protocol fixture covered failure responses and zero-score failure persistence. It exercised the adapter's HTTP behavior with controlled responses.
- The existing Chrome regression passed against the real Express API and an isolated PostgreSQL schema. It checked role access, check-in, actual HTTP 503 for Run and Submit, reconnection, volunteer authorization with draft retention, admin publication, candidate hints, round changes, leaderboard visibility and 390 px layout. This was an outage regression. The full four-language competition rehearsal remains gated on live judging.
- No production deployment, purchase, Windows Docker configuration change, or event database modification took place.

## Release security and operations review

| Area | Current implementation and remaining gate |
| --- | --- |
| Judge isolation | Compose binds the API to the VM's loopback, puts PostgreSQL, Redis, and workers on a private Docker network, and exposes only the API through an ingress bridge. Credentials are generated into a protected file. The profile disables job networking, callbacks, added files and per-job compiler/argument overrides. Only the worker is privileged. CE 1.13.1 fixes the three issues listed in its release notes. Review guest firewall and network separation on the actual VM and run the live suite with a controlled, disposable network canary and fixture-only data. |
| Readiness | The API's `/api/health` queries PostgreSQL and reports the configured judge provider. Require a separate authenticated judge check and execution smoke test per runtime before opening a round. Watch worker count, queue depth, HTTP 429/503, failures and latency. |
| Backend protections | Production config rejects the local judge and in-memory fallback, requires secure cookies and a high-entropy JWT secret, and verifies users and roles from the database. The backend checks check-in, round/question availability and session lock before judging. Judge failures fail closed. Hidden expected outputs stay in the backend, and public problem responses omit private cases. |
| Browser and API deployment | Serve the frontend and `/api` at the same HTTPS origin. Inject production-only secrets on the backend, set `COOKIE_SECURE=true`, `COOKIE_SAME_SITE=lax`, and set `ALLOWED_ORIGINS` to the approved HTTPS origin. Browser auth uses an HttpOnly cookie. The login API also returns a legacy bearer token in JSON. Ensure the proxy, APM and client telemetry exclude response bodies, cookies and authorization headers. Review request logging before launch and keep source, judge tokens and case data out of access logs. |
| Shared-network login | The current limiter counts **15 login attempts per IP per 15 minutes**, including successful requests. Many lab computers may share one address. Express has no explicit trusted-proxy topology configured, and the limiter uses process-local state. Rehearse from the actual lab route and agree on a proxy/IP and rate-limit policy before launch. |
| Schedule | The sample backend environment lists 05:30–08:30 UTC on November 23, 2026, equivalent to 11:00–14:00 IST. The landing countdown targets the event date at midnight IST. Confirm the real start and end with the organizer and verify the persisted contest and round windows via `/api/contest`, the admin catalogue, and the candidate lobby. |
| Database and backups | Provision a separate event database and runtime credentials. Confirm the deployment target before applying migrations. Seed fixtures only in disposable/local rehearsal schemas. Use the managed snapshot/PITR setup and an encrypted logical backup. Restore a backup into a separate database and check contests, accounts, questions, submissions, scores, hint receipts and audit totals. Record recovery time and data-loss window. |
| Restart and rollback | The Compose judge services do not automatically restart, Redis persistence is disabled, and the Judge0 database volume persists. A backend process interrupted during judging can leave a queued application submission, with no startup reconciliation in the reviewed code. Pause admission or close traffic for the drill. Record pending IDs, restart through the approved service procedure, confirm stale jobs are handled under organizer policy, and replay only eligible fixture actions. Re-run judge preflight before reopening access. Keep the previous app release and configuration available. If the migration is incompatible with an app rollback, test restoring a snapshot into a separate database before switching traffic. |

[Judge0 advisories](https://github.com/judge0/judge0/security/advisories) · [Upstream Compose reference](https://github.com/judge0/judge0/blob/v1.13.1/docker-compose.yml) · [PostgreSQL backup documentation](https://www.postgresql.org/docs/current/backup-dump.html)

## Startup on approved infrastructure

On the dedicated Linux VM, use the upstream Ubuntu 22.04 boot instructions for cgroup v1 and confirm the running engine after reboot. Run from the backend checkout on that VM. The existing script generates Judge0-specific secrets and brings up the private rehearsal stack.

```sh
docker info --format '{{.OSType}} {{.CgroupVersion}} {{.Architecture}} {{.NCPU}} {{.MemTotal}}'
docker compose version
CGP_DEDICATED_JUDGE_VM=1 sh ops/judge0/start.sh
docker compose -f ops/judge0/compose.yaml ps
```

For a Windows rehearsal backend, use an SSH route approved for that VM. Inject its `AUTHN_TOKEN` as `JUDGE0_API_KEY` into the backend process via the approved secret channel. Use a private HTTPS judge URL for a non-loopback connection.

```powershell
ssh -N -o ExitOnForwardFailure=yes -L 127.0.0.1:2358:127.0.0.1:2358 operator@private-judge-vm
```

In a separate Windows terminal, configure the backend with the rehearsal database. The live suite creates its own disposable schema on a local PostgreSQL connection. Use the approved disposable canary with `JUDGE0_TEST_NETWORK_CANARY` to complete the private-network denial check.

```powershell
Set-Location C:\Users\Saksham\code-grand-prix-backend
npm.cmd ci
npm.cmd run prisma:generate
$env:JUDGE_PROVIDER = 'judge0'
$env:JUDGE0_API_URL = 'http://127.0.0.1:2358'
$env:ALLOW_DEV_FALLBACK = 'false'
npm.cmd run test:judge0
```

After the live suite passes, start the backend for the browser rehearsal with the approved staging database and fixture accounts. Confirm the target before the migration. The event deployment uses an approved backend revision and production configuration behind the HTTPS proxy.

```powershell
npm.cmd exec -- prisma migrate deploy
npm.cmd run dev
# Production artifact commands, under production configuration
npm.cmd run build
npm.cmd start
```

```powershell
Set-Location C:\Users\Saksham\code-grand-prix-website
npm.cmd ci
$env:VITE_ARENA_MODE = 'api'
$env:VITE_API_BASE_URL = '/api'
$env:CGP_API_PROXY_TARGET = 'http://127.0.0.1:4000'
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
# Publish the approved build through the same HTTPS origin as /api
npm.cmd run build
```

Example backup and restore rehearsal with approved libpq service definitions and a verified empty restore database. Keep credentials out of command arguments and store the archive encrypted.

```sh
PGSERVICE=cgp-event-backup pg_dump --format=custom --file=cgp-event.dump
pg_restore --list cgp-event.dump
PGSERVICE=cgp-empty-restore-rehearsal pg_restore --exit-on-error --no-owner --no-privileges --dbname='service=cgp-empty-restore-rehearsal' cgp-event.dump
```

## Remaining gates

1. Supply an approved x86_64 Linux VM with operator access and private routing, or an approved compatible hosted endpoint. Inject its native Judge0 token into the backend and confirm the allocated resources. Provide an organizer-confirmed peak contestant count and lab network layout.
2. On the approved endpoint, pass all four real languages, accepted and rejected submissions, compiler/runtime errors, timeouts, resource ceilings, credential-environment and job isolation checks, and the private network canary. Verify zero awards on failed judging and authoritative scoring on accepted submissions.
3. Run the admin/candidate/volunteer rehearsal on staging after the judge passes. Run public samples, Submit and verify verdicts in each language, then reconcile deductions and leaderboard. Verify lock/recovery and the draft again during the live-judge rehearsal.
4. Measure the confirmed peak against approved rehearsal infrastructure. Each Run uses one job per public sample, or one with custom input. Each Submit can use one per public or hidden case until failure. Budget job creation and result polling separately. Record login, question, queue, execution, polling and database timings, percentile latencies and error rates, app and Judge0 CPU/memory, leaderboard refresh, queue drain, and restart recovery. The process-local admission limit is not a capacity measurement.
5. Complete and record HTTPS and reverse-proxy checks, shared-IP login burst, restore verification, final schedules and restart drill. Keep the decision at **NO-GO** until live isolated execution and the agreed capacity are demonstrated.
