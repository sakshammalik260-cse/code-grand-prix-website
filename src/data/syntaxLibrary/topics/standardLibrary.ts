import type { SyntaxTopic } from '../types'

export const standardLibraryTopics: SyntaxTopic[] = [
  {
    id: 'stdlib-math-min-max-abs',
    categoryId: 'standard-library',
    title: 'Math: Min, Max, and Absolute Value',
    summary: 'Standard mathematical bounds, clamping, and magnitude.',
    explanation: 'Basic math routines available across all language standard libraries.',
    keywords: ['min', 'max', 'abs', 'absolute value', 'math', 'clamp'],
    quickReference: true,
    languages: {
      python: {
        code: `# Built-in functions (no import required)
smallest = min(10, 20, 5)  # 5
largest = max(10, 20, 5)   # 20
magnitude = abs(-42)       # 42

# Clamping a value between low and high
val = 150
clamped = max(0, min(val, 100)) # 100`,
        notes: 'min() and max() accept multiple arguments or single iterables in Python.',
      },
      java: {
        code: `// Math class is in java.lang (automatically imported)
int smallest = Math.min(10, 20);     // 10
int largest = Math.max(10, 20);      // 20
int magnitude = Math.abs(-42);       // 42

// Clamping (Java 21+ Math.clamp, or manual):
int val = 150;
int clamped = Math.max(0, Math.min(val, 100)); // 100`,
        notes: 'Math.min/max in Java only take two arguments at a time. Chain them for 3+ values.',
      },
      cpp: {
        code: `#include <algorithm>
#include <cmath>
using namespace std;

// min and max from <algorithm>
int smallest = min({10, 20, 5}); // 5 (initializer list)
int largest = max({10, 20, 5});  // 20

// abs from <cmath> or <cstdlib>
int magnitude = abs(-42);        // 42

// std::clamp (C++17)
int val = 150;
int clamped = clamp(val, 0, 100); // 100`,
        notes: 'min({a, b, c}) allows passing arbitrary initializer lists in C++11 and later.',
      },
      javascript: {
        code: `// Built-in Math object
const smallest = Math.min(10, 20, 5); // 5
const largest = Math.max(10, 20, 5);  // 20
const magnitude = Math.abs(-42);      // 42

// Clamping helper
const clamp = (val, min, max) => Math.max(min, Math.min(val, max));`,
        notes: 'Math.min() and Math.max() take variable arguments separated by commas.',
      },
    },
  },
  {
    id: 'stdlib-math-pow-sqrt-round',
    categoryId: 'standard-library',
    title: 'Math: Power, Square Root, Floor, and Ceil',
    summary: 'Exponentiation, square roots, and rounding modes.',
    explanation: 'Computing powers, square roots, and rounding decimal numbers.',
    keywords: ['pow', 'sqrt', 'floor', 'ceil', 'round', 'square root', 'power'],
    languages: {
      python: {
        code: `import math

# Exponentiation
p1 = 2 ** 10           # 1024 (integer result)
p_mod = pow(2, 10, 10**9 + 7) # Modular exponentiation in O(log b)!

# Square root
root = math.isqrt(100) # 10 (integer square root, no float inaccuracies)
root_f = math.sqrt(50) # 7.0710678...

# Rounding
down = math.floor(3.9) # 3
up = math.ceil(3.1)    # 4
nearest = round(3.5)   # 4 (banker's rounding in Python)`,
        notes: 'math.isqrt(n) returns exact integer square root floor(sqrt(n)) without float imprecision.',
      },
      java: {
        code: `import java.lang.Math;

// Power
double power = Math.pow(2, 10); // 1024.0

// Square root
double root = Math.sqrt(100);   // 10.0

// Rounding
int down = (int) Math.floor(3.9); // 3
int up = (int) Math.ceil(3.1);     // 4
long nearest = Math.round(3.5);    // 4

// Integer ceiling division trick: ceil(a / b) = (a + b - 1) / b
int a = 10, b = 3;
int ceilDiv = (a + b - 1) / b; // 4`,
        notes: 'The integer formula (a + b - 1) / b computes ceiling division safely without converting to float.',
      },
      cpp: {
        code: `#include <cmath>
using namespace std;

// Power
double power = pow(2, 10); // 1024.0

// Square root
double root = sqrt(100);   // 10.0

// Rounding
int down = floor(3.9);     // 3
int up = ceil(3.1);        // 4
int nearest = round(3.5);  // 4

// Fast modular exponentiation: (base^exp) % mod in O(log exp)
long long power_mod(long long base, long long exp, long long mod) {
    long long res = 1;
    base %= mod;
    while (exp > 0) {
        if (exp % 2 == 1) res = (res * base) % mod;
        base = (base * base) % mod;
        exp /= 2;
    }
    return res;
}`,
        notes: 'pow() and sqrt() are declared in <cmath>. Use integer bit operations for binary powers.',
      },
      javascript: {
        code: `// Power
const power = 2 ** 10;        // 1024 (or Math.pow(2, 10))

// Square root
const root = Math.sqrt(100);  // 10

// Rounding
const down = Math.floor(3.9); // 3
const up = Math.ceil(3.1);    // 4
const nearest = Math.round(3.5); // 4

// Integer ceiling division
const ceilDiv = (a, b) => Math.floor((a + b - 1) / b);`,
        notes: 'Use exponentiation operator ** for clean power expressions.',
      },
    },
  },
  {
    id: 'stdlib-binary-search',
    categoryId: 'standard-library',
    title: 'Binary Search in Sorted Collections',
    summary: 'O(log N) search, lower bound, and upper bound lookups.',
    explanation: 'Finding elements or insertion index points in pre-sorted arrays.',
    keywords: ['binary search', 'bisect', 'lower_bound', 'upper_bound', 'log n search'],
    languages: {
      python: {
        code: `import bisect

# Array MUST be sorted
arr = [10, 20, 20, 20, 30, 40]

# bisect_left: first index where x can be inserted (equivalent to lower_bound)
idx_left = bisect.bisect_left(arr, 20)  # 1

# bisect_right: index after last occurrence of x (equivalent to upper_bound)
idx_right = bisect.bisect_right(arr, 20) # 4

# Check exact existence
exists = (idx_left < len(arr) and arr[idx_left] == 20) # True`,
        notes: 'bisect_left finds the first index >= target. bisect_right finds the first index > target.',
      },
      java: {
        code: `import java.util.Arrays;

int[] arr = {10, 20, 30, 40, 50}; // MUST be sorted

// Arrays.binarySearch returns non-negative index if found.
// If absent, returns (-(insertion point) - 1).
int idx = Arrays.binarySearch(arr, 30); // 2

int notFound = Arrays.binarySearch(arr, 25); // -3 (insertion point is 2)
int insertionPoint = -notFound - 1; // 2`,
        notes: 'If element is absent, (-index - 1) reveals where the item would be inserted to preserve sort order.',
      },
      cpp: {
        code: `#include <vector>
#include <algorithm>
using namespace std;

vector<int> arr = {10, 20, 20, 20, 30, 40}; // MUST be sorted

// lower_bound: returns iterator to first element >= target
auto it_low = lower_bound(arr.begin(), arr.end(), 20);
int idx_low = distance(arr.begin(), it_low); // 1

// upper_bound: returns iterator to first element > target
auto it_up = upper_bound(arr.begin(), arr.end(), 20);
int idx_up = distance(arr.begin(), it_up);   // 4

// Count occurrences of 20:
int count_20 = idx_up - idx_low; // 3`,
        notes: 'distance(arr.begin(), it) converts the iterator returned by lower_bound into a 0-based array index.',
      },
      javascript: {
        code: `const arr = [10, 20, 20, 20, 30, 40];

// Standard custom binary search implementation for CP:
function lowerBound(arr, target) {
    let low = 0, high = arr.length;
    while (low < high) {
        const mid = (low + high) >> 1;
        if (arr[mid] < target) low = mid + 1;
        else high = mid;
    }
    return low; // First index where arr[index] >= target
}

const idx = lowerBound(arr, 20); // 1`,
        notes: '(low + high) >> 1 computes the integer midpoint quickly using bitwise shift.',
      },
    },
  },
  {
    id: 'stdlib-membership',
    categoryId: 'standard-library',
    title: 'Checking Membership in Collections',
    summary: 'Checking if an element exists in a list, set, or map.',
    explanation: 'Testing whether an item exists in a data structure. Note that list lookups are O(N), whereas Set and Map lookups are O(1).',
    keywords: ['membership', 'contains', 'has', 'in', 'count'],
    languages: {
      python: {
        code: `# In Set or Dict: O(1) average lookup
s = {10, 20, 30}
d = {"a": 1, "b": 2}

has_20 = 20 in s        # True
has_key = "a" in d      # True

# In List: O(N) linear search
arr = [10, 20, 30]
in_list = 20 in arr     # True (O(N))`,
        notes: 'Always prefer Set or Dict for membership testing when doing repeated queries in competitive problems.',
      },
      java: {
        code: `import java.util.Set;
import java.util.HashSet;
import java.util.Map;
import java.util.HashMap;

Set<Integer> set = new HashSet<>();
set.add(20);
boolean hasSet = set.contains(20); // true (O(1))

Map<String, Integer> map = new HashMap<>();
map.put("a", 1);
boolean hasKey = map.containsKey("a"); // true (O(1))`,
        notes: 'contains() on HashSet and containsKey() on HashMap execute in O(1) expected time.',
      },
      cpp: {
        code: `#include <unordered_set>
#include <unordered_map>
using namespace std;

unordered_set<int> s = {10, 20, 30};
bool in_set = s.count(20) > 0; // true (O(1))

unordered_map<string, int> m = {{"a", 1}};
bool in_map = m.count("a") > 0; // true (O(1))`,
        notes: 'In C++, s.count(key) returns 1 if key is present and 0 otherwise, providing a concise boolean test.',
      },
      javascript: {
        code: `const set = new Set([10, 20, 30]);
const inSet = set.has(20); // true (O(1))

const map = new Map([["a", 1]]);
const inMap = map.has("a"); // true (O(1))

const arr = [10, 20, 30];
const inArr = arr.includes(20); // true (O(N))`,
        notes: 'Use set.has() or map.has() for O(1) checks. arr.includes() is linear O(N).',
      },
    },
  },
  {
    id: 'stdlib-map-iteration',
    categoryId: 'standard-library',
    title: 'Iterating Over Maps / Dictionaries',
    summary: 'Traversing keys, values, and key-value entry pairs.',
    explanation: 'Looping through keys and associated values in associative structures.',
    keywords: ['map iteration', 'dict items', 'entries', 'keys', 'values', 'traverse map'],
    languages: {
      python: {
        code: `d = {"Monaco": 1, "Silverstone": 2, "Monza": 3}

# 1. Iterate over (key, value) pairs with .items()
for key, value in d.items():
    print(f"{key} -> {value}")

# 2. Iterate over keys
for key in d.keys(): # Or simply: for key in d:
    print(key)

# 3. Iterate over values
for val in d.values():
    print(val)`,
        notes: 'for key, value in d.items(): is the idiomatic dictionary traversal in Python.',
      },
      java: {
        code: `import java.util.Map;
import java.util.HashMap;

Map<String, Integer> map = new HashMap<>();
map.put("Monaco", 1);
map.put("Silverstone", 2);

// 1. Iterate over key-value entries
for (Map.Entry<String, Integer> entry : map.entrySet()) {
    System.out.println(entry.getKey() + " -> " + entry.getValue());
}

// 2. Iterate over keys
for (String key : map.keySet()) {
    System.out.println(key);
}

// 3. Iterate over values
for (int val : map.values()) {
    System.out.println(val);
}`,
        notes: 'map.entrySet() is more efficient than looking up map.get(key) inside a map.keySet() loop.',
      },
      cpp: {
        code: `#include <unordered_map>
#include <string>
#include <iostream>
using namespace std;

unordered_map<string, int> m = {{"Monaco", 1}, {"Silverstone", 2}};

// 1. Structured binding iteration (C++17)
for (const auto& [key, value] : m) {
    cout << key << " -> " << value << "\\n";
}

// 2. Traditional pair iteration
for (const auto& entry : m) {
    cout << entry.first << " -> " << entry.second << "\\n";
}`,
        notes: 'Structured binding for (const auto& [key, val] : map) is clean and avoids copying elements.',
      },
      javascript: {
        code: `const map = new Map([["Monaco", 1], ["Silverstone", 2]]);

// 1. Iterate over [key, value] pairs
for (const [key, value] of map.entries()) {
    console.log(\`\${key} -> \${value}\`);
}

// 2. Iterate over keys
for (const key of map.keys()) {
    console.log(key);
}

// 3. Plain object iteration
const obj = { Monaco: 1, Silverstone: 2 };
for (const [k, v] of Object.entries(obj)) {
    console.log(k, v);
}`,
        notes: 'for (const [k, v] of map) automatically unpacks key and value.',
      },
    },
  },
  {
    id: 'stdlib-set-iteration',
    categoryId: 'standard-library',
    title: 'Iterating Over Sets',
    summary: 'Traversing distinct elements stored in a Set.',
    explanation: 'Visiting all elements in a set. (Order is not guaranteed in hash sets).',
    keywords: ['set iteration', 'traverse set', 'distinct loop'],
    languages: {
      python: {
        code: `s = {10, 20, 30, 40}

for item in s:
    print(item)`,
        notes: 'Python set iteration order is arbitrary. Use sorted(s) if elements must be visited in order.',
      },
      java: {
        code: `import java.util.HashSet;
import java.util.Set;

Set<Integer> set = new HashSet<>();
set.add(10);
set.add(20);

// Enhanced for loop
for (int item : set) {
    System.out.println(item);
}`,
        notes: 'HashSet order is undefined. Use TreeSet if sorted iteration is required.',
      },
      cpp: {
        code: `#include <unordered_set>
#include <iostream>
using namespace std;

unordered_set<int> s = {10, 20, 30, 40};

// Range-based for loop
for (int item : s) {
    cout << item << "\\n";
}`,
        notes: 'unordered_set order is not sorted. Use std::set for ordered elements.',
      },
      javascript: {
        code: `const set = new Set([10, 20, 30, 40]);

// for...of iterates over set values in insertion order
for (const item of set) {
    console.log(item);
}`,
        notes: 'JavaScript Set retains insertion order during iteration.',
      },
    },
  },
]
