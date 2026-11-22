# Code Grand Prix 2026 campus release

**NO-GO for scored competition on November 23.** The application can be rehearsed with an unavailable judge. Open scoring only after the VM and all live release gates pass. Keep the round paused during recovery. If the judging gates remain unmet at the organizer's cutoff, postpone the scored round. An optional unscored practice session can use pre-distributed practice questions and local editors. Keep practice outside official submissions and standings.

## What was verified

- VirtualBox reported `CGP-Judge-Server` running with four vCPUs and 6 GiB RAM. It has one NAT adapter and forwards SSH through Windows loopback port 2222. The Windows Piston endpoint on port 2000 refused connections. Noninteractive SSH could not authenticate, so guest Docker state and the current kernel log require an authorized operator. Docker Desktop showed the separate Code Grand Prix PostgreSQL container listening only on `127.0.0.1:5433`. The configured development schema has three published or scheduled questions with a maximum memory limit of 512 MiB. Prisma reports `20261121130000_login_rate_buckets` pending in development. Production startup requires its table. Apply migrations only after confirming and backing up the approved event target.
- The VirtualBox host log showed its Hyper-V compatibility path in reduced-performance mode. The reported guest watchdog soft lockups and historic execution stalls warrant reviewing the guest stack traces and VM scheduling. The host log does not establish a cause. Memory-cgroup kills observed in the prior rehearsal rejected intentionally oversized jobs and do not establish VM-wide or host-wide memory pressure. [Linux lockup watchdogs](https://docs.kernel.org/admin-guide/lockup-watchdogs.html)
- The candidate, admin, and volunteer browser regression used real Express and disposable PostgreSQL. It covered the landing page, login, check-in, lobby and locked arena refresh, all four CodeMirror language starters, unavailable-judge Run and Submit, network interruption, retained drafts, publishing and hidden-case protection, hint deductions, round state, standings visibility, and volunteer recovery. Chrome used a synthetic camera feed and injected rejected camera and fullscreen requests to exercise the error paths.
- Loopback production HTTPS was verified using the checked-in Caddyfile, a temporary certificate, API-mode assets, real production-mode Express and disposable PostgreSQL. It covered SPA routes, the HTTPS gate, approved browser origin, Secure HttpOnly cookies, identity restoration, check-in, and an actual unavailable-Piston submission persisted as failed with zero points. Campus DNS, certificate trust, and lab routing still need verification from a lab machine.
- Frontend TypeScript, ESLint, production build, and four frontend verification scripts passed. Backend build, TypeScript, and nine automated suites covered database and HTTP integration, roles, auth, admin workflows, session locks, hints, scoring and provider protocol responses. Judge0 and Piston protocol suites use mocks. Live Piston smoke stopped at transport, so no fresh live verdict or isolation check was possible.

## Files changed

- `src/config/env.ts`, `src/server.ts`, and `.env.example` define the loopback bind and document the Piston memory ceiling.
- `src/judge/piston.adapter.ts` checks the configured memory ceiling and applies an execution cooldown after timeouts. `tests/piston-protocol.test.ts` exercises both failure paths.
- `ops/piston/compose.yaml` preserves the original data mount and sets the worker envelope. `ops/piston/recover.sh`, `ops/piston/recovery-check.py`, and the `ops/piston/start.sh` wrapper inspect, start and monitor the separate recovery worker. `tests/piston-smoke.ts` and `package.json` expose Windows end-to-end tunnel smoke checks.
- `ops/campus/Caddyfile` serves the SPA and API under one TLS origin. `docs/piston-integration.md` describes the updated worker envelope.
- The frontend's `scripts/verify-backend-browser.mjs` covers the landing page, permission denial and recovery, and all four CodeMirror language starters. The application UI and design assets are unchanged.

## Recover the original Piston data volume

The original Docker installation used `-v cgp-piston-data:/piston`. The installed runtimes are under `packages/` inside that volume. The recovery Compose file mounts the existing external volume at the same root path and disables image copy-up. The separate `cgp-piston-recovery` project leaves `cgp-piston` and `cgp-piston-backup` stopped. [Docker Compose external volumes](https://docs.docker.com/reference/compose-file/volumes/)

Keep the competition paused during recovery. From Windows PowerShell, copy only the recovery files and open an interactive SSH session using the verified host key.

```powershell
Set-Location C:\Users\Saksham\code-grand-prix-backend
$cgpSsh = 'saksham@127.0.0.1'
ssh.exe -o StrictHostKeyChecking=yes -p 2222 $cgpSsh 'install -d -m 700 "$HOME/cgp-piston-recovery"'
if ($LASTEXITCODE) { throw 'Unable to prepare the guest directory' }
scp.exe -o StrictHostKeyChecking=yes -P 2222 ops/piston/compose.yaml ops/piston/recover.sh ops/piston/recovery-check.py "${cgpSsh}:cgp-piston-recovery/"
if ($LASTEXITCODE) { throw 'Unable to copy the recovery files' }
ssh.exe -t -o StrictHostKeyChecking=yes -p 2222 $cgpSsh
```

On Ubuntu, run the read-only inspection and review the previous and current boot logs before starting. The inspection prints the local image digests from the original container. Choose its reviewed official `ghcr.io/engineer-man/piston@sha256:...` digest. Keep the VM console available if the guest locks up again.

```bash
cd "$HOME/cgp-piston-recovery"
chmod 0755 recover.sh
sudo env CGP_DEDICATED_PISTON_VM=1 ./recover.sh inspect
read -r -p 'Reviewed Piston image digest for the original container: ' cgp_image
sudo env CGP_DEDICATED_PISTON_VM=1 ./recover.sh start "$cgp_image"
```

The script guards the Docker socket, engine, both original containers, reviewed local image, existing volume, installed runtime directories, and local port. It requires at least two vCPUs, 2.5 GiB available RAM and 1 GiB free at the Docker data root. It checks the stopped recovery container before starting it and uses port 2000 on VM loopback. The recovery worker allows two jobs, 64 processes, 128 open files and 64 KiB output. Compile CPU and wall time are capped at 10 s, compile memory at 512 MiB, run CPU at 60 s, run wall at 120 s, and run memory at 1 GiB. Sandbox networking and automatic restart are disabled.

Wait for the runtime catalog and the **single Python smoke** to pass. Leave the SSH session open for the kernel monitor. The script stops only the recovery worker on a smoke failure, new lockup or inability to monitor the kernel. If the VM becomes unresponsive, use its console to confirm the worker is stopped before continuing.

From a second interactive SSH session, after the first smoke passes and the kernel stays healthy:

```bash
cd "$HOME/cgp-piston-recovery"
sudo env CGP_DEDICATED_PISTON_VM=1 ./recover.sh serial
# Run only after serial succeeds and the kernel is still healthy.
sudo env CGP_DEDICATED_PISTON_VM=1 ./recover.sh pair
```

The serial check exercises all four installed runtimes and verifies that the API rejects requests above all six compile and run ceilings for each runtime. The pair runs two short fixtures. A smoke failure stops the recovery worker. Press Ctrl+C in the supervisor terminal to stop it deliberately, or use the following command from another guest terminal:

```bash
sudo env CGP_DEDICATED_PISTON_VM=1 "$HOME/cgp-piston-recovery/recover.sh" stop
```

Open a separate Windows terminal for the private tunnel. Use the verified SSH host key and operator login.

```powershell
ssh -N -o StrictHostKeyChecking=yes -o ExitOnForwardFailure=yes -p 2222 -L 127.0.0.1:2000:127.0.0.1:2000 saksham@127.0.0.1
```

In a second terminal, point `TEST_DATABASE_URL` to approved local rehearsal PostgreSQL. The full live suite creates a disposable schema. Apply the Java allowance only if the organizer approves and publishes the effective combined CPU budget. Java 15.0.2 compiles and executes within one stage. A 1-second problem uses a combined 5-second CPU allowance with the settings below. The per-problem memory limit stays in force.

```powershell
Set-Location C:\Users\Saksham\code-grand-prix-backend
$env:JUDGE_PROVIDER = 'piston'
$env:PISTON_API_URL = 'http://127.0.0.1:2000'
$env:PISTON_PYTHON_VERSION = '3.12.0'
$env:PISTON_JAVA_VERSION = '15.0.2'
$env:PISTON_JAVA_SOURCE_CPU_ALLOWANCE_MS = '4000'
$env:PISTON_CPP_VERSION = '10.2.0'
$env:PISTON_JAVASCRIPT_VERSION = '20.11.1'
$env:PISTON_COMPILE_MEMORY_MB = '512'
$env:PISTON_MAX_RUN_MEMORY_MB = '1024'
$env:JUDGE_MAX_CONCURRENT_REQUESTS = '2'
npm.cmd run test:piston:smoke
```

After the guest serial and pair pass, run the above Windows smoke to check the tunnel and backend adapter. Then run `npm.cmd run test:piston` once with the approved test database and an operator-controlled private `PISTON_TEST_NETWORK_CANARY` confirmed reachable outside Isolate. Stop the recovery worker from the guest supervisor if a job stalls. Use the full suite only after the short tests establish stability. The full suite checks scores, negative verdicts, memory and output, and per-job file separation. Confirm the effective process ceiling on the guest and rehearse expected candidate volume with the operator monitoring the kernel. A responsive runtime catalog alone proves API reachability.

## Deploy behind one campus HTTPS origin

Use the campus LAN for the on-site event. On the approved Windows host, Caddy serves the Vite build and routes `/api` to Express on `127.0.0.1:4000`. The host reaches PostgreSQL on its loopback Docker publish port and reaches Piston over the loopback SSH tunnel. The lab VLAN needs DNS and TCP 443 to the approved campus host. Keep Express, PostgreSQL, Piston, and SSH off contestant networks. The lab's browser trust store must accept the proxy certificate chain. Internet hosting would require an approved private route between the hosted backend and the judge VM.

```powershell
Set-Location C:\Users\Saksham\code-grand-prix-website
$env:VITE_ARENA_MODE = 'api'
$env:VITE_API_BASE_URL = '/api'
npm.cmd ci
if ($LASTEXITCODE) { throw 'Frontend dependency installation failed' }
npm.cmd run build
if ($LASTEXITCODE) { throw 'Frontend build failed' }
```

Use separate migration and runtime database credentials from the approved secret store. Confirm database name and schema against the approved event environment. Take an encrypted backup, verify the archive and rehearse its restore into a separate target. If using an approved libpq service called `cgp-event-backup`, the following commands use its service definition and protected password source.

```powershell
$env:PGSERVICE = 'cgp-event-backup'
$cgpDump = Join-Path (Read-Host 'Restricted encrypted backup directory') 'cgp-event-pre-release.dump'
pg_dump --format=custom --file="$cgpDump"
if ($LASTEXITCODE) { throw 'Event backup failed' }
pg_restore --list "$cgpDump"
if ($LASTEXITCODE) { throw 'Backup archive could not be read' }
# Confirm that this service points to a separate, empty restore database.
pg_restore --exit-on-error --no-owner --no-privileges --dbname='service=cgp-empty-restore-rehearsal' "$cgpDump"
if ($LASTEXITCODE) { throw 'Backup restore rehearsal failed' }
```

After backup and restore validation, use the approved Windows backend terminal with the Piston settings above. Inject the approved migration URL into `DATABASE_URL` for migration, then replace it with the runtime URL for startup. Inject distinct high-entropy `JWT_SECRET` and `COOKIE_SECRET` values. Review pending migrations and halt on failed or divergent history. Keep demo credentials out of the event schema.

```powershell
Set-Location C:\Users\Saksham\code-grand-prix-backend
npm.cmd ci
if ($LASTEXITCODE) { throw 'Backend dependency installation failed' }
npm.cmd run prisma:generate
if ($LASTEXITCODE) { throw 'Prisma client generation failed' }
npm.cmd exec -- prisma migrate status
# After confirming the target, reviewed history, and backup:
npm.cmd exec -- prisma migrate deploy
if ($LASTEXITCODE) { throw 'Event migration failed' }
# Switch DATABASE_URL to the approved runtime connection before startup.
$env:NODE_ENV = 'production'
$env:PORT = '4000'
$env:CGP_BIND_ADDRESS = '127.0.0.1'
$env:CONTEST_ID = 'cgp_2026'
$env:ALLOW_DEV_FALLBACK = 'false'
$env:COOKIE_SECURE = 'true'
$env:COOKIE_SAME_SITE = 'lax'
$env:LOGIN_RATE_LIMIT_STORE = 'postgres'
$env:TRUST_PROXY = '127.0.0.1'
$env:CGP_WEB_HOST = Read-Host 'Approved campus DNS name without scheme'
$env:API_BASE_URL = "https://$env:CGP_WEB_HOST"
$env:ALLOWED_ORIGINS = $env:API_BASE_URL
npm.cmd run build
if ($LASTEXITCODE) { throw 'Backend build failed' }
npm.cmd start
```

Before opening campus traffic, check the actual persisted contest and round schedule in the admin dashboard. Verify the approved roster, round assignments and question limits. The sample window is November 23 from 11:00 to 14:00 IST. Confirm it with the organizer instead of changing event records during deployment. Also check the event catalog's maximum released problem memory and whether any questions exceed the rehearsal ceiling. Run the following with the approved runtime connection and existing Caddy binary.

```powershell
Set-Location C:\Users\Saksham\code-grand-prix-backend
$env:CGP_WEB_HOST = Read-Host 'Same approved campus DNS name'
$env:CGP_LAN_IP = Read-Host 'Approved Windows campus IPv4 listener'
$env:CGP_TLS_CERT = Read-Host 'Path to campus TLS certificate chain PEM'
$env:CGP_TLS_KEY = Read-Host 'Path to protected campus TLS key PEM'
$env:CGP_WEB_ROOT = 'C:\Users\Saksham\code-grand-prix-website\dist'
$cgpCaddy = Read-Host 'Full path to the approved caddy.exe'
& $cgpCaddy validate --config ops/campus/Caddyfile --adapter caddyfile
if ($LASTEXITCODE) { throw 'Campus TLS configuration failed validation' }
# Start after campus IT approves the listener and lab VLAN firewall scope.
& $cgpCaddy run --config ops/campus/Caddyfile --adapter caddyfile
```

Use campus IT's scoped firewall rule for TCP 443 on the approved IP and lab subnet. Confirm from a lab machine that the certificate works with normal trust checks and that the site, `/api/health`, authentication, media permissions, and arena work at the approved name. Confirm that a lab client cannot reach ports 4000, 5433, 2222, or 2000. Browser candidates need only the HTTPS origin. [Caddy SPA and API routing](https://caddyserver.com/docs/caddyfile/patterns) [Prisma migration deployment](https://www.prisma.io/docs/cli/v7/migrate)

## Opening decision

Require clean live runs for all four languages, filesystem and network isolation evidence, an organizer-approved Java rule and resource profile, successful lab browser Run and Submit with results on standings, and a stable rehearsal at the actual expected load. During recovery, set the current round to `PAUSED_BY_ORGANIZER` in Admin Contest Management and hold candidate standings using Admin Results. Confirm how any delayed start affects the persisted round deadline. If these conditions are unmet, postpone official scoring or switch only to a separately approved judge that passes the same gates.
