import type { SyntaxTopic } from '../types'

export const functionsTopics: SyntaxTopic[] = [
  {
    id: 'function-declaration',
    categoryId: 'functions',
    title: 'Function Declaration & Return Values',
    summary: 'Defining callable functions with typed or dynamic signatures.',
    explanation: 'Basic syntax for defining a function, passing arguments, and returning computed results.',
    keywords: ['def', 'function', 'return', 'declaration', 'methods'],
    languages: {
      python: {
        code: `def add(a: int, b: int) -> int:
    return a + b

# Calling the function
result = add(10, 20)
print(result)  # 30`,
        notes: 'Type hints in Python (a: int) are optional documentation aids and not enforced at runtime.',
      },
      java: {
        code: `public class Main {
    // Static method declaration inside a class
    public static int add(int a, int b) {
        return a + b;
    }

    public static void main(String[] args) {
        int result = add(10, 20);
        System.out.println(result); // 30
    }
}`,
        notes: 'Helper functions in contest solutions must be static to be callable from public static void main.',
      },
      cpp: {
        code: `#include <iostream>
using namespace std;

// Function declaration with return type
int add(int a, int b) {
    return a + b;
}

int main() {
    int result = add(10, 20);
    cout << result << "\\n"; // 30
    return 0;
}`,
        notes: 'Functions in C++ must be declared before their call site or forward-declared with a prototype.',
      },
      javascript: {
        code: `// Function declaration
function add(a, b) {
    return a + b;
}

// Arrow function syntax
const multiply = (a, b) => a * b;

const result = add(10, 20);
console.log(result); // 30`,
        notes: 'Function declarations are hoisted in JavaScript; arrow functions assigned to const are not hoisted.',
      },
    },
  },
  {
    id: 'function-parameters-defaults',
    categoryId: 'functions',
    title: 'Default & Optional Parameters',
    summary: 'Specifying fallback values when arguments are omitted.',
    explanation: 'Supplying default values for arguments.',
    keywords: ['default parameter', 'optional argument', 'overloading'],
    languages: {
      python: {
        code: `def greet(name: str, greeting: str = "Hello") -> str:
    return f"{greeting}, {name}!"

print(greet("Driver"))          # "Hello, Driver!"
print(greet("Driver", "Welcome")) # "Welcome, Driver!"

# WARNING: Never use mutable defaults like def func(arr=[]):!
# Always use None:
def append_val(x, arr=None):
    if arr is None:
        arr = []
    arr.append(x)
    return arr`,
        notes: 'Default parameter values are evaluated once at function definition time. Never use mutable defaults like [] or {}.',
      },
      java: {
        code: `public class Main {
    // Java does not support default parameters directly; use method overloading:
    public static String greet(String name) {
        return greet(name, "Hello");
    }

    public static String greet(String name, String greeting) {
        return greeting + ", " + name + "!";
    }

    public static void main(String[] args) {
        System.out.println(greet("Driver")); // "Hello, Driver!"
    }
}`,
        notes: 'In Java, implement default arguments by overloading methods with fewer parameters.',
      },
      cpp: {
        code: `#include <iostream>
#include <string>
using namespace std;

// In C++, default arguments are declared from right to left
string greet(string name, string greeting = "Hello") {
    return greeting + ", " + name + "!";
}

int main() {
    cout << greet("Driver") << "\\n"; // "Hello, Driver!"
    return 0;
}`,
        notes: 'All parameters following a default parameter must also have defaults.',
      },
      javascript: {
        code: `function greet(name, greeting = "Hello") {
    return \`\${greeting}, \${name}!\`;
}

console.log(greet("Driver")); // "Hello, Driver!"
console.log(greet("Driver", "Welcome")); // "Welcome, Driver!"`,
        notes: 'Default parameters in JavaScript evaluate at call time if the argument is undefined.',
      },
    },
  },
  {
    id: 'void-functions',
    categoryId: 'functions',
    title: 'Void Functions (No Return Value)',
    summary: 'Executing actions and state updates without returning a value.',
    explanation: 'Procedures that perform I/O, array modifications, or recursion side-effects without returning data.',
    keywords: ['void', 'no return', 'procedure', 'side effects'],
    languages: {
      python: {
        code: `def log_status(message: str) -> None:
    print(f"[STATUS] {message}")
    # return is optional or can be bare:
    return

log_status("Engine ready")`,
        notes: 'In Python, functions without an explicit return statement implicitly return None.',
      },
      java: {
        code: `public static void logStatus(String message) {
    System.out.println("[STATUS] " + message);
    // return; is optional
}

public static void main(String[] args) {
    logStatus("Engine ready");
}`,
        notes: 'Use void as the return type in Java when no value is returned.',
      },
      cpp: {
        code: `#include <iostream>
#include <string>
using namespace std;

void log_status(const string& message) {
    cout << "[STATUS] " << message << "\\n";
}

int main() {
    log_status("Engine ready");
    return 0;
}`,
        notes: 'Pass large types like string or vector by const reference (const string&) in void functions to avoid copies.',
      },
      javascript: {
        code: `function logStatus(message) {
    console.log(\`[STATUS] \${message}\`);
}

logStatus("Engine ready");`,
        notes: 'A JavaScript function without a return statement returns undefined.',
      },
    },
  },
  {
    id: 'recursion-syntax',
    categoryId: 'functions',
    title: 'Recursive Function Structure',
    summary: 'Base case and recursive step pattern.',
    explanation: 'Structuring a recursive call with a clear termination condition (base case) and inductive reduction.',
    keywords: ['recursion', 'base case', 'recursive step', 'call stack', 'recursion limit'],
    languages: {
      python: {
        code: `import sys
# Increase recursion limit if recursion depth exceeds 1000
sys.setrecursionlimit(200000)

def countdown(n: int) -> None:
    # 1. Base Case: stops recursion
    if n <= 0:
        print("Go!")
        return

    # 2. Recursive Step
    print(n)
    countdown(n - 1)

countdown(3)`,
        notes: 'Python default recursion depth is 1000. In competitive programming, always set sys.setrecursionlimit(200000).',
      },
      java: {
        code: `public static void countdown(int n) {
    // 1. Base Case
    if (n <= 0) {
        System.out.println("Go!");
        return;
    }

    // 2. Recursive Step
    System.out.println(n);
    countdown(n - 1);
}`,
        notes: 'Excessive recursion depth in Java causes StackOverflowError. Use loops or iterative DFS for deep graphs.',
      },
      cpp: {
        code: `#include <iostream>
using namespace std;

void countdown(int n) {
    // 1. Base Case
    if (n <= 0) {
        cout << "Go!\\n";
        return;
    }

    // 2. Recursive Step
    cout << n << "\\n";
    countdown(n - 1);
}`,
        notes: 'C++ recursion is fast, but stack frames are bounded by the OS stack size.',
      },
      javascript: {
        code: `function countdown(n) {
    // 1. Base Case
    if (n <= 0) {
        console.log("Go!");
        return;
    }

    // 2. Recursive Step
    console.log(n);
    countdown(n - 1);
}`,
        notes: 'V8 recursion stack limit is typically around 10,000 frames.',
      },
    },
  },
  {
    id: 'lambdas-anonymous',
    categoryId: 'functions',
    title: 'Anonymous Functions & Lambdas',
    summary: 'Inline short functions for sorting keys and callbacks.',
    explanation: 'Anonymous callable expressions passed directly into sort keys, maps, and filters.',
    keywords: ['lambda', 'anonymous function', 'arrow function', 'inline function'],
    languages: {
      python: {
        code: `# Syntax: lambda arg1, arg2: expression
square = lambda x: x * x
print(square(5))  # 25

# Used as key function in sorting
pairs = [(1, 'b'), (2, 'a')]
pairs.sort(key=lambda p: p[1]) # Sort by second element`,
        notes: 'Python lambdas can only contain a single expression, not multiple statements.',
      },
      java: {
        code: `import java.util.function.Function;
import java.util.function.BinaryOperator;

// Lambda expression syntax: (params) -> expression
BinaryOperator<Integer> add = (a, b) -> a + b;
int sum = add.apply(10, 20); // 30

// Commonly used in Comparator:
// Comparator.comparing(item -> item.getName());`,
        notes: 'Java lambdas target functional interfaces (interfaces with a single abstract method).',
      },
      cpp: {
        code: `#include <iostream>
using namespace std;

// C++ Lambda syntax: [capture](parameters) -> return_type { body }
auto square = [](int x) {
    return x * x;
};

// Capture local variable by reference [&] or value [=]
int factor = 3;
auto multiply = [&factor](int x) {
    return x * factor;
};

int val = square(5); // 25`,
        notes: '[&] captures surrounding local variables by reference; [=] captures by value.',
      },
      javascript: {
        code: `// Arrow function syntax
const square = x => x * x;
const add = (a, b) => a + b;

// Multi-line arrow function with block body
const compute = (a, b) => {
    const sum = a + b;
    return sum * 2;
};`,
        notes: 'Single argument arrow functions omit parentheses; single expressions omit return.',
      },
    },
  },
]
