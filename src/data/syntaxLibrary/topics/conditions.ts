import type { SyntaxTopic } from '../types'

export const conditionsTopics: SyntaxTopic[] = [
  {
    id: 'if-else',
    categoryId: 'conditions',
    title: 'If, Else If, and Else',
    summary: 'Branching logic using conditional blocks.',
    explanation: 'Basic conditional branching allowing code blocks to run only when specific criteria evaluate to true.',
    keywords: ['if', 'else', 'elif', 'else if', 'branch', 'conditional'],
    languages: {
      python: {
        code: `score = 85

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"

print(grade)`,
        notes: 'Python uses elif instead of else if. Indentation defines the block boundaries.',
      },
      java: {
        code: `int score = 85;
String grade;

if (score >= 90) {
    grade = "A";
} else if (score >= 80) {
    grade = "B";
} else if (score >= 70) {
    grade = "C";
} else {
    grade = "F";
}

System.out.println(grade);`,
        notes: 'Parentheses around the test condition are mandatory in Java.',
      },
      cpp: {
        code: `#include <iostream>
#include <string>
using namespace std;

int score = 85;
string grade;

if (score >= 90) {
    grade = "A";
} else if (score >= 80) {
    grade = "B";
} else if (score >= 70) {
    grade = "C";
} else {
    grade = "F";
}

cout << grade << "\\n";`,
        notes: 'Braces are optional for single-line statements, but recommended to prevent dangling else bugs.',
      },
      javascript: {
        code: `const score = 85;
let grade = "";

if (score >= 90) {
    grade = "A";
} else if (score >= 80) {
    grade = "B";
} else if (score >= 70) {
    grade = "C";
} else {
    grade = "F";
}

console.log(grade);`,
        notes: 'Use let when declaring a variable that will be assigned within conditional branches.',
      },
    },
  },
  {
    id: 'nested-if',
    categoryId: 'conditions',
    title: 'Nested If Statements',
    summary: 'Conditions inside conditional blocks for multi-tier filtering.',
    explanation: 'Evaluating secondary criteria only when an outer primary condition succeeds.',
    keywords: ['nested', 'nested if', 'hierarchy', 'guard clause'],
    languages: {
      python: {
        code: `is_registered = True
age = 20

if is_registered:
    if age >= 18:
        status = "Eligible"
    else:
        status = "Too young"
else:
    status = "Registration required"`,
        notes: 'Prefer early returns or compound conditions (and) if nesting exceeds 3 levels.',
      },
      java: {
        code: `boolean isRegistered = true;
int age = 20;
String status;

if (isRegistered) {
    if (age >= 18) {
        status = "Eligible";
    } else {
        status = "Too young";
    }
} else {
    status = "Registration required";
}`,
        notes: 'Ensure inner blocks are clearly indented to preserve code readability.',
      },
      cpp: {
        code: `bool is_registered = true;
int age = 20;
string status;

if (is_registered) {
    if (age >= 18) {
        status = "Eligible";
    } else {
        status = "Too young";
    }
} else {
    status = "Registration required";
}`,
        notes: 'Guard clauses (checking invalid state and returning early) simplify nested hierarchies.',
      },
      javascript: {
        code: `const isRegistered = true;
const age = 20;
let status = "";

if (isRegistered) {
    if (age >= 18) {
        status = "Eligible";
    } else {
        status = "Too young";
    }
} else {
    status = "Registration required";
}`,
        notes: 'Nested if blocks can also be flattened using logical AND (&&).',
      },
    },
  },
  {
    id: 'switch-match',
    categoryId: 'conditions',
    title: 'Switch / Match Statements',
    summary: 'Branching on discrete values or patterns.',
    explanation: 'Demonstrating switch statements in Java, C++, JavaScript, and modern match-case in Python 3.10+.',
    keywords: ['switch', 'case', 'match', 'default', 'break'],
    languages: {
      python: {
        code: `command = "START"

# Python 3.10+ match-case statement
match command:
    case "START":
        action = "Initiating"
    case "PAUSE":
        action = "Holding"
    case "STOP":
        action = "Terminating"
    case _:
        action = "Unknown command"

# Traditional if-elif fallback:
# if command == "START": ...`,
        notes: 'case _ acts as the default wildcard match in Python 3.10+.',
      },
      java: {
        code: `String command = "START";
String action;

switch (command) {
    case "START":
        action = "Initiating";
        break;
    case "PAUSE":
        action = "Holding";
        break;
    case "STOP":
        action = "Terminating";
        break;
    default:
        action = "Unknown command";
        break;
}`,
        notes: 'Remember the break statement after each case to prevent unintended fall-through.',
      },
      cpp: {
        code: `int choice = 2;
string action;

// In C++, switch expressions must evaluate to an integral or enum type
switch (choice) {
    case 1:
        action = "Option 1 selected";
        break;
    case 2:
        action = "Option 2 selected";
        break;
    case 3:
        action = "Option 3 selected";
        break;
    default:
        action = "Invalid option";
        break;
}`,
        notes: 'In C++, switch requires integral values (int, char, enum). Use if-else for std::string.',
      },
      javascript: {
        code: `const command = "START";
let action = "";

switch (command) {
    case "START":
        action = "Initiating";
        break;
    case "PAUSE":
        action = "Holding";
        break;
    case "STOP":
        action = "Terminating";
        break;
    default:
        action = "Unknown command";
        break;
}`,
        notes: 'Switch in JavaScript performs strict equality (===) comparison on each case value.',
      },
    },
  },
  {
    id: 'ternary-operator',
    categoryId: 'conditions',
    title: 'Ternary / Conditional Operator',
    summary: 'Inline one-line conditional expressions.',
    explanation: 'Concise expressions that evaluate and return one of two values based on a boolean condition.',
    keywords: ['ternary', 'inline if', 'conditional operator', '?:'],
    languages: {
      python: {
        code: `x = 10
# Syntax: <true_value> if <condition> else <false_value>
label = "Even" if x % 2 == 0 else "Odd"

# Inline assignment with bounds clamping
val = 150
clamped = val if val <= 100 else 100`,
        notes: 'Python places the condition in the middle: value_if_true if condition else value_if_false.',
      },
      java: {
        code: `int x = 10;
// Syntax: condition ? trueValue : falseValue
String label = (x % 2 == 0) ? "Even" : "Odd";

// Finding maximum with ternary
int a = 15, b = 25;
int maxVal = (a > b) ? a : b;`,
        notes: 'Both branches of the ternary operator must evaluate to compatible types in Java.',
      },
      cpp: {
        code: `int x = 10;
// Syntax: condition ? true_value : false_value
string label = (x % 2 == 0) ? "Even" : "Odd";

// Minimum of two numbers
int a = 15, b = 25;
int min_val = (a < b) ? a : b;`,
        notes: 'Ternary expressions can also be used inside return statements or stream outputs.',
      },
      javascript: {
        code: `const x = 10;
// Syntax: condition ? trueValue : falseValue
const label = (x % 2 === 0) ? "Even" : "Odd";

// Inline conditional formatting
const count = 1;
const text = \`\${count} \${count === 1 ? 'item' : 'items'}\`;`,
        notes: 'Ternary operators are great for concise UI strings and variable initializations.',
      },
    },
  },
  {
    id: 'boolean-expressions',
    categoryId: 'conditions',
    title: 'Boolean Expressions & Truthiness',
    summary: 'Combining boolean conditions, precedence, and falsy values.',
    explanation: 'Evaluating complex logic, order of operations with parentheses, and language-specific truthy/falsy semantics.',
    keywords: ['boolean', 'truthy', 'falsy', 'short-circuit', 'truth values'],
    languages: {
      python: {
        code: `# Truthy and Falsy in Python:
# Falsy: 0, None, "", [], {}, set(), False
# Everything else is Truthy

items = []
if not items:
    print("Collection is empty")

x = 5
# Parenthesized precedence: NOT precedes AND precedes OR
is_valid = (x > 0 and x < 10) or (x == 100)`,
        notes: 'Empty containers (list, dict, set) and empty strings evaluate directly to False.',
      },
      java: {
        code: `// In Java, conditions MUST strictly evaluate to boolean primitive
int count = 0;
// if (count) { ... } -> COMPILE ERROR!
if (count == 0) {
    System.out.println("Zero items");
}

int x = 5;
boolean isValid = (x > 0 && x < 10) || (x == 100);`,
        notes: 'Java has no automatic truthiness conversion from integers or objects to boolean.',
      },
      cpp: {
        code: `// In C++, 0 and nullptr are false; non-zero numbers and pointers are true
int count = 0;
if (!count) {
    cout << "Zero items\\n";
}

int x = 5;
bool is_valid = (x > 0 && x < 10) || (x == 100);`,
        notes: 'Non-zero integers evaluate to true in C++, but explicit comparisons (x != 0) are cleaner.',
      },
      javascript: {
        code: `// Falsy values in JS: false, 0, -0, 0n, "", null, undefined, NaN
// NOTE: Empty array [] and empty object {} are TRUTHY!

const items = [];
if (items.length === 0) {
    console.log("Array is empty");
}

const x = 5;
const isValid = (x > 0 && x < 10) || (x === 100);`,
        notes: 'Be careful: [] is truthy in JavaScript! Always check arr.length === 0 for empty arrays.',
      },
    },
  },
]
