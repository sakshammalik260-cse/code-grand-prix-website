# Self-hosted Piston judge

**Event decision — NO-GO pending repeatable live judging, isolation checks, and a capacity rehearsal.** Piston is MIT-licensed. Self-hosting removes the paid API dependency and still requires a dedicated machine or VM, its operation and a load rehearsal.

## Compatibility and security

The current test target is the existing Ubuntu VirtualBox judge VM through an SSH tunnel bound to Windows loopback. Windows Docker Desktop is separate and hosts the development PostgreSQL database and unrelated services. Piston's documented Linux setup uses Docker, cgroup v2 and a privileged API container running the Isolate sandbox. Its API startup can succeed before Isolate initializes a job. [Official requirements and operation](https://github.com/engineer-man/piston) | [Upstream Compose](https://github.com/engineer-man/piston/blob/master/docker-compose.yaml) | [Isolate invocation in Piston](https://github.com/engineer-man/piston/blob/master/api/src/job.js)

A college-controlled Linux VM can host the rehearsal. Use a patched dedicated Linux host or guest with Docker Engine and unified cgroup v2. Confirm CPU, memory, process and filesystem controllers on that guest and review the exact official image digest, base OS, Isolate build and runtime packages. Keep the VM free of the application database, backend environment, credentials, shared host folders, and the Docker socket in the runner container. The privileged worker has broad access to the guest, so guest separation and ingress/egress policy are part of the security boundary.

The recovery Compose profile binds the API to VM loopback, reuses the external `cgp-piston-data` volume at `/piston`, disables job networking and sets finite execution limits. Install runtime packages from VM loopback through the upstream CLI. Restrict VM egress during the event and keep port 2000 off the public network. For a remote backend use a private HTTPS proxy that authenticates the backend, forwards only GET /api/v2/runtimes and POST /api/v2/execute, and rejects package management and interactive endpoints. An administrator-approved SSH tunnel is suitable for rehearsal. Use a separate restricted account or the filtered proxy for event traffic. [Piston API](https://github.com/engineer-man/piston/blob/master/docs/api-v2.md) | [Piston configuration](https://github.com/engineer-man/piston/blob/master/docs/configuration.md)

The adapter sends one source file and one input to the judge. Hidden input is sent as stdin for its test case. Hidden expected output, case metadata, contestant identity and scores stay in the backend. The API applies separate compile and run limits, checks the terminal result and bounds output and response size. Piston does not provide a distinct memory status in its documented stage enum. The adapter reports memory-limit exceeded when usage reaches the configured limit or a killed process reports usage just below it within a 4 KiB rounding margin. Other resource-related crashes can appear as runtime errors. The existing submission pipeline persists infrastructure failures with zero points.

## Start on the approved VM

Follow the [campus runbook](2026-11-23-campus-release.md#recover-the-original-piston-data-volume) to inspect the stopped containers, verify the original volume, and start the guarded recovery worker. The recovery process uses the installed runtimes.

For a separate fresh installation, use a reviewed official Piston checkout and provision the four approved runtimes. The CLI package name can differ from the language returned by the runtime API.

```sh
npm ci --prefix cli
node cli/index.js ppman list
node cli/index.js ppman install "python=${CGP_PYTHON_VERSION:?}"
node cli/index.js ppman install "java=${CGP_JAVA_VERSION:?}"
node cli/index.js ppman install "gcc=${CGP_GCC_VERSION:?}"
node cli/index.js ppman install "node=${CGP_NODE_VERSION:?}"
curl --fail http://127.0.0.1:2000/api/v2/runtimes
```

Set the four package version variables from the reviewed package list before running the install command. If the selected image uses a different package identifier, use the exact name shown in its list. Record the versions and language aliases returned by the runtime endpoint. [Upstream package CLI](https://github.com/engineer-man/piston#usage)

For Windows rehearsal, use an approved SSH account and an unused local port. Keep this terminal open.

```powershell
ssh -N -o ExitOnForwardFailure=yes -L 127.0.0.1:2000:127.0.0.1:2000 operator@private-judge-vm
```

In the backend checkout, use local PostgreSQL with disposable test schemas. Set any approved Java source-file allowance before running the suite.

```powershell
Set-Location C:\Users\Saksham\code-grand-prix-backend
$env:JUDGE_PROVIDER = 'piston'
$env:PISTON_API_URL = 'http://127.0.0.1:2000'
$env:ALLOW_DEV_FALLBACK = 'false'
npm.cmd run test:piston
npm.cmd run dev
```

For an authenticated private HTTPS gateway, use its origin as PISTON_API_URL and inject PISTON_API_TOKEN server-side. It is sent as a bearer token only to the configured origin, and redirects are refused. If the runtime catalog contains multiple matching versions, use exact installed values for PISTON_PYTHON_VERSION, PISTON_JAVA_VERSION, PISTON_CPP_VERSION, and PISTON_JAVASCRIPT_VERSION. The adapter uses Main.java for Java. The backend defaults to a 512 MiB compile cap and uses the problem's memory limit for execution. Keep the backend's compile ceiling consistent with the judge profile.

## Java source-file CPU policy

The tested Piston Java 15.0.2 runtime invokes the Java source-file launcher. Its `run` stage covers compilation, JVM startup, contestant execution and teardown. A successful one-integer program used 2,707 ms of CPU on the Ubuntu VM. C++ uses its separate compile stage and the problem's run limits. [Piston Java launcher](https://github.com/engineer-man/piston/blob/master/packages/java/15.0.2/run) [JDK 15 source-file mode](https://docs.oracle.com/en/java/javase/15/docs/specs/man/java.html#using-source-file-mode-to-launch-single-file-source-code-programs)

Keep the allowance at its default of zero when the problem's CPU limit must apply to the entire run stage. For the single-stage Java 15.0.2 runtime tested on this VM, the following settings enable the explicitly approved profile.

```powershell
$env:PISTON_JAVA_VERSION = '15.0.2'
$env:PISTON_JAVA_SOURCE_CPU_ALLOWANCE_MS = '4000'
npm.cmd run test:piston
```

The allowance applies per case to the entire Java stage. With this profile a problem with 1,000 ms of CPU receives a combined Java limit of 5,000 ms CPU and 10,000 ms wall time. Run ceilings remain 60,000 ms CPU and 120,000 ms wall time. The problem memory limit is still sent unchanged, and the returned runtime is total measured CPU. The allowance is disabled by default, accepts at most 10,000 ms, requires an exact runtime version, and rejects a response with a separate compile stage. Review and publish any Java allowance as contest policy. For strict submission-only timing, provision a reviewed Java runtime with separate `javac` and `java` stages and leave the allowance disabled.

When Java returns only a run stage, a failed exit with source-launcher compiler diagnostics is reported as a compilation error. A plain nonzero program exit or exception is a runtime error. A timeout takes precedence over output matching. For independently authenticated compiler outcomes, use the split-stage runtime.

## Verification and event capacity

- Backend build, TypeScript checks for the Piston tests, and all nine `npm.cmd test` suites passed. The Piston protocol mock passed 49 HTTP checks against disposable PostgreSQL. It covered run-only Java success, compiler diagnostics, ordinary runtime exceptions, timeout precedence, and memory rounding. It also retained coverage of split compilation, hidden case confidentiality, admission and score persistence.
- The VM advertised Python 3.12.0, Java 15.0.2, C++ 10.2.0, and Node.js 20.11.1. Python, Java, and C++ completed their live language checks in one attempt. The Node.js sample timed out in that run. Six direct Node.js sample probes later succeeded with the original limits. Direct 128 MiB memory probes stopped oversized allocations in all four runtimes before the program printed its completion marker.
- A later live suite reached all four languages and got HTTP 503 execution deadlines. The runtime catalog remained responsive. A direct harmless `POST /api/v2/execute` timed out outside Express. The complete four-language live suite is still failing. The filesystem smoke check was not reached and there was no network canary. SSH rejected noninteractive login, so the VM operator must investigate job execution and the Isolate queue.
- All suites used disposable schemas. Before and after fingerprints matched for the public contests, users, problems, sessions, and submissions tables. The disposable schema count also matched. Docker containers and volumes were left intact.
- Direct VM API probes accepted the documented time ceilings and rejected the four compile and run time values one millisecond over those ceilings. The API accepted values one byte above the example memory ceilings. Keep the Piston endpoint private, retain backend per-request caps, and verify the effective worker-wide memory configuration before the event. [Piston limit validation](https://github.com/engineer-man/piston/blob/master/api/src/api/v2.js)
- For the private network check, set PISTON_TEST_NETWORK_CANARY to a disposable operator-controlled endpoint at a private IPv4 address and port. First confirm the endpoint is reachable from the API container outside Isolate. The live check must then report that it is blocked inside Isolate. Use only synthetic canaries and fixture data. Confirm guest firewall separation from PostgreSQL and backend services and ensure the guest has no backend secrets to inherit.
- The campus rehearsal profile caps Piston at two active jobs and 1 GiB run memory per job. Configure Express with `JUDGE_MAX_CONCURRENT_REQUESTS=2` and `PISTON_MAX_RUN_MEMORY_MB=1024` to match it. Express also limits each candidate to one active request. Questions above the worker memory ceiling need organizer review before the profile can be used. Each submission can compile and run a separate job for each test case. This is an admission setting, and simultaneous contestant capacity is still unknown. Rehearse the organizer-confirmed peak using disposable users and problems, measure queue and verdict latency, CPU/memory, 429/503 rates, throughput and recovery, then size controls for deployment.

## Files

The backend changes are in src/judge/piston.adapter.ts, src/judge/judge-transport.ts, src/judge/judge0.adapter.ts, src/judge/judge.service.ts, src/config/env.ts, .env.example, package.json, tests/run-all.ts, tests/piston-programs.ts, tests/piston-protocol.test.ts, tests/piston-live.test.ts, ops/piston/compose.yaml, ops/piston/start.sh and this guide. The Run and Submit contracts and frontend use the existing judging flow.
