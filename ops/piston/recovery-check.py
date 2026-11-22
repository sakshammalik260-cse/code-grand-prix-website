"""Verify the pinned recovery container and run low-load Piston fixtures."""
import concurrent.futures
import json
import subprocess
import sys
import time

VOLUME = "cgp-piston-data"
PROJECT = "cgp-piston-recovery"
LIMITS = {
    "PISTON_DATA_DIRECTORY": "/piston",
    "PISTON_LIMIT_OVERRIDES": "{}",
    "PISTON_DISABLE_NETWORKING": "true",
    "PISTON_MAX_CONCURRENT_JOBS": "2",
    "PISTON_MAX_PROCESS_COUNT": "64",
    "PISTON_MAX_OPEN_FILES": "128",
    "PISTON_OUTPUT_MAX_SIZE": "65536",
    "PISTON_COMPILE_TIMEOUT": "10000",
    "PISTON_COMPILE_CPU_TIME": "10000",
    "PISTON_COMPILE_MEMORY_LIMIT": "536870912",
    "PISTON_RUN_TIMEOUT": "120000",
    "PISTON_RUN_CPU_TIME": "60000",
    "PISTON_RUN_MEMORY_LIMIT": "1073741824",
}
PROGRAMS = {
    "python": ("3.12.0", "main.py", "print(2)", 1000),
    "java": (
        "15.0.2",
        "Main.java",
        "public class Main { public static void main(String[] args) { System.out.println(2); } }",
        5000,
    ),
    "c++": ("10.2.0", "main.cpp", "#include <iostream>\nint main() { std::cout << 2; }", 1000),
    "javascript": ("20.11.1", "main.js", "console.log(2)", 1000),
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def legacy_mount(mount):
    return (
        mount.get("Type") == "volume"
        and mount.get("Name") == VOLUME
        and mount.get("Destination") == "/piston"
    )


def inspect_legacy(image_id):
    containers = {item["Name"]: item for item in json.load(sys.stdin)}
    require(
        set(containers) == {"/cgp-piston", "/cgp-piston-backup"},
        "The two original containers must both exist.",
    )
    for item in containers.values():
        require(item["State"]["Status"] == "exited", f"Stop {item['Name']} before recovery.")
    original = containers["/cgp-piston"]
    require(original["Image"] == image_id, "Reviewed digest does not identify the original local image.")
    mounts = original["Mounts"]
    require(any(legacy_mount(mount) for mount in mounts), "Original /piston volume does not match.")
    require(
        not any(mount["Destination"].startswith("/piston/") for mount in mounts),
        "A nested /piston mount needs an explicit storage review.",
    )


def inspect_worker(image_id):
    workers = json.load(sys.stdin)
    require(len(workers) == 1, "Expected a single recovery container.")
    worker = workers[0]
    require(worker["Image"] == image_id, "Recovery container image does not match the reviewed digest.")
    require(worker["State"]["Status"] in ("created", "exited"), "Recovery worker must be stopped.")
    host = worker["HostConfig"]
    labels = worker["Config"]["Labels"]
    require(
        labels.get("com.docker.compose.project") == PROJECT
        and labels.get("com.docker.compose.service") == "api",
        "Unexpected recovery container identity.",
    )
    require(
        host["PortBindings"] == {"2000/tcp": [{"HostIp": "127.0.0.1", "HostPort": "2000"}]}
        and host["NetworkMode"] != "host"
        and not host["PublishAllPorts"],
        "The Piston API must publish only to localhost.",
    )
    require(host["RestartPolicy"]["Name"] in ("", "no"), "Automatic restart must be disabled.")
    require(host["Privileged"], "The dedicated Isolate container must have its configured privilege.")
    persistent_mounts = [
        mount for mount in worker["Mounts"]
        if (mount["Type"], mount["Destination"]) != ("tmpfs", "/tmp")
    ]
    require(
        len(persistent_mounts) == 1
        and legacy_mount(persistent_mounts[0])
        and persistent_mounts[0]["RW"],
        "Expected the original writable data volume at /piston and no other persistent mounts.",
    )
    env = dict(value.split("=", 1) for value in worker["Config"]["Env"])
    for key, value in LIMITS.items():
        require(env.get(key) == value, f"Unexpected recovery setting for {key}.")
    print("Verified stopped recovery container, existing mount, localhost bind, and configured limits.")


def request(endpoint, deadline, payload=None):
    args = [
        "curl", "--disable", "--silent", "--show-error", "--noproxy", "*",
        "--connect-timeout", "1", "--max-time", str(deadline),
        "--max-filesize", "262144", "--write-out", "\n%{http_code}",
        f"http://127.0.0.1:2000/api/v2/{endpoint}",
    ]
    if payload is not None:
        args.extend(["--header", "Content-Type: application/json", "--data-binary", "@-"])
    process = subprocess.run(
        args,
        input=json.dumps(payload) if payload is not None else None,
        capture_output=True,
        text=True,
        timeout=deadline + 1,
        check=False,
    )
    require(process.returncode == 0, f"{endpoint} transport failed (curl {process.returncode}).")
    body, status = process.stdout.rsplit("\n", 1)
    return int(status), json.loads(body)


def catalog():
    for attempt in range(8):
        try:
            status, entries = request("runtimes", 2)
            break
        except (ValueError, subprocess.TimeoutExpired):
            if attempt == 7:
                raise
            time.sleep(0.5)
    require(status == 200, "Runtime catalog failed.")
    installed = {(item["language"], item["version"]) for item in entries}
    for language, (version, *_rest) in PROGRAMS.items():
        require((language, version) in installed, f"Missing {language} {version} in runtime catalog.")
    print("Runtime catalog verified for Python, Java, C++, and JavaScript.", flush=True)


def job(language):
    version, filename, source, cpu = PROGRAMS[language]
    return {
        "language": language,
        "version": version,
        "files": [{"name": filename, "content": source}],
        "stdin": "",
        "compile_timeout": 10000,
        "compile_cpu_time": 10000,
        "compile_memory_limit": 536870912,
        "run_timeout": 2 * cpu,
        "run_cpu_time": cpu,
        "run_memory_limit": 134217728,
    }


def smoke(language):
    payload = job(language)
    status, result = request("execute", {"java": 14, "c++": 16}.get(language, 7), payload)
    require(status == 200, f"{language} /execute returned HTTP {status}.")
    require(
        result.get("language") == language and result.get("version") == payload["version"],
        f"{language} returned an unexpected runtime.",
    )
    if language == "c++":
        compile_stage = result.get("compile")
        require(
            compile_stage
            and compile_stage.get("code") == 0
            and "status" in compile_stage
            and compile_stage["status"] is None
            and "signal" in compile_stage
            and compile_stage["signal"] is None,
            "C++ compile stage failed.",
        )
    stage = result.get("run")
    require(
        stage
        and stage.get("code") == 0
        and "status" in stage
        and stage["status"] is None
        and "signal" in stage
        and stage["signal"] is None
        and stage.get("stdout", "").strip() == "2",
        f"{language} smoke returned a failed verdict or unexpected output.",
    )
    for key, limit in [
        ("cpu_time", payload["run_cpu_time"]),
        ("wall_time", payload["run_timeout"]),
        ("memory", payload["run_memory_limit"]),
    ]:
        value = stage.get(key)
        require(type(value) in (int, float) and 0 <= value <= limit, f"{language} reported invalid {key}.")
    print(f"PASS {language} {payload['version']} ({stage['cpu_time']} ms CPU)", flush=True)


def verify_ceiling_rejections(language):
    payload = job(language)
    for kind in ("COMPILE", "RUN"):
        for limit in ("TIMEOUT", "CPU_TIME", "MEMORY_LIMIT"):
            key = f"{kind}_{limit}".lower()
            ceiling = int(LIMITS[f"PISTON_{kind}_{limit}"])
            status, body = request("execute", 5, {**payload, key: ceiling + 1})
            require(
                status == 400 and key in body.get("message", "").lower(),
                f"{language} accepted an over-limit {key} request or failed to validate it.",
            )
    print(f"PASS {language} API rejected requests above all six resource ceilings.", flush=True)


def main():
    mode = sys.argv[1]
    if mode == "legacy":
        inspect_legacy(sys.argv[2])
    elif mode == "worker":
        inspect_worker(sys.argv[2])
    elif mode == "first":
        catalog()
        smoke("python")
    elif mode == "serial":
        catalog()
        for language in PROGRAMS:
            smoke(language)
            verify_ceiling_rejections(language)
    elif mode == "pair":
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as workers:
            for _ in workers.map(smoke, ("python", "javascript")):
                pass
    else:
        raise ValueError("Unknown recovery check mode.")


if __name__ == "__main__":
    try:
        main()
    except (OSError, TypeError, ValueError, KeyError, subprocess.SubprocessError) as error:
        sys.exit(f"Recovery check failed: {error}")
