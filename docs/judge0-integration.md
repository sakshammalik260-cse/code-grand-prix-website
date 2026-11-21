# Phase 8 Judge0 integration

The existing adapter sent Base64 code to Judge0 using hardcoded language IDs and a synchronous wait. It already supported the common verdicts. The backend already enforced candidate roles, check-in, session locks, publication and round windows. Its submission loop could compare output after an internal failure and award points for an empty-output match.

The new adapter requests the active language catalog and checks the reported Judge0 CE version. The configuration selects exact runtime names, then uses the IDs returned by that instance. It sends one case per job, creates the job with `wait=false`, validates its token and polls only the needed result fields. Expected outputs stay in the backend. Outages, malformed replies and polling deadlines return HTTP 503. A submission already admitted before an outage is persisted as FAILED / INTERNAL_ERROR with zero points. Accepted judging requires a successful worker result and matching output for every case. Run never creates a scoring record.

The request contract stays the same. The adapter has source and input size gates, a bounded number of cases and a bounded response reader. It sets CPU and wall limits, aggregate memory and process/thread limits, a stack limit and a per-file output limit. Each backend process admits one active execution per candidate and a bounded global number. The Judge0 queue and workers have separate limits. Multi-instance backend deployments would need shared application-level admission if the same per-candidate policy must span replicas.

Judge0 CE has no separate documented memory-limit status. The backend reports MEMORY_LIMIT_EXCEEDED when a failed runtime reports memory at or above the requested ceiling. A memory-related failure without that evidence remains RUNTIME_ERROR. Excessive output maps to RUNTIME_ERROR to match the existing Arena verdict set. Java uses `public class Main` with CE v1.13.1. The backend language endpoint now reflects that entry class. The frontend's bundled Java starter still uses `Solution`, so it needs a later integration change.

## Local host result

Docker Desktop reported `desktop-linux`, x86_64 and **cgroup v2**. The repository launch script refused that engine before starting any Judge0 container. PostgreSQL was reachable and the Judge0 port was closed. Judge0 CE v1.13.1 is the upstream CE release that fixes the published issues affecting v1.13.0. The release guide describes a Linux cgroup v1 setup, and its reference worker runs privileged. Treat the provided profile as development configuration for a dedicated, disposable Linux VM. The setup has only passed Compose syntax validation on this host. [Release guide](https://github.com/judge0/judge0/releases/tag/v1.13.1) · [Official API](https://ce.judge0.com/docs) · [Upstream Compose](https://github.com/judge0/judge0/blob/v1.13.1/docker-compose.yml)

No live sandbox verdict, language ID, resource ceiling or isolation claim can be made from the Windows checks. In particular, an accepted Compose file does not establish kernel isolation. The official CE image also includes older language runtimes, so a production security review must assess the actual image, OS and network boundaries.

## Start the private development judge

Use a dedicated Ubuntu 22.04 Linux VM with Docker Engine, Compose, OpenSSL, and GNU coreutils. Configure cgroup v1 using the upstream release instructions. Keep this VM free of backend data, unrelated workloads and sensitive mounts. Run these commands from the backend checkout on that VM.

```sh
docker info --format '{{.OSType}} {{.CgroupVersion}}'
CGP_DEDICATED_JUDGE_VM=1 sh ops/judge0/start.sh
docker compose -f ops/judge0/compose.yaml ps
```

The script creates an ignored mode-0600 `.judge0.env` with random PostgreSQL, Redis, API and Rails secrets when absent. The profile starts the Judge0 API and worker, its own PostgreSQL and Redis. Only the API binds to loopback. The worker uses an internal Docker network and a privileged container for Isolate. No host volume or control socket is mounted. Default user-supplied options, callbacks, extra files and network access are disabled. Configure VM firewall and egress restrictions and keep short retention for Judge0's private database because it receives submitted source and case input.

If the backend runs on the Windows workstation, use a private SSH tunnel and configure the backend through its environment. Supply the generated `AUTHN_TOKEN` as `JUDGE0_API_KEY` through a secret store or a protected local environment. The adapter requires a token of at least 32 characters and HTTPS for non-loopback URLs. Update the exact named runtime variables only if the provisioned catalog differs.

```sh
ssh -N -L 127.0.0.1:2358:127.0.0.1:2358 operator@private-judge-vm
```

```powershell
$env:JUDGE_PROVIDER = 'judge0'
$env:JUDGE0_API_URL = 'http://127.0.0.1:2358'
npm.cmd run test:judge0
```

For an optional live network denial check set `JUDGE0_TEST_NETWORK_CANARY` to a controlled private IPv4 address and port. First verify the disposable canary accepts connections from the worker container outside Isolate. The live suite then checks that an inside-Isolate program cannot reach it. The suite reports a skipped network check if the canary is absent. Keep `JUDGE_MAX_CONCURRENT_REQUESTS` at two or more for its concurrent-user case.

The trusted local judge remains available automatically to repository subprocess tests. Development use requires `ALLOW_TRUSTED_LOCAL_JUDGE=true`, and the local server binds only to loopback in local-judge mode. Production requires Judge0. An unavailable Judge0 never triggers local execution.

## Verification

- `npm.cmd run build`, `npm.cmd test`, and `git diff --check`.
- The protocol suite uses a loopback HTTP fixture and real disposable PostgreSQL. It tests catalog ID selection, authentication, jobs and polling, verdicts, concurrency, timeout, redirects, source/input limits, zero-score failure persistence and history authorization. It is not a sandbox test.
- `npm.cmd run test:judge0` exits nonzero when the environment is unavailable. On this host it reported missing authenticated configuration. A second loopback probe using a disposable token failed at transport because no Judge0 endpoint was listening.
- The live suite is written to test Python, Java, C++ and JavaScript across Run and Submit, resource failures, filesystem isolation, credential-variable absence, process/thread ceilings, optional private network denial, PostgreSQL ownership and scoring. These remain unverified until the suite passes on the dedicated host.
