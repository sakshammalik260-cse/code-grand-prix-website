import type { LanguageId, ProgrammingLanguage } from '../types/arena'

export const languages: ProgrammingLanguage[] = [
  { id: 'python', label: 'Python 3', fileName: 'main.py' },
  { id: 'java', label: 'Java', fileName: 'Main.java' },
  { id: 'cpp', label: 'C++', fileName: 'main.cpp' },
  { id: 'javascript', label: 'JavaScript', fileName: 'main.js' },
]
export function isLanguageId(value: string | null): value is LanguageId {
  return languages.some(language => language.id === value)
}
// Intentionally empty entry points. No reference solutions or hidden tests belong here.
export const starterCode: Record<LanguageId, string> = {
  python: 'import sys\n\n\ndef solve():\n    # Read input and write your solution here.\n    pass\n\n\nif __name__ == "__main__":\n    solve()\n',
  java: 'import java.io.*;\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        BufferedReader reader = new BufferedReader(\n            new InputStreamReader(System.in)\n        );\n\n        // Read input and write your solution here.\n    }\n}\n',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nvoid solve() {\n    // Read input and write your solution here.\n\n}\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    solve();\n    return 0;\n}\n',
  javascript: "'use strict';\n\nconst fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8');\n\nfunction solve(input) {\n    // Read input and write your solution here.\n}\n\nsolve(input);\n",
}
