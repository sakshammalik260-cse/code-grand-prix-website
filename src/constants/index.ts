// ==============================================================================
// CODE GRAND PRIX 2026 — SYSTEM CONSTANTS & MACHINE-READABLE ENUMS
// ==============================================================================

export const ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN_ROLE: "FORBIDDEN_ROLE",
  CHECKIN_INCOMPLETE: "CHECKIN_INCOMPLETE",
  SESSION_LOCKED: "SESSION_LOCKED",
  JUDGE_UNAVAILABLE: "JUDGE_UNAVAILABLE",
  JUDGE_BUSY: "JUDGE_BUSY",
  CONTEST_NOT_LIVE: "CONTEST_NOT_LIVE",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  DUPLICATE_EVENT: "DUPLICATE_EVENT",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR"
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const SUPPORTED_LANGUAGES = [
  {
    languageId: "python",
    label: "Python 3",
    version: "3.10+",
    extension: ".py",
    starterCode: `# Python 3 Starter Code\ndef main():\n    # Read input from standard input\n    import sys\n    input_data = sys.stdin.read().split()\n    # Write your solution here\n    pass\n\nif __name__ == '__main__':\n    main()\n`
  },
  {
    languageId: "javascript",
    label: "JavaScript (Node.js)",
    version: "18+",
    extension: ".js",
    starterCode: `// JavaScript (Node.js) Starter Code\nconst fs = require('fs');\n\nfunction main() {\n    const input = fs.readFileSync(0, 'utf-8').trim();\n    // Write your solution here\n}\n\nmain();\n`
  },
  {
    languageId: "cpp",
    label: "C++ (C++17)",
    version: "g++ 17",
    extension: ".cpp",
    starterCode: `// C++17 Starter Code\n#include <iostream>\n#include <vector>\n#include <string>\n\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    // Write your solution here\n    return 0;\n}\n`
  },
  {
    languageId: "java",
    label: "Java (OpenJDK 17)",
    version: "17",
    extension: ".java",
    starterCode: `// Java Starter Code (Judge0 entry class)\nimport java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        // Write your solution here\n    }\n}\n`
  }
] as const;

export const VERDICTS = {
  QUEUED: "QUEUED",
  RUNNING: "RUNNING",
  ACCEPTED: "ACCEPTED",
  WRONG_ANSWER: "WRONG_ANSWER",
  TIME_LIMIT_EXCEEDED: "TIME_LIMIT_EXCEEDED",
  MEMORY_LIMIT_EXCEEDED: "MEMORY_LIMIT_EXCEEDED",
  COMPILATION_ERROR: "COMPILATION_ERROR",
  RUNTIME_ERROR: "RUNTIME_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR"
} as const;

export type VerdictType = (typeof VERDICTS)[keyof typeof VERDICTS];
