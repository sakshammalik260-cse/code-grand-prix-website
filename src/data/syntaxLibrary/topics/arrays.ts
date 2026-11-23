import type { SyntaxTopic } from '../types'

export const arraysTopics: SyntaxTopic[] = [
  {
    id: 'array-creation',
    categoryId: 'arrays',
    title: 'Creating & Initializing Arrays',
    summary: 'Declaring arrays and pre-allocating size with initial values.',
    explanation: 'Allocating fixed-size arrays or dynamic lists filled with zeros or default values.',
    keywords: ['array declaration', 'initialize array', 'list', 'vector', 'fill', 'pre-allocate'],
    quickReference: true,
    languages: {
      python: {
        code: `# Literal list creation
arr = [1, 2, 3, 4, 5]

# Pre-allocating size n with default value 0
n = 10
zeros = [0] * n

# Pre-allocating using list comprehension
squares = [i * i for i in range(n)]`,
        notes: 'For 1D arrays, [0] * n creates n independent integer copies safely.',
      },
      java: {
        code: `import java.util.ArrayList;
import java.util.Arrays;

// Fixed-size primitive array (default filled with 0)
int n = 10;
int[] arr = new int[n];

// Initialized with literal values
int[] primes = {2, 3, 5, 7, 11};

// Fill with custom default value
Arrays.fill(arr, -1);

// Dynamic resizable list
ArrayList<Integer> list = new ArrayList<>();`,
        notes: 'Primitive int[] arrays are automatically zero-initialized in Java.',
      },
      cpp: {
        code: `#include <vector>
using namespace std;

// Vector initialized with size n and value 0
int n = 10;
vector<int> arr(n, 0);

// Initializer list
vector<int> primes = {2, 3, 5, 7, 11};

// Fixed-size stack array
int fixed_arr[10] = {0}; // Zero-initialized`,
        notes: 'In C++, vector<int> arr(n, val) dynamically allocates n elements with value val on the heap.',
      },
      javascript: {
        code: `// Array literal
const arr = [1, 2, 3, 4, 5];

// Pre-allocate size n filled with 0
const n = 10;
const zeros = new Array(n).fill(0);

// Pre-allocate using Array.from with mapping function
const squares = Array.from({ length: n }, (_, i) => i * i);`,
        notes: 'new Array(n).fill(0) creates an array of length n filled with 0. Always fill before mapping empty slots.',
      },
    },
  },
  {
    id: 'array-access-update',
    categoryId: 'arrays',
    title: 'Accessing and Updating Elements',
    summary: '0-indexed access, bounds, and negative indexing.',
    explanation: 'Reading and writing elements by their position, including last-element access idioms.',
    keywords: ['array access', 'indexing', 'update element', 'last element', 'negative index'],
    languages: {
      python: {
        code: `arr = [10, 20, 30, 40, 50]

# Access by 0-based index
first = arr[0]     # 10
second = arr[1]    # 20

# Python negative indexing (from end)
last = arr[-1]     # 50
second_last = arr[-2] # 40

# Update element
arr[2] = 99
print(arr)  # [10, 20, 99, 40, 50]`,
        notes: 'arr[-1] accesses the last element directly without requiring len(arr) - 1.',
      },
      java: {
        code: `int[] arr = {10, 20, 30, 40, 50};

// Access by index
int first = arr[0];
int last = arr[arr.length - 1]; // 50

// Update element
arr[2] = 99;

// In ArrayList:
// list.get(index) and list.set(index, value)`,
        notes: 'Accessing an index >= length throws ArrayIndexOutOfBoundsException in Java.',
      },
      cpp: {
        code: `#include <vector>
using namespace std;

vector<int> arr = {10, 20, 30, 40, 50};

// Access by index (no bounds check, O(1) fast)
int first = arr[0];
int last = arr.back(); // Or arr[arr.size() - 1]

// Update element
arr[2] = 99;

// Checked access with exception throwing
int val = arr.at(0);`,
        notes: 'arr.front() and arr.back() provide convenient references to the first and last elements in C++.',
      },
      javascript: {
        code: `const arr = [10, 20, 30, 40, 50];

// Access by index
const first = arr[0];
const last = arr[arr.length - 1];
const lastWithAt = arr.at(-1); // 50 (modern Array.prototype.at)

// Update element
arr[2] = 99;
console.log(arr); // [10, 20, 99, 40, 50]`,
        notes: 'arr.at(-1) returns the last element in modern JavaScript.',
      },
    },
  },
  {
    id: 'array-length',
    categoryId: 'arrays',
    title: 'Finding Array Length & Size',
    summary: 'Checking array length and emptiness across languages.',
    explanation: 'Determining the number of elements in arrays, vectors, and lists.',
    keywords: ['length', 'size', 'count', 'len', 'empty', 'isEmpty'],
    languages: {
      python: {
        code: `arr = [10, 20, 30]

# Total number of elements
size = len(arr)  # 3

# Check if empty (idiomatic Python)
if not arr:
    print("Array is empty")`,
        notes: 'len(arr) executes in O(1) constant time.',
      },
      java: {
        code: `// Fixed-size primitive array uses .length property
int[] arr = {10, 20, 30};
int size = arr.length; // 3

// ArrayList uses .size() method and .isEmpty()
import java.util.ArrayList;
ArrayList<Integer> list = new ArrayList<>();
int listSize = list.size();
boolean empty = list.isEmpty();`,
        notes: 'Note: arr.length has no parentheses for primitive arrays, while list.size() is a method call for collections.',
      },
      cpp: {
        code: `#include <vector>
using namespace std;

vector<int> arr = {10, 20, 30};

// Size of vector (returns size_t, cast to int when comparing with signed)
int size = (int)arr.size(); // 3

// Check if empty (faster than arr.size() == 0)
if (arr.empty()) {
    // empty
}`,
        notes: 'arr.empty() is idiomatic and O(1) for all C++ STL containers.',
      },
      javascript: {
        code: `const arr = [10, 20, 30];

// Total length
const size = arr.length; // 3

// Check if empty
const isEmpty = arr.length === 0;`,
        notes: 'arr.length reflects the highest numeric index plus one.',
      },
    },
  },
  {
    id: 'array-add-remove',
    categoryId: 'arrays',
    title: 'Adding & Removing Elements',
    summary: 'Append, push, pop, and insertion operations.',
    explanation: 'Adding elements to the end or beginning of a collection and removing elements.',
    keywords: ['append', 'push', 'pop', 'push_back', 'pop_back', 'remove', 'add', 'insert'],
    languages: {
      python: {
        code: `arr = [1, 2, 3]

# Add to end: O(1) amortized
arr.append(4)     # [1, 2, 3, 4]

# Remove from end: O(1)
last = arr.pop()  # returns 4, arr is now [1, 2, 3]

# Insert at index: O(N)
arr.insert(0, 99) # [99, 1, 2, 3]

# Remove first occurrence of value: O(N)
arr.remove(99)    # [1, 2, 3]`,
        notes: 'append() and pop() at the end run in O(1) time. Inserting or popping from index 0 is O(N).',
      },
      java: {
        code: `import java.util.ArrayList;

ArrayList<Integer> list = new ArrayList<>();

// Add to end: O(1) amortized
list.add(10);
list.add(20);

// Remove last element: O(1)
int last = list.remove(list.size() - 1);

// Insert at index: O(N)
list.add(0, 99);

// Remove by index vs by object
list.remove(0); // removes by index 0`,
        notes: 'To remove by Integer value rather than index in ArrayList, use list.remove(Integer.valueOf(val)).',
      },
      cpp: {
        code: `#include <vector>
using namespace std;

vector<int> arr;

// Add to end: O(1) amortized
arr.push_back(10);
arr.push_back(20);

// Access and remove last element: O(1)
int last = arr.back();
arr.pop_back(); // Note: pop_back() in C++ returns void

// Insert at beginning: O(N)
arr.insert(arr.begin(), 99);`,
        notes: 'pop_back() in C++ does not return the removed element. Read arr.back() first if you need the value.',
      },
      javascript: {
        code: `const arr = [1, 2, 3];

// Add to end: O(1) amortized
arr.push(4);       // [1, 2, 3, 4]

// Remove from end: O(1)
const last = arr.pop(); // returns 4, arr is [1, 2, 3]

// Add to beginning: O(N)
arr.unshift(99);   // [99, 1, 2, 3]

// Remove from beginning: O(N)
const first = arr.shift(); // returns 99`,
        notes: 'push() and pop() operate in O(1) at the end. shift() and unshift() operate in O(N) at the start.',
      },
    },
  },
  {
    id: 'array-reverse',
    categoryId: 'arrays',
    title: 'Reversing Arrays',
    summary: 'In-place reversal and non-destructive reversed copies.',
    explanation: 'Flipping the order of elements from front to back.',
    keywords: ['reverse', 'reversed', 'invert', 'flip'],
    languages: {
      python: {
        code: `arr = [1, 2, 3, 4, 5]

# In-place reversal (modifies arr)
arr.reverse()
print(arr)  # [5, 4, 3, 2, 1]

# Non-destructive reversed copy via slicing
orig = [1, 2, 3, 4, 5]
rev_copy = orig[::-1]  # [5, 4, 3, 2, 1], orig is unchanged`,
        notes: 'orig[::-1] creates a reversed shallow copy quickly via slice syntax.',
      },
      java: {
        code: `import java.util.Collections;
import java.util.ArrayList;

// In-place reversal for ArrayList
ArrayList<Integer> list = new ArrayList<>();
// populate list...
Collections.reverse(list);

// In-place two-pointer reversal for primitive array
int[] arr = {1, 2, 3, 4, 5};
for (int i = 0, j = arr.length - 1; i < j; i++, j--) {
    int temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
}`,
        notes: 'Collections.reverse() works on Java Lists. Primitive arrays use a two-pointer swap loop.',
      },
      cpp: {
        code: `#include <vector>
#include <algorithm>
using namespace std;

vector<int> arr = {1, 2, 3, 4, 5};

// In-place reversal using std::reverse from <algorithm>
reverse(arr.begin(), arr.end());
// arr is now {5, 4, 3, 2, 1}

// Reverse a sub-range (e.g. from index 1 to 3)
reverse(arr.begin() + 1, arr.begin() + 4);`,
        notes: 'reverse(begin, end) runs in O(N) linear time and is included in <algorithm>.',
      },
      javascript: {
        code: `const arr = [1, 2, 3, 4, 5];

// In-place reversal (mutates original arr)
arr.reverse();
console.log(arr); // [5, 4, 3, 2, 1]

// Non-destructive reversed copy (modern JS toReversed)
const orig = [1, 2, 3, 4, 5];
const rev = orig.toReversed(); // [5, 4, 3, 2, 1], orig unchanged
// Or via spread:
const rev2 = [...orig].reverse();`,
        notes: 'Use [...orig].reverse() or orig.toReversed() to avoid mutating the original array.',
      },
    },
  },
  {
    id: 'array-copy',
    categoryId: 'arrays',
    title: 'Copying Arrays',
    summary: 'Shallow and deep copies to prevent unintentional mutations.',
    explanation: 'Duplicating an array so modifications to the copy do not alter the original.',
    keywords: ['copy', 'clone', 'shallow copy', 'deep copy', 'slice', 'spread'],
    languages: {
      python: {
        code: `orig = [1, 2, 3]

# Shallow copy (safe for 1D arrays of numbers)
copy1 = orig.copy()
copy2 = orig[:]
copy3 = list(orig)

# For nested 2D arrays, use copy.deepcopy
import copy
nested = [[1, 2], [3, 4]]
deep = copy.deepcopy(nested)`,
        notes: 'Assigning copy = orig only copies the reference, meaning mutations will affect both.',
      },
      java: {
        code: `import java.util.Arrays;
import java.util.ArrayList;

int[] orig = {1, 2, 3};

// Copy using clone()
int[] copy1 = orig.clone();

// Copy using Arrays.copyOf()
int[] copy2 = Arrays.copyOf(orig, orig.length);

// Copy an ArrayList
ArrayList<Integer> list = new ArrayList<>();
ArrayList<Integer> listCopy = new ArrayList<>(list);`,
        notes: 'Arrays.copyOf(arr, newLength) can also truncate or expand the copy with zeros.',
      },
      cpp: {
        code: `#include <vector>
using namespace std;

vector<int> orig = {1, 2, 3};

// Assignment operator makes a deep copy of vector contents
vector<int> copy1 = orig;

// Copy constructor
vector<int> copy2(orig);`,
        notes: 'In C++, vector assignment auto-allocates new storage and deep copies the elements.',
      },
      javascript: {
        code: `const orig = [1, 2, 3];

// Shallow copy using spread operator
const copy1 = [...orig];

// Shallow copy using slice
const copy2 = orig.slice();

// Deep copy for nested structures (modern JS)
const nested = [[1, 2], [3, 4]];
const deep = structuredClone(nested);`,
        notes: 'Spread [...orig] is the cleanest syntax for copying 1D arrays. Use structuredClone() for nested data.',
      },
    },
  },
  {
    id: 'array-slicing',
    categoryId: 'arrays',
    title: 'Slicing Subarrays',
    summary: 'Extracting contiguous ranges of elements.',
    explanation: 'Obtaining a sub-range from start index up to end index.',
    keywords: ['slice', 'sublist', 'subarray', 'range extraction'],
    languages: {
      python: {
        code: `arr = [10, 20, 30, 40, 50]

# Slice syntax: arr[start:stop:step] (stop is EXCLUSIVE)
sub = arr[1:4]      # [20, 30, 40]
first_three = arr[:3] # [10, 20, 30]
from_index_2 = arr[2:] # [30, 40, 50]
every_other = arr[::2] # [10, 30, 50]`,
        notes: 'Python slicing does not throw out-of-bounds errors; it clamps indices automatically.',
      },
      java: {
        code: `import java.util.Arrays;
import java.util.List;
import java.util.ArrayList;

int[] arr = {10, 20, 30, 40, 50};

// Slicing primitive array using Arrays.copyOfRange(from, to) (to is exclusive)
int[] sub = Arrays.copyOfRange(arr, 1, 4); // {20, 30, 40}

// List subList view
ArrayList<Integer> list = new ArrayList<>();
// List<Integer> subView = list.subList(1, 4);`,
        notes: 'Arrays.copyOfRange(arr, start, end) creates a new array containing indices from start to end - 1.',
      },
      cpp: {
        code: `#include <vector>
using namespace std;

vector<int> arr = {10, 20, 30, 40, 50};

// Sub-vector using iterator constructor (end is exclusive)
vector<int> sub(arr.begin() + 1, arr.begin() + 4);
// sub contains {20, 30, 40}`,
        notes: 'Constructing vector(begin + start, begin + end) creates an independent sub-vector.',
      },
      javascript: {
        code: `const arr = [10, 20, 30, 40, 50];

// slice(start, end) where end is exclusive
const sub = arr.slice(1, 4); // [20, 30, 40]

// From index 2 to end
const fromTwo = arr.slice(2); // [30, 40, 50]

// Negative indices count from end
const lastTwo = arr.slice(-2); // [40, 50]`,
        notes: 'arr.slice() does not mutate the original array. (Unlike arr.splice() which mutates!).',
      },
    },
  },
  {
    id: 'array-min-max-sum',
    categoryId: 'arrays',
    title: 'Finding Min, Max, and Sum',
    summary: 'Aggregating values across a collection.',
    explanation: 'Calculating the smallest element, largest element, and total sum of an array.',
    keywords: ['min', 'max', 'sum', 'accumulate', 'reduce', 'aggregate'],
    languages: {
      python: {
        code: `arr = [15, 3, 42, 8, 27]

min_val = min(arr)  # 3
max_val = max(arr)  # 42
total = sum(arr)    # 95

# Safe with empty lists:
# min(arr, default=0)`,
        notes: 'Built-in min(), max(), and sum() operate in linear O(N) time in Python.',
      },
      java: {
        code: `import java.util.Arrays;

int[] arr = {15, 3, 42, 8, 27};

// Finding min/max/sum using loops (fastest in competitive programming)
int minVal = arr[0];
int maxVal = arr[0];
long total = 0;

for (int x : arr) {
    if (x < minVal) minVal = x;
    if (x > maxVal) maxVal = x;
    total += x; // Use long for sum to prevent 32-bit overflow
}

// Or via Streams:
// int min = Arrays.stream(arr).min().getAsInt();`,
        notes: 'Always accumulate sums into a long when summing arrays of integers to avoid overflow.',
      },
      cpp: {
        code: `#include <vector>
#include <algorithm>
#include <numeric>
using namespace std;

vector<int> arr = {15, 3, 42, 8, 27};

// *min_element and *max_element return iterators, dereference with *
int min_val = *min_element(arr.begin(), arr.end()); // 3
int max_val = *max_element(arr.begin(), arr.end()); // 42

// std::accumulate from <numeric>
// CRITICAL: Use 0LL as third argument for 64-bit sum!
long long total = accumulate(arr.begin(), arr.end(), 0LL); // 95`,
        notes: 'In C++ accumulate, pass 0LL as the accumulator type to avoid 32-bit integer overflow.',
      },
      javascript: {
        code: `const arr = [15, 3, 42, 8, 27];

// Math.min/max with spread (suitable for arrays up to ~10^5 items)
const minVal = Math.min(...arr); // 3
const maxVal = Math.max(...arr); // 42

// Sum using reduce
const total = arr.reduce((acc, x) => acc + x, 0); // 95`,
        notes: 'For extremely large arrays (> 100,000 items), use a traditional for loop instead of spread to prevent call stack overflow.',
      },
    },
  },
]
