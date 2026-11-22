# Code Grand Prix 2026 deployment handoff

The frontend and backend are ready for deployment to a controlled verification environment. Keep contestant judging closed until the production database migration and the live Piston release gates below pass. The local application suites exercise disposable PostgreSQL schemas. The Piston protocol suite uses a mock HTTP worker, and the successful browser judging path executes one allowlisted JavaScript fixture through the test-only local runner.

## Build and run

Use matching source revisions for both repositories. The application was verified with Node.js 26.13.0 and npm 12.2.1. Use the checked-in lockfiles and generate the Prisma 5.22 client on the target platform or a matching build image.

Build the frontend from its repository root on Linux.

```sh
npm ci --include=dev
NODE_ENV=production VITE_ARENA_MODE=api VITE_API_BASE_URL=/api npm run build
```

Build the API from the backend repository root.

```sh
npm ci --include=dev
npm run prisma:generate
npm run build
```

On Windows PowerShell, use the frontend commands below. In the backend commands above, use `npm.cmd` in place of `npm`.

```powershell
npm.cmd ci --include=dev
$env:NODE_ENV = 'production'
$env:VITE_ARENA_MODE = 'api'
$env:VITE_API_BASE_URL = '/api'
npm.cmd run build
```

Serve the frontend `dist/` contents from the HTTPS site. Route `/api` and `/api/*` to Express with the path prefix intact. Serve `index.html` for frontend navigation routes such as `/arena` and `/admin/questions`. After the approved migration, load the runtime settings through the service manager and start Express from the backend repository root with `npm start` (`npm.cmd start` on Windows). This runs `node dist/server.js`.

## Backend environment

These values describe an HTTPS proxy on the same host as Express and a remote private execution gateway. Replace the example hostnames, database role and secret placeholders through the team's secret store. `VITE_*` settings are public and baked into the browser bundle.

```dotenv
NODE_ENV=production
PORT=4000
CGP_BIND_ADDRESS=127.0.0.1
API_BASE_URL=https://race.example.invalid
ALLOWED_ORIGINS=https://race.example.invalid
TRUST_PROXY=127.0.0.1
DATABASE_URL=postgresql://app_role:<percent-encoded-password>@db.example.invalid:5432/cgp_2026?schema=public&sslmode=require
ALLOW_DEV_FALLBACK=false
JWT_SECRET=<independent-high-entropy-secret-at-least-32-characters>
JWT_EXPIRES_IN=8h
COOKIE_SECRET=<different-high-entropy-secret-at-least-32-characters>
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
LOGIN_RATE_LIMIT_STORE=postgres
LOGIN_SOURCE_LIMIT=250
CONTEST_ID=cgp_2026
JUDGE_PROVIDER=piston
PISTON_API_URL=https://judge.private.example.invalid
PISTON_API_TOKEN=<private-gateway-bearer-token>
PISTON_PYTHON_VERSION=3.12.0
PISTON_JAVA_VERSION=15.0.2
PISTON_CPP_VERSION=10.2.0
PISTON_JAVASCRIPT_VERSION=20.11.1
PISTON_JAVA_SOURCE_CPU_ALLOWANCE_MS=0
PISTON_COMPILE_MEMORY_MB=512
PISTON_MAX_RUN_MEMORY_MB=1024
JUDGE_MAX_CONCURRENT_REQUESTS=2
JUDGE_REQUEST_TIMEOUT_MS=180000
JUDGE_MAX_CASES=100
MAX_SOURCE_CODE_BYTES=65536
MAX_CUSTOM_INPUT_BYTES=65536
MAX_OUTPUT_BYTES=65536
```

Set `CONTEST_ID` to the approved existing contest. Verify stored contest and round times, publication settings, visibility, and account roles through the admin interface. Those records control the event clock and release. `GET /api/contest` exposes the effective clock. The frontend polling interval can be left at the default `VITE_MONITORING_POLL_MS=2000`.

Use one HTTPS origin for the browser and API so the Secure, HttpOnly session cookie works with `SameSite=Lax`. `API_BASE_URL` and every `ALLOWED_ORIGINS` entry are exact HTTPS origins without paths or trailing slashes. The proxy must set the HTTPS forwarding information and discard untrusted client forwarding headers. Configure `TRUST_PROXY` with the actual trusted addresses or narrow CIDRs. In this setup Express and PostgreSQL stay off the contestant network. Verify certificate trust and camera/fullscreen permissions from an event workstation.

## PostgreSQL and Prisma

Use persistent PostgreSQL with a restricted runtime role that can read and write the application tables, including `login_rate_buckets`. Keep the database on a private route. Use a direct connection and the approved schema-owner migration role for upgrades. Use the database service's TLS configuration when PostgreSQL is off-host.

Back up the approved database and confirm its name and schema before migrating. The development schema checked in this release has three migrations applied and is missing `20261121130000_login_rate_buckets`. Confirm the approved event database separately. The pending migration creates the login-rate table and an expiry index. Express checks for the table at production startup.

Run the migration from the backend repository root with the approved migration `DATABASE_URL` loaded.

```sh
npm exec -- prisma migrate status
# Review the pending migration list and confirm the approved backup before proceeding.
npm exec -- prisma migrate deploy
npm exec -- prisma migrate status
```

`migrate status` can exit nonzero while a migration is pending. Resolve unexpected drift, failed migrations, or target identity before continuing. Switch `DATABASE_URL` back to the runtime connection before starting the service. Use the approved roster and contest records. The repository seed is for disposable fixtures and must stay off the event database. Integration suites require loopback PostgreSQL and create their own disposable `cgp_test_*` schemas.

## Private judge connection

The stack needs a static HTTPS site and API reverse proxy, a supervised Node.js backend, PostgreSQL, and a dedicated Linux Piston worker with Docker and cgroup v2. The worker requires a separately reviewed runner image, restricted guest access and sandbox networking disabled. See the existing guarded recovery procedure and volume details. [Piston recovery](2026-11-23-campus-release.md#recover-the-original-piston-data-volume)

The backend calls `GET /api/v2/runtimes` and `POST /api/v2/execute`. Configure `PISTON_API_URL` as an origin without a path. For a hosted backend on another machine, use a private HTTPS gateway with a trusted certificate and a bearer token. If it uses a private CA, add the approved CA to the Node process trust configuration. Permit only the backend service to reach it. The gateway should require authentication and permit only those two methods and paths. Keep the worker listener on VM loopback, and keep package management, interactive execution, and the worker port off public routes. An approved tunnel terminating at backend loopback can use `PISTON_API_URL=http://127.0.0.1:2000`. Verify its lifetime and reachability from the backend process.

| UI language | Worker runtime | Stage layout |
| --- | --- | --- |
| Python | Python 3.12.0 | Run |
| Java | Java 15.0.2 | Source compilation and execution in run |
| C++ | GCC / C++ 10.2.0 | Separate compile and run |
| JavaScript | Node.js 20.11.1 | Run |

The checked-in recovery profile permits two jobs, 512 MiB compile memory and up to 1 GiB run memory. The backend enforces one active request per candidate and two total per process in the settings above. Keep one backend instance for this profile until the aggregate admission behavior is rehearsed. Confirm question memory limits fit the worker. A submission can make one execution call per test case. The 180-second backend request deadline covers all cases. Give the API proxy enough time to return the backend outcome within the browser's 240-second execution request timeout.

The Java run-stage budget includes compiler and JVM startup. Keep the allowance at zero unless the organizer explicitly approves the documented policy for the pinned Java runtime. A split compile/run Java runtime can preserve a strict contestant-only run budget. Verify timing at the approved limits before opening Java submissions. [Piston integration and resource policy](piston-integration.md#java-source-file-cpu-policy)

## Verify deployment

Run these once the controlled environment is up. Substitute the real event origin.

```sh
export CGP_ORIGIN=https://race.example.invalid
curl --fail-with-body --silent --show-error "$CGP_ORIGIN/api/health"
curl --fail-with-body --silent --show-error "$CGP_ORIGIN/api/contest"
curl --silent --show-error --output /dev/null --write-out '%{http_code}\n' "$CGP_ORIGIN/api/auth/me"
```

Expect health HTTP 200 with `status=healthy`, `database=connected` and `judgeProvider=piston`. The health route probes PostgreSQL. Check the private runtime catalog and an actual execution independently. The contest response should match the intended round and release state. `/api/auth/me` should return 401 without a session.

Run the catalog check from the backend host. Load `PISTON_API_URL` and, for the remote gateway, `PISTON_API_TOKEN` from the service's approved secret source.

```sh
node --input-type=module <<'NODE'
const { PISTON_API_URL, PISTON_API_TOKEN } = process.env;
const headers = PISTON_API_TOKEN ? { Authorization: `Bearer ${PISTON_API_TOKEN}` } : {};
const response = await fetch(new URL('/api/v2/runtimes', PISTON_API_URL), {
  headers, redirect: 'error', signal: AbortSignal.timeout(5000)
});
if (!response.ok) throw new Error(`Judge catalog HTTP ${response.status}`);
for (const { language, version } of await response.json()) console.log(language, version);
NODE
```

Once the operator confirms the recovered worker passed its initial Python smoke test, compare the advertised catalog with the four pins. Apply the existing serial and two-job sequence only while the worker and kernel stay stable. Run `npm run test:piston` from the backend checkout against local disposable PostgreSQL only after the operator approves live integration testing. Use the same pins and resource policy as the event. Run the isolation and capacity rehearsal before opening the event. [Live Piston verification](piston-integration.md#verification-and-event-capacity)

From an event workstation, verify secure login and refresh for a test candidate, check-in, editor, public Run, Submit with a known solution, verdict, and the expected leaderboard score. Verify a sample-only solution fails private judging without exposing hidden inputs or outputs. Check admin publish and round transitions, volunteer lock and resume, results visibility, and sign-out using approved test accounts in a verification contest. Verify that contestants can reach the HTTPS site and cannot reach Express, PostgreSQL, or Piston directly.

## Launch restrictions

- Confirm the approved event database is backed up and all migrations are applied before starting the production API.
- Keep contest submissions closed until a recovered worker passes repeatable live Python, Java, C++ and JavaScript execution at event limits, isolation checks, and an organizer-approved capacity rehearsal. Stop the rehearsal on stalls or kernel lockups.
- Keep the API private behind the HTTPS proxy and the judge on its restricted route. Verify browser trust, camera/fullscreen, permissions and the deployed end-to-end flow on actual event machines.
- The current application checks cover local HTTP, disposable PostgreSQL, Chrome and the Piston protocol mock. The stopped Piston worker, production migration and deployed environment require separate verification.
