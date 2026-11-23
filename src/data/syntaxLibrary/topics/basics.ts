import type { SyntaxTopic } from '../types'

export const basicsTopics: SyntaxTopic[] = [
  {
    id: 'printing-output',
    categoryId: 'basics',
    title: 'Printing Output',
    summary: 'Standard console output with and without automatic trailing newlines.',
    explanation: 'Demonstrates printing single and multiple values to standard output, including formatted output and separator handling.',
    keywords: ['print', 'output', 'stdout', 'console.log', 'println', 'cout', 'display'],
    quickReference: true,
    languages: {
      python: {
        code: `# Print with a newline (default)
print("Hello, World!")

# Multiple values with custom separator
a = 42
b = 100
print(a, b, sep=" ")

# Print without trailing newline
print("Loading...", end="")
print("Done!")

# Formatted string (f-string)
print(f"Result: {a} / {b}")`,
        notes: 'Python print() automatically appends a newline unless end="" is specified.',
      },
      java: {
        code: `// Print with a newline
System.out.println("Hello, World!");

// Print without a newline
System.out.print("Processing...");
System.out.println("Done!");

// Formatted output
int a = 42;
int b = 100;
System.out.printf("Result: %d / %d%n", a, b);`,
        notes: 'Use %n instead of \\n in printf for platform-independent newlines.',
      },
      cpp: {
        code: `#include <iostream>
using namespace std;

// Print with newline ('\\n' is faster than endl)
cout << "Hello, World!\\n";

// Multiple values
int a = 42, b = 100;
cout << a << " " << b << "\\n";

// Print without newline
cout << "Processing...";
cout << "Done!\\n";`,
        notes: 'In competitive programming, use "\\n" rather than endl because endl forces an expensive buffer flush.',
      },
      javascript: {
        code: `// Print with automatic newline
console.log("Hello, World!");

// Multiple values (space separated)
const a = 42;
const b = 100;
console.log(a, b);

// Print without newline using process.stdout
process.stdout.write("Processing...");
process.stdout.write("Done!\\n");

// Template literal formatting
console.log(\`Result: \${a} / \${b}\`);`,
        notes: 'console.log automatically appends a newline. Use process.stdout.write for stream control.',
      },
    },
  },
  {
    id: 'reading-input',
    categoryId: 'basics',
    title: 'Reading Input & Fast I/O',
    summary: 'Standard and fast competitive input reading from standard input.',
    explanation: 'Covers reading lines, space-separated integers, and entire buffers for competitive programming platforms.',
    keywords: ['input', 'stdin', 'fast io', 'cin', 'scanner', 'bufferedreader', 'read', 'tokens'],
    quickReference: true,
    languages: {
      python: {
        code: `import sys

# Fast reading of all tokens from standard input
def read_tokens():
    input_data = sys.stdin.read().split()
    return input_data

# Line-by-line reading (stripping trailing newline)
line = sys.stdin.readline().strip()

# Reading single integer
n = int(sys.stdin.readline())

# Reading a line of space-separated integers
arr = list(map(int, sys.stdin.readline().split()))`,
        notes: 'sys.stdin.read().split() is significantly faster than repeated input() calls when processing large test sets.',
      },
      java: {
        code: `import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));

        // Read single integer line
        String line = reader.readLine();
        if (line == null) return;
        int n = Integer.parseInt(line.trim());

        // Read space-separated integers
        StringTokenizer st = new StringTokenizer(reader.readLine());
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = Integer.parseInt(st.nextToken());
        }
    }
}`,
        notes: 'BufferedReader with StringTokenizer is fast enough for large competitive programming inputs (up to 10^6 tokens).',
      },
      cpp: {
        code: `#include <iostream>
#include <vector>
#include <string>
using namespace std;

int main() {
    // Fast I/O optimization: untie cin from cout and disable C stdio sync
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (cin >> n) {
        vector<int> arr(n);
        for (int i = 0; i < n; i++) {
            cin >> arr[i];
        }
    }

    // Reading a full line including spaces
    string full_line;
    cin.ignore(); // Discard leftover newline before getline
    getline(cin, full_line);

    return 0;
}`,
        notes: 'Always place ios::sync_with_stdio(false); cin.tie(nullptr); at the top of main() for competitive execution.',
      },
      javascript: {
        code: `const fs = require('fs');

// Read all standard input into memory synchronously
const input = fs.readFileSync(0, 'utf8');

// Parse whitespace-delimited tokens
const tokens = input.trim().split(/\\s+/);
let ptr = 0;

function nextToken() {
    return tokens[ptr++];
}

function nextInt() {
    return parseInt(nextToken(), 10);
}

// Example usage:
if (tokens.length > 0 && tokens[0] !== '') {
    const n = nextInt();
    const arr = [];
    for (let i = 0; i < n; i++) {
        arr.push(nextInt());
    }
}`,
        notes: 'fs.readFileSync(0, "utf8") reads file descriptor 0 (stdin) and handles multi-line competitive contest input.',
      },
    },
  },
  {
    id: 'variables-and-types',
    categoryId: 'basics',
    title: 'Variables & Data Types',
    summary: 'Declaring scalar variables, primitive numbers, booleans, and characters.',
    explanation: 'Basic variable declarations, integer bit sizes, floating point precision, and booleans.',
    keywords: ['variables', 'data types', 'int', 'float', 'double', 'boolean', 'char', 'types'],
    languages: {
      python: {
        code: `# Python integers have arbitrary precision (no 64-bit overflow)
count = 10
big_number = 10**18

# Floating point (64-bit IEEE 754)
ratio = 3.14159

# Booleans (capitalized True / False)
is_active = True
is_finished = False

# Dynamic typing reassignment
value = "initial string"
value = 42`,
        notes: 'Python automatically handles arbitrarily large integers without 32-bit or 64-bit integer overflow.',
      },
      java: {
        code: `// Primitive numeric types
int a = 100000;              // 32-bit signed (-2*10^9 to 2*10^9)
long b = 1000000000000000L;  // 64-bit signed (use L suffix)

// Floating point types
float f = 3.14f;
double d = 3.141592653589793; // 64-bit double precision

// Characters & booleans
char ch = 'A';
boolean flag = true;`,
        notes: 'Use long when sums or products exceed 2*10^9 to avoid silent 32-bit overflow.',
      },
      cpp: {
        code: `// Standard numeric types
int a = 100000;               // 32-bit signed
long long b = 1000000000000LL;// 64-bit signed (use LL suffix)

// Floating point types
double d = 3.141592653589793; // standard 64-bit
long double ld = 3.141592653589793238L; // extended precision

// Characters & booleans
char ch = 'A';
bool flag = true;

// Type inference with auto
auto computed = a * 2;`,
        notes: 'Use long long in C++ when calculating prefix sums or factorials to prevent 32-bit wrap-around.',
      },
      javascript: {
        code: `// Variables declared with let (reassignable) or const (read-only)
let count = 10;
const PI = 3.141592653589793;

// Double precision 64-bit float (JavaScript Number)
let price = 19.99;

// BigInt for 64-bit+ integers without precision loss
const large = 9007199254740991n + 2n;

// Booleans
let isReady = true;
let isDone = false;`,
        notes: 'JavaScript Number is IEEE 754 double precision. Integers beyond 2^53 - 1 require BigInt.',
      },
    },
  },
  {
    id: 'constants',
    categoryId: 'basics',
    title: 'Constants',
    summary: 'Immutable values and common contest modulo constants.',
    explanation: 'Declaring read-only variables and common competitive programming constants such as 10^9 + 7.',
    keywords: ['const', 'constant', 'final', 'immutable', 'mod', '1e9+7'],
    languages: {
      python: {
        code: `# By convention, constants are written in UPPERCASE in Python
MOD = 10**9 + 7
INF = float('inf')
NEG_INF = float('-inf')

# Python does not enforce const at runtime, but variables should not be reassigned
MAX_N = 100005`,
        notes: 'Use float("inf") for infinity when finding minimum values in algorithms.',
      },
      java: {
        code: `// final keyword prevents variable reassignment
public static final int MOD = 1_000_000_007;
public static final long INF = Long.MAX_VALUE / 2;
public static final int MAX_N = 200_005;

// Local constants
final double EPSILON = 1e-9;`,
        notes: 'Use underscores in numeric literals (e.g., 1_000_000_007) for readability.',
      },
      cpp: {
        code: `// const or constexpr for compile-time constants
const int MOD = 1e9 + 7;
const long long INF = 1e18;
const double EPS = 1e-9;
constexpr int MAX_N = 200005;`,
        notes: 'constexpr ensures the constant expression is evaluated at compile time.',
      },
      javascript: {
        code: `// const creates an immutable binding
const MOD = 1000000007;
const INF = Number.MAX_SAFE_INTEGER;
const POSITIVE_INFINITY = Infinity;
const MAX_N = 200005;`,
        notes: 'const prevents reassigning the variable name, though properties of objects/arrays can still mutate.',
      },
    },
  },
  {
    id: 'arithmetic-operators',
    categoryId: 'basics',
    title: 'Arithmetic Operators',
    summary: 'Addition, subtraction, multiplication, division, modulo, and exponentiation.',
    explanation: 'Standard arithmetic calculations, integer division, modulo nuances with negative numbers, and power calculation.',
    keywords: ['operators', 'arithmetic', 'add', 'subtract', 'multiply', 'divide', 'modulo', 'pow'],
    languages: {
      python: {
        code: `a = 14
b = 4

sum_val = a + b      # 18
diff_val = a - b     # 10
prod_val = a * b     # 56
div_float = a / b    # 3.5 (standard float division)
div_int = a // b     # 3 (integer floor division)
rem = a % b          # 2 (modulo)
power = a ** 2       # 196 (exponentiation)

# Note on negative modulo:
# Python floor division causes (-1) % 5 == 4`,
        notes: 'In Python, / returns float. Use // for integer floor division.',
      },
      java: {
        code: `int a = 14;
int b = 4;

int sum = a + b;           // 18
int diff = a - b;          // 10
int prod = a * b;          // 56
int divInt = a / b;        // 3 (integer division truncates towards zero)
double divFloat = (double) a / b; // 3.5

int rem = a % b;           // 2
double power = Math.pow(a, 2); // 196.0

// Safe modulo with potentially negative numbers:
int safeMod = (a % b + b) % b;`,
        notes: 'Casting at least one operand to double ensures fractional floating point division.',
      },
      cpp: {
        code: `#include <cmath>

int a = 14, b = 4;

int sum = a + b;           // 18
int diff = a - b;          // 10
int prod = a * b;          // 56
int div_int = a / b;       // 3 (truncates towards zero)
double div_float = (double)a / b; // 3.5

int rem = a % b;           // 2
double p = pow(a, 2);      // 196.0

// Safe modulo with negative dividend:
int safe_rem = (a % b + b) % b;`,
        notes: 'Integer division in C++ rounds towards zero. For negative modulo, (a % b + b) % b ensures non-negative remainder.',
      },
      javascript: {
        code: `const a = 14;
const b = 4;

const sum = a + b;            // 18
const diff = a - b;           // 10
const prod = a * b;           // 56
const divFloat = a / b;       // 3.5
const divInt = Math.floor(a / b); // 3 (or Math.trunc(a / b))
const rem = a % b;            // 2
const power = a ** 2;         // 196 (or Math.pow(a, 2))

// Safe modulo helper for negative dividends:
const mod = (n, m) => ((n % m) + m) % m;`,
        notes: 'In JavaScript / always produces a float. Use Math.floor or Math.trunc for integer quotient.',
      },
    },
  },
  {
    id: 'comparison-operators',
    categoryId: 'basics',
    title: 'Comparison Operators',
    summary: 'Equality, inequality, greater/less than, and object/string comparison warnings.',
    explanation: 'Evaluating relations between numbers, characters, and objects with language-specific identity caveats.',
    keywords: ['comparison', 'equals', 'greater than', 'less than', '==', '!=', '===', 'equals'],
    languages: {
      python: {
        code: `x = 10
y = 20

# Relational comparisons
is_equal = (x == y)      # False
not_equal = (x != y)     # True
less = (x < y)           # True
greater_eq = (x >= y)    # False

# Chained comparisons in Python
valid = (0 <= x < 100)   # True

# Identity comparison vs value comparison
# '==' checks value; 'is' checks object identity
is_none = (x is None)`,
        notes: 'Python supports chained comparisons like 0 <= x < 100 naturally.',
      },
      java: {
        code: `int x = 10;
int y = 20;

boolean isEqual = (x == y);   // false
boolean notEqual = (x != y);  // true
boolean less = (x < y);       // true
boolean greaterEq = (x >= y); // false

// CRITICAL: Strings and Objects must use .equals()
String s1 = new String("cgp");
String s2 = new String("cgp");
boolean valueEquals = s1.equals(s2); // true
boolean refEquals = (s1 == s2);      // false (compares memory address!)`,
        notes: 'Never use == to compare Java Strings or Objects for value equality. Always use .equals().',
      },
      cpp: {
        code: `int x = 10;
int y = 20;

bool is_equal = (x == y);   // false
bool not_equal = (x != y);  // true
bool less = (x < y);       // true
bool greater_eq = (x >= y); // false

// std::string compares lexicographically with ==
#include <string>
std::string s1 = "cgp", s2 = "cgp";
bool str_equal = (s1 == s2); // true`,
        notes: 'In C++, std::string implements operator== and compares string contents, not pointers.',
      },
      javascript: {
        code: `const x = 10;
const y = 20;

// Relational comparisons
const less = (x < y);       // true
const greaterEq = (x >= y); // false

// Always use strict equality (===) over loose equality (==)
const strictEqual = (x === 10);     // true
const looseEqual = (x == "10");     // true (coercion warning!)
const strictNotEqual = (x !== y);   // true

// Objects and arrays compare reference, not contents
const a = [1, 2];
const b = [1, 2];
const sameRef = (a === b); // false`,
        notes: 'Always prefer strict equality (=== and !==) to prevent unexpected type coercion bugs.',
      },
    },
  },
  {
    id: 'logical-operators',
    categoryId: 'basics',
    title: 'Logical Operators',
    summary: 'Boolean AND, OR, NOT, and short-circuit evaluation rules.',
    explanation: 'Combining truth values and taking advantage of short-circuit evaluation to guard against null/out-of-bounds access.',
    keywords: ['and', 'or', 'not', 'logical', '&&', '||', '!', 'short circuit'],
    languages: {
      python: {
        code: `a = True
b = False

# Logical AND, OR, NOT keywords
res_and = a and b    # False
res_or = a or b      # True
res_not = not a      # False

# Short-circuit guard (right side not evaluated if left side suffices)
arr = [10, 20, 30]
idx = 5
# Safe: idx < len(arr) is checked first
if idx < len(arr) and arr[idx] == 30:
    print("Found")`,
        notes: 'Python uses readable keywords: and, or, not instead of symbols.',
      },
      java: {
        code: `boolean a = true;
boolean b = false;

// Logical AND, OR, NOT
boolean resAnd = a && b; // false
boolean resOr = a || b;  // true
boolean resNot = !a;     // false

// Short-circuit prevents ArrayIndexOutOfBoundsException
int[] arr = {10, 20, 30};
int idx = 5;
if (idx >= 0 && idx < arr.length && arr[idx] == 30) {
    System.out.println("Found");
}`,
        notes: 'Use && and || for short-circuit evaluation. & and | evaluate both sides unconditionally.',
      },
      cpp: {
        code: `bool a = true;
bool b = false;

// Logical AND, OR, NOT
bool res_and = a && b; // false
bool res_or = a || b;  // true
bool res_not = !a;     // false

// Short-circuit prevents out of bounds access
#include <vector>
std::vector<int> arr = {10, 20, 30};
int idx = 5;
if (idx >= 0 && idx < (int)arr.size() && arr[idx] == 30) {
    // arr[idx] is never evaluated because idx < arr.size() is false
}`,
        notes: 'Short-circuit guarantees that if the first condition is false in an && chain, following conditions are skipped.',
      },
      javascript: {
        code: `const a = true;
const b = false;

// Logical AND, OR, NOT
const resAnd = a && b; // false
const resOr = a || b;  // true
const resNot = !a;     // false

// Short-circuit evaluation for safety
const arr = [10, 20, 30];
const idx = 5;
if (idx < arr.length && arr[idx] === 30) {
    console.log("Found");
}

// Nullish coalescing (??) checks specifically for null/undefined
const fallback = null ?? "default_value";`,
        notes: 'In JavaScript && and || return the operand value, useful for default assignments.',
      },
    },
  },
  {
    id: 'type-conversion',
    categoryId: 'basics',
    title: 'Type Conversion',
    summary: 'Converting between strings, integers, floats, and characters.',
    explanation: 'Parsing user input from strings into numbers, casting numeric types, and converting numbers to strings.',
    keywords: ['cast', 'convert', 'parse', 'int', 'string', 'float', 'to_string', 'parseInt'],
    languages: {
      python: {
        code: `s = "123"
f_str = "45.67"

# String to numbers
num = int(s)          # 123
flt = float(f_str)    # 45.67

# Number to string
s_num = str(num)      # "123"

# Float to integer (truncates towards zero)
truncated = int(45.9) # 45

# Character ASCII conversion
ascii_code = ord('A') # 65
char_val = chr(65)    # 'A'`,
        notes: 'Use ord(c) and chr(code) for ASCII character arithmetic.',
      },
      java: {
        code: `String s = "123";

// String to numbers
int num = Integer.parseInt(s);
long big = Long.parseLong("1000000000000");
double flt = Double.parseDouble("45.67");

// Number to string
String sNum = String.valueOf(num);
String sBig = Long.toString(big);

// Explicit casting between primitives
double d = 45.9;
int truncated = (int) d; // 45

// Character to ASCII code
char ch = 'A';
int ascii = (int) ch; // 65
char fromAscii = (char) 65; // 'A'`,
        notes: 'Integer.parseInt() throws NumberFormatException if the string contains non-digit characters.',
      },
      cpp: {
        code: `#include <string>
using namespace std;

string s = "123";

// String to numbers
int num = stoi(s);
long long big = stoll("1000000000000");
double flt = stod("45.67");

// Number to string
string s_num = to_string(num);

// Explicit numeric casting
double d = 45.9;
int truncated = (int)d; // 45

// Character to ASCII code
char ch = 'A';
int ascii = (int)ch;    // 65
char from_ascii = (char)65; // 'A'`,
        notes: 'stoi, stoll, and stod are in <string>. to_string converts numeric types to std::string.',
      },
      javascript: {
        code: `const s = "123";

// String to numbers
const num = parseInt(s, 10);     // 123 (always pass radix 10)
const flt = parseFloat("45.67"); // 45.67
const numStrict = Number(s);     // 123

// Number to string
const sNum = String(num);        // "123"
const sNum2 = num.toString();    // "123"

// Character code conversion
const ascii = "A".charCodeAt(0);       // 65
const fromAscii = String.fromCharCode(65); // "A"`,
        notes: 'Always specify base 10 in parseInt(s, 10) to prevent legacy octal parsing surprises.',
      },
    },
  },
  {
    id: 'comments',
    categoryId: 'basics',
    title: 'Comments',
    summary: 'Single-line and multi-line comments in each language.',
    explanation: 'Documenting code and temporarily disabling code blocks during testing.',
    keywords: ['comment', 'single-line', 'multi-line', 'docstring', '//', '#', '/*'],
    languages: {
      python: {
        code: `# Single-line comment starts with hash

"""
Multi-line comments or docstrings
can be enclosed in triple quotes.
"""
x = 10  # Inline comment`,
        notes: 'Triple quotes create multiline string literals often used as documentation docstrings.',
      },
      java: {
        code: `// Single-line comment

/*
 * Multi-line comment
 * for documenting blocks of logic
 */

/**
 * Javadoc documentation comment
 */
int x = 10; // Inline comment`,
        notes: 'Use // for brief notes and /* ... */ for multi-line explanations.',
      },
      cpp: {
        code: `// Single-line comment

/*
 * Multi-line comment
 * for documenting blocks of logic
 */
int x = 10; // Inline comment`,
        notes: 'Standard C/C++ commenting syntax.',
      },
      javascript: {
        code: `// Single-line comment

/*
 * Multi-line comment
 * spanning multiple lines
 */
const x = 10; // Inline comment`,
        notes: 'Single line with // and multi-line with /* ... */.',
      },
    },
  },
]
