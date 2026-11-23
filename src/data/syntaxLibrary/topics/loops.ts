import type { SyntaxTopic } from '../types'

export const loopsTopics: SyntaxTopic[] = [
  {
    id: 'for-loop-0-to-n',
    categoryId: 'loops',
    title: 'Loop from 0 to N - 1',
    summary: 'Standard 0-indexed loop executing exactly N times.',
    explanation: 'Iterates through index values 0, 1, 2, ..., N - 1. Essential for 0-indexed arrays and collections.',
    keywords: ['for loop', '0 to n', 'range', 'iteration', 'counter'],
    quickReference: true,
    languages: {
      python: {
        code: `n = 5

# range(n) produces numbers 0, 1, 2, ..., n - 1 (n is excluded)
for i in range(n):
    print(i)  # Prints 0, 1, 2, 3, 4`,
        notes: 'range(n) starts at 0 and stops strictly before n.',
      },
      java: {
        code: `int n = 5;

// Standard 0-indexed for loop
for (int i = 0; i < n; i++) {
    System.out.println(i); // Prints 0, 1, 2, 3, 4
}`,
        notes: 'Condition i < n ensures the loop runs exactly n times from 0 to n - 1.',
      },
      cpp: {
        code: `int n = 5;

// Standard 0-indexed for loop
for (int i = 0; i < n; i++) {
    cout << i << "\\n"; // Prints 0, 1, 2, 3, 4
}`,
        notes: 'Pre-increment ++i is conventionally preferred in C++ for general iterators.',
      },
      javascript: {
        code: `const n = 5;

// Standard 0-indexed for loop
for (let i = 0; i < n; i++) {
    console.log(i); // Prints 0, 1, 2, 3, 4
}`,
        notes: 'Always declare loop variable with let, not var, to prevent global scope leakage.',
      },
    },
  },
  {
    id: 'for-loop-1-to-n',
    categoryId: 'loops',
    title: 'Loop from 1 to N (Inclusive)',
    summary: '1-indexed loop running from 1 up to and including N.',
    explanation: 'Iterates through values 1, 2, ..., N. Frequently used when contest problems use 1-based indexing.',
    keywords: ['for loop', '1 to n', 'inclusive', '1-based indexing', 'range'],
    languages: {
      python: {
        code: `n = 5

# CRITICAL DIFFERENCE: range(1, n + 1) is needed to INCLUDE n
# range(1, n) would stop at n - 1!
for i in range(1, n + 1):
    print(i)  # Prints 1, 2, 3, 4, 5`,
        notes: 'In Python, the stop argument is always exclusive. To include n, write range(1, n + 1).',
      },
      java: {
        code: `int n = 5;

// Inclusive bounds: i <= n
for (int i = 1; i <= n; i++) {
    System.out.println(i); // Prints 1, 2, 3, 4, 5
}`,
        notes: 'Use <= n to include n as the final iteration.',
      },
      cpp: {
        code: `int n = 5;

// Inclusive bounds: i <= n
for (int i = 1; i <= n; i++) {
    cout << i << "\\n"; // Prints 1, 2, 3, 4, 5
}`,
        notes: 'Use <= n for 1-based contest problem indexing.',
      },
      javascript: {
        code: `const n = 5;

// Inclusive bounds: i <= n
for (let i = 1; i <= n; i++) {
    console.log(i); // Prints 1, 2, 3, 4, 5
}`,
        notes: 'Use i <= n for 1-based loops.',
      },
    },
  },
  {
    id: 'for-loop-reverse',
    categoryId: 'loops',
    title: 'Reverse Iteration',
    summary: 'Counting down from N - 1 down to 0, or N down to 1.',
    explanation: 'Iterates backwards. Vital for dynamic programming space optimization, monotonic stacks, and parsing from right to left.',
    keywords: ['reverse loop', 'countdown', 'backwards', 'decrement', 'reverse'],
    languages: {
      python: {
        code: `n = 5

# Reverse from n - 1 down to 0: range(start, stop, step)
# Stop is -1 because -1 is exclusive (so it stops after 0)
for i in range(n - 1, -1, -1):
    print(i)  # Prints 4, 3, 2, 1, 0

# Alternative using reversed()
for i in reversed(range(n)):
    print(i)

# Reverse from n down to 1:
for i in range(n, 0, -1):
    print(i)  # Prints 5, 4, 3, 2, 1`,
        notes: 'To include 0 when stepping by -1, the stop parameter must be -1.',
      },
      java: {
        code: `int n = 5;

// Reverse from n - 1 down to 0
for (int i = n - 1; i >= 0; i--) {
    System.out.println(i); // Prints 4, 3, 2, 1, 0
}

// Reverse from n down to 1
for (int i = n; i >= 1; i--) {
    System.out.println(i); // Prints 5, 4, 3, 2, 1
}`,
        notes: 'Ensure condition is i >= 0 and decrement is i--.',
      },
      cpp: {
        code: `int n = 5;

// Reverse from n - 1 down to 0 (signed int)
for (int i = n - 1; i >= 0; i--) {
    cout << i << "\\n"; // Prints 4, 3, 2, 1, 0
}

// WARNING: If using unsigned types (size_t), i >= 0 causes an infinite loop!
// Safe unsigned loop:
for (size_t i = n; i-- > 0; ) {
    cout << i << "\\n";
}`,
        notes: 'Always use signed int for countdown loops in C++ to prevent unsigned underflow bugs.',
      },
      javascript: {
        code: `const n = 5;

// Reverse from n - 1 down to 0
for (let i = n - 1; i >= 0; i--) {
    console.log(i); // Prints 4, 3, 2, 1, 0
}

// Reverse from n down to 1
for (let i = n; i >= 1; i--) {
    console.log(i); // Prints 5, 4, 3, 2, 1
}`,
        notes: 'Standard reverse for loop pattern with decrement i--.',
      },
    },
  },
  {
    id: 'for-loop-step',
    categoryId: 'loops',
    title: 'Loop with Custom Increment / Step',
    summary: 'Stepping by 2, K, or arbitrary increments.',
    explanation: 'Advancing the loop variable by steps greater than 1, e.g. checking only even numbers or iterating in chunks.',
    keywords: ['step', 'increment', 'stride', 'skip', 'custom step'],
    languages: {
      python: {
        code: `n = 10

# Step by 2: range(start, stop, step)
for i in range(0, n, 2):
    print(i)  # Prints 0, 2, 4, 6, 8

# Step by 3 starting at 1:
for i in range(1, n, 3):
    print(i)  # Prints 1, 4, 7`,
        notes: 'The third parameter of range() sets the step size.',
      },
      java: {
        code: `int n = 10;

// Step by 2
for (int i = 0; i < n; i += 2) {
    System.out.println(i); // Prints 0, 2, 4, 6, 8
}

// Step by 3 starting at 1
for (int i = 1; i < n; i += 3) {
    System.out.println(i); // Prints 1, 4, 7
}`,
        notes: 'Use i += step in the loop update clause.',
      },
      cpp: {
        code: `int n = 10;

// Step by 2
for (int i = 0; i < n; i += 2) {
    cout << i << "\\n"; // Prints 0, 2, 4, 6, 8
}

// Step by 3
for (int i = 1; i < n; i += 3) {
    cout << i << "\\n"; // Prints 1, 4, 7
}`,
        notes: 'Update with i += k for arbitrary strides.',
      },
      javascript: {
        code: `const n = 10;

// Step by 2
for (let i = 0; i < n; i += 2) {
    console.log(i); // Prints 0, 2, 4, 6, 8
}

// Step by 3
for (let i = 1; i < n; i += 3) {
    console.log(i); // Prints 1, 4, 7
}`,
        notes: 'Use i += 2 to advance two steps at a time.',
      },
    },
  },
  {
    id: 'for-each-array',
    categoryId: 'loops',
    title: 'Iterating Through Arrays & Lists',
    summary: 'Range-based and enhanced for-each loops across collections.',
    explanation: 'Iterating directly over values or simultaneously over both index and value.',
    keywords: ['for each', 'range based for', 'enumerate', 'for of', 'enhanced for'],
    languages: {
      python: {
        code: `arr = [10, 20, 30, 40]

# Value only
for x in arr:
    print(x)

# Index and value with enumerate()
for i, x in enumerate(arr):
    print(f"Index {i} has value {x}")`,
        notes: 'enumerate(arr) is the cleanest and most idiomatic way to get both index and element in Python.',
      },
      java: {
        code: `int[] arr = {10, 20, 30, 40};

// Enhanced for loop (value only)
for (int x : arr) {
    System.out.println(x);
}

// Indexed loop when index is needed
for (int i = 0; i < arr.length; i++) {
    System.out.printf("Index %d has value %d%n", i, arr[i]);
}`,
        notes: 'Enhanced for-each loop cannot modify array elements directly by reassigning x.',
      },
      cpp: {
        code: `#include <vector>
#include <iostream>
using namespace std;

vector<int> arr = {10, 20, 30, 40};

// Range-based for loop (read-only reference)
for (const auto& x : arr) {
    cout << x << "\\n";
}

// Range-based for loop (by mutable reference)
for (auto& x : arr) {
    x *= 2; // Modifies the original vector elements
}`,
        notes: 'Use const auto& to avoid copying large objects. Use auto& when modifying elements.',
      },
      javascript: {
        code: `const arr = [10, 20, 30, 40];

// for...of iterates over array VALUES
for (const x of arr) {
    console.log(x);
}

// forEach with index
arr.forEach((x, i) => {
    console.log(\`Index \${i} has value \${x}\`);
});

// WARNING: for...in iterates over object KEYS/INDICES (as strings), NOT values!`,
        notes: 'Always use for...of for array values. Never use for...in for array elements in competition.',
      },
    },
  },
  {
    id: 'for-each-string',
    categoryId: 'loops',
    title: 'Iterating Through Characters in a String',
    summary: 'Traversing every character of a string.',
    explanation: 'Accessing characters one by one for frequency counts, palindrome checks, and parsing.',
    keywords: ['string iteration', 'characters', 'char', 'toCharArray', 'chars'],
    languages: {
      python: {
        code: `s = "GRANDPRIX"

# Iterate over characters directly
for ch in s:
    print(ch)

# Iterate with index
for i, ch in enumerate(s):
    print(f"Position {i}: {ch}")`,
        notes: 'Python strings are directly iterable character by character.',
      },
      java: {
        code: `String s = "GRANDPRIX";

// Using charAt with index
for (int i = 0; i < s.length(); i++) {
    char ch = s.charAt(i);
    System.out.println(ch);
}

// Using toCharArray() for enhanced for loop
for (char ch : s.toCharArray()) {
    System.out.println(ch);
}`,
        notes: 'toCharArray() creates a char array, making enhanced for loops possible.',
      },
      cpp: {
        code: `#include <string>
#include <iostream>
using namespace std;

string s = "GRANDPRIX";

// Range-based for loop
for (char ch : s) {
    cout << ch << "\\n";
}

// Indexed loop
for (int i = 0; i < (int)s.length(); i++) {
    cout << "Position " << i << ": " << s[i] << "\\n";
}`,
        notes: 'In C++, s[i] returns a char reference without bounds checking (faster for contests).',
      },
      javascript: {
        code: `const s = "GRANDPRIX";

// for...of iterates over characters
for (const ch of s) {
    console.log(ch);
}

// Indexed access
for (let i = 0; i < s.length; i++) {
    console.log(s[i]);
}`,
        notes: 'for...of properly handles multi-byte unicode code points.',
      },
    },
  },
  {
    id: 'while-loop-basic',
    categoryId: 'loops',
    title: 'While Loops & Conditional Termination',
    summary: 'Repeating execution until a boolean condition turns false.',
    explanation: 'Useful for two-pointer algorithms, digit extraction, GCD calculation, and binary search.',
    keywords: ['while', 'while loop', 'condition', 'two pointers', 'gcd'],
    quickReference: true,
    languages: {
      python: {
        code: `# Digit extraction example
num = 12345
digits = []

while num > 0:
    last_digit = num % 10
    digits.append(last_digit)
    num //= 10

# Two-pointer while loop
left, right = 0, 10
while left < right:
    left += 1
    right -= 1`,
        notes: 'Always ensure the loop variable is modified inside the body to prevent infinite loops.',
      },
      java: {
        code: `// Digit extraction
int num = 12345;
while (num > 0) {
    int lastDigit = num % 10;
    num /= 10;
}

// Two-pointer while loop
int left = 0, right = 10;
while (left < right) {
    left++;
    right--;
}`,
        notes: 'Commonly used in two-pointer and sliding window algorithms.',
      },
      cpp: {
        code: `// Digit extraction
int num = 12345;
while (num > 0) {
    int last_digit = num % 10;
    num /= 10;
}

// Two-pointer while loop
int left = 0, right = 10;
while (left < right) {
    left++;
    right--;
}`,
        notes: 'C++ evaluates the while condition before each iteration.',
      },
      javascript: {
        code: `// Digit extraction
let num = 12345;
const digits = [];
while (num > 0) {
    const lastDigit = num % 10;
    digits.push(lastDigit);
    num = Math.floor(num / 10);
}

// Two-pointer while loop
let left = 0, right = 10;
while (left < right) {
    left++;
    right--;
}`,
        notes: 'Remember Math.floor() when updating integers in JS division inside while loops.',
      },
    },
  },
  {
    id: 'nested-loops-2d',
    categoryId: 'loops',
    title: 'Nested Loops & 2D Traversal',
    summary: 'Iterating over 2D grids, pairs, and matrix rows/columns.',
    explanation: 'Nested loops for visiting every cell (row, col) in a grid or all pairs (i, j) with j > i.',
    keywords: ['nested', 'nested loops', '2d', 'matrix traversal', 'pairs'],
    languages: {
      python: {
        code: `rows = 3
cols = 4

# Visit every cell in row-major order
for r in range(rows):
    for c in range(cols):
        print(f"Cell ({r}, {c})")

# All unique pairs (i, j) where i < j
n = 5
for i in range(n):
    for j in range(i + 1, n):
        # pair (i, j)
        pass`,
        notes: 'range(i + 1, n) generates all unique unordered pairs without duplicates.',
      },
      java: {
        code: `int rows = 3;
int cols = 4;

// Row-major grid traversal
for (int r = 0; r < rows; r++) {
    for (int c = 0; c < cols; c++) {
        // process cell at (r, c)
    }
}

// All unique pairs (i, j) where i < j
int n = 5;
for (int i = 0; i < n; i++) {
    for (int j = i + 1; j < n; j++) {
        // process pair (i, j)
    }
}`,
        notes: 'Traversing in row-major order (outer loop rows, inner loop cols) maximizes CPU cache locality.',
      },
      cpp: {
        code: `int rows = 3;
int cols = 4;

// Row-major grid traversal
for (int r = 0; r < rows; r++) {
    for (int c = 0; c < cols; c++) {
        // cell (r, c)
    }
}

// All unique pairs (i, j) where i < j
int n = 5;
for (int i = 0; i < n; i++) {
    for (int j = i + 1; j < n; j++) {
        // pair (i, j)
    }
}`,
        notes: 'Row-major iteration (r then c) has optimal cache hit rates because C++ 2D arrays are contiguous by row.',
      },
      javascript: {
        code: `const rows = 3;
const cols = 4;

// Grid traversal
for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
        // cell (r, c)
    }
}

// Unique pairs (i, j) where i < j
const n = 5;
for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
        // pair (i, j)
    }
}`,
        notes: 'Standard 2D loop nesting in JavaScript.',
      },
    },
  },
  {
    id: 'loop-control',
    categoryId: 'loops',
    title: 'Break and Continue',
    summary: 'Terminating loops early or skipping to the next iteration.',
    explanation: 'break immediately exits the current enclosing loop. continue skips the remainder of the current step and proceeds to the next iteration.',
    keywords: ['break', 'continue', 'early exit', 'skip', 'loop control'],
    languages: {
      python: {
        code: `for i in range(10):
    if i == 3:
        continue  # Skip 3 and continue to 4
    if i == 7:
        break     # Terminate loop entirely when reaching 7
    print(i)      # Prints 0, 1, 2, 4, 5, 6

# Python loop 'else' clause executes ONLY if no break occurred
target = 42
for x in [1, 2, 3]:
    if x == target:
        break
else:
    print("Target not found in collection")`,
        notes: 'Python for/while loops support an optional else clause that executes only if the loop ran to completion without break.',
      },
      java: {
        code: `for (int i = 0; i < 10; i++) {
    if (i == 3) {
        continue; // Skip 3
    }
    if (i == 7) {
        break;    // Stop loop at 7
    }
    System.out.println(i);
}

// Java labeled break for escaping nested loops
outerLoop:
for (int r = 0; r < 5; r++) {
    for (int c = 0; c < 5; c++) {
        if (r * c == 6) {
            break outerLoop; // Breaks BOTH loops
        }
    }
}`,
        notes: 'Java supports labeled break (e.g., break outerLoop;) to break out of multiple nested loops simultaneously.',
      },
      cpp: {
        code: `for (int i = 0; i < 10; i++) {
    if (i == 3) {
        continue; // Skip 3
    }
    if (i == 7) {
        break;    // Stop loop at 7
    }
    cout << i << "\\n";
}

// Breaking out of nested loops with a flag or return
bool found = false;
for (int r = 0; r < 5 && !found; r++) {
    for (int c = 0; c < 5; c++) {
        if (r * c == 6) {
            found = true;
            break;
        }
    }
}`,
        notes: 'In C++, break only exits the innermost loop. Use a boolean flag or return from a helper function to break outer loops.',
      },
      javascript: {
        code: `for (let i = 0; i < 10; i++) {
    if (i === 3) {
        continue; // Skip 3
    }
    if (i === 7) {
        break;    // Stop loop at 7
    }
    console.log(i);
}

// JavaScript also supports labeled break
outer: for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
        if (r * c === 6) {
            break outer; // Breaks out of outer loop
        }
    }
}`,
        notes: 'Labeled break statements (break labelName;) are valid in JavaScript.',
      },
    },
  },
]
