import type { SyntaxTopic } from '../types'

export const sortingTopics: SyntaxTopic[] = [
  {
    id: 'sort-ascending',
    categoryId: 'sorting',
    title: 'Sort Ascending (In-Place)',
    summary: 'Sorting numbers or strings in increasing order in-place.',
    explanation: 'Sorts elements from lowest to highest. Note that JavaScript requires an explicit numeric comparator (a, b) => a - b because its default sort converts elements to strings.',
    keywords: ['sort', 'ascending', 'sort array', 'order', 'in-place sort', 'comparator'],
    quickReference: true,
    languages: {
      python: {
        code: `arr = [42, 10, 5, 88, 23]

# In-place ascending sort: O(N log N) Timsort
arr.sort()
print(arr)  # [5, 10, 23, 42, 88]`,
        notes: 'Python uses Timsort, which is stable and runs in O(N log N) time.',
      },
      java: {
        code: `import java.util.Arrays;
import java.util.Collections;
import java.util.ArrayList;

// Primitive array sort
int[] arr = {42, 10, 5, 88, 23};
Arrays.sort(arr); // [5, 10, 23, 42, 88]

// Object or List sort
ArrayList<Integer> list = new ArrayList<>();
Collections.sort(list);`,
        notes: 'Arrays.sort() uses Dual-Pivot Quicksort for primitives, and TimSort for objects.',
      },
      cpp: {
        code: `#include <vector>
#include <algorithm>
using namespace std;

vector<int> arr = {42, 10, 5, 88, 23};

// In-place sort from <algorithm>
sort(arr.begin(), arr.end());
// arr is now {5, 10, 23, 42, 88}`,
        notes: 'std::sort uses introsort (quicksort + heapsort + insertion sort) guaranteeing O(N log N) worst-case time.',
      },
      javascript: {
        code: `const arr = [42, 10, 5, 88, 23];

// CRITICAL: Default arr.sort() compares STRINGS lexicographically!
// E.g. [42, 10, 5].sort() yields [10, 42, 5] because "5" > "42"!
// Always supply numeric comparator (a, b) => a - b:
arr.sort((a, b) => a - b);
console.log(arr); // [5, 10, 23, 42, 88]`,
        notes: 'ALWAYS provide (a, b) => a - b for numbers in JavaScript; otherwise, values sort as strings!',
      },
    },
  },
  {
    id: 'sort-descending',
    categoryId: 'sorting',
    title: 'Sort Descending (In-Place)',
    summary: 'Sorting elements in decreasing order from highest to lowest.',
    explanation: 'Arranging elements in non-increasing order using reverse flags, comparators, or reverse iterators.',
    keywords: ['sort descending', 'reverse sort', 'decreasing order', 'greater'],
    languages: {
      python: {
        code: `arr = [42, 10, 5, 88, 23]

# Pass reverse=True keyword argument
arr.sort(reverse=True)
print(arr)  # [88, 42, 23, 10, 5]`,
        notes: 'reverse=True reverses the sort order directly in Python.',
      },
      java: {
        code: `import java.util.Arrays;
import java.util.Collections;

// Note: Collections.reverseOrder() requires boxed Integer[] or List
Integer[] arr = {42, 10, 5, 88, 23};
Arrays.sort(arr, Collections.reverseOrder());
// [88, 42, 23, 10, 5]

// For primitive int[], sort ascending then reverse:
int[] prim = {42, 10, 5, 88, 23};
Arrays.sort(prim);
for (int i = 0, j = prim.length - 1; i < j; i++, j--) {
    int t = prim[i]; prim[i] = prim[j]; prim[j] = t;
}`,
        notes: 'Collections.reverseOrder() cannot be passed directly to primitive int[] in Java.',
      },
      cpp: {
        code: `#include <vector>
#include <algorithm>
using namespace std;

vector<int> arr = {42, 10, 5, 88, 23};

// Method 1: greater<int>() comparator
sort(arr.begin(), arr.end(), greater<int>());

// Method 2: reverse iterators
sort(arr.rbegin(), arr.rend());
// arr is now {88, 42, 23, 10, 5}`,
        notes: 'sort(arr.rbegin(), arr.rend()) is standard and idiomatic in C++ competitive programming.',
      },
      javascript: {
        code: `const arr = [42, 10, 5, 88, 23];

// Supply descending comparator: (a, b) => b - a
arr.sort((a, b) => b - a);
console.log(arr); // [88, 42, 23, 10, 5]`,
        notes: '(a, b) => b - a sorts numbers in descending order.',
      },
    },
  },
  {
    id: 'sort-copies',
    categoryId: 'sorting',
    title: 'Sorting Copies (Without Mutating Original)',
    summary: 'Obtaining a sorted version of an array while keeping the original intact.',
    explanation: 'Non-destructive sorting so earlier index orders or chronological logs remain preserved.',
    keywords: ['sorted', 'copy', 'non-destructive', 'toSorted', 'preserve original'],
    languages: {
      python: {
        code: `orig = [42, 10, 5, 88, 23]

# sorted() returns a new sorted list, leaving orig unchanged
sorted_arr = sorted(orig)
desc_arr = sorted(orig, reverse=True)

print("Original:", orig)       # [42, 10, 5, 88, 23]
print("Sorted:", sorted_arr)   # [5, 10, 23, 42, 88]`,
        notes: 'sorted() works on any iterable (strings, tuples, sets) and always returns a new list.',
      },
      java: {
        code: `import java.util.Arrays;

int[] orig = {42, 10, 5, 88, 23};

// Clone first, then sort the copy
int[] copy = orig.clone();
Arrays.sort(copy);

// Or using Java Streams:
int[] streamSorted = Arrays.stream(orig).sorted().toArray();`,
        notes: 'orig.clone() followed by Arrays.sort(copy) is the fastest approach in Java.',
      },
      cpp: {
        code: `#include <vector>
#include <algorithm>
using namespace std;

vector<int> orig = {42, 10, 5, 88, 23};

// Make a copy, then sort
vector<int> sorted_arr = orig;
sort(sorted_arr.begin(), sorted_arr.end());`,
        notes: 'Copying the vector and calling sort() preserves the original vector.',
      },
      javascript: {
        code: `const orig = [42, 10, 5, 88, 23];

// Modern JS: toSorted() returns a new sorted array without mutation
const sortedArr = orig.toSorted((a, b) => a - b);

// Spread fallback for older engines:
const spreadSorted = [...orig].sort((a, b) => a - b);

console.log("Original:", orig);       // [42, 10, 5, 88, 23]
console.log("Sorted:", sortedArr);   // [5, 10, 23, 42, 88]`,
        notes: 'toSorted() is ECMAScript 2023. Spread [...orig].sort() is universally supported.',
      },
    },
  },
  {
    id: 'sort-strings',
    categoryId: 'sorting',
    title: 'Sorting Strings & Collections of Strings',
    summary: 'Sorting characters within a string or sorting an array of strings.',
    explanation: 'Ordering individual characters or sorting words alphabetically and by length.',
    keywords: ['sort string', 'alphabetical', 'lexicographical', 'anagram', 'words'],
    languages: {
      python: {
        code: `# 1. Sort characters inside a string (e.g. for anagram detection)
s = "dcba"
sorted_s = "".join(sorted(s)) # "abcd"

# 2. Sort list of strings alphabetically
words = ["banana", "apple", "cherry"]
words.sort()  # ['apple', 'banana', 'cherry']

# 3. Sort by length, then alphabetically
words.sort(key=lambda w: (len(w), w))`,
        notes: '"".join(sorted(s)) is the standard way to sort a string in Python.',
      },
      java: {
        code: `import java.util.Arrays;

// 1. Sort characters inside a string
String s = "dcba";
char[] chars = s.toCharArray();
Arrays.sort(chars);
String sortedS = new String(chars); // "abcd"

// 2. Sort array of strings alphabetically
String[] words = {"banana", "apple", "cherry"};
Arrays.sort(words); // ["apple", "banana", "cherry"]

// 3. Sort by length
Arrays.sort(words, (a, b) -> Integer.compare(a.length(), b.length()));`,
        notes: 'Convert string to char[] via toCharArray(), sort with Arrays.sort, and re-wrap with new String(chars).',
      },
      cpp: {
        code: `#include <string>
#include <vector>
#include <algorithm>
using namespace std;

// 1. Sort characters inside a string directly
string s = "dcba";
sort(s.begin(), s.end()); // s is now "abcd"

// 2. Sort vector of strings lexicographically
vector<string> words = {"banana", "apple", "cherry"};
sort(words.begin(), words.end()); // {"apple", "banana", "cherry"}

// 3. Sort by string length
sort(words.begin(), words.end(), [](const string& a, const string& b) {
    return a.length() < b.length();
});`,
        notes: 'In C++, std::string is a mutable container, so sort(s.begin(), s.end()) works directly in-place.',
      },
      javascript: {
        code: `// 1. Sort characters inside a string
const s = "dcba";
const sortedS = s.split("").sort().join(""); // "abcd"

// 2. Sort array of strings alphabetically
const words = ["banana", "apple", "cherry"];
words.sort((a, b) => a.localeCompare(b)); // ["apple", "banana", "cherry"]

// 3. Sort by length
words.sort((a, b) => a.length - b.length);`,
        notes: 'Use a.localeCompare(b) for robust string sorting in JavaScript.',
      },
    },
  },
  {
    id: 'sort-pairs-objects',
    categoryId: 'sorting',
    title: 'Sorting Pairs, Tuples & Custom Objects',
    summary: 'Multi-key sorting by primary, secondary, and tie-breaking attributes.',
    explanation: 'Sorting compound data (such as coordinates, score/time pairs, or driver records) by multiple keys.',
    keywords: ['pair', 'tuple', 'object sort', 'tie break', 'multi-key sort'],
    languages: {
      python: {
        code: `# List of tuples: (score, time_taken)
# Problem: Sort by score DESCENDING, then time_taken ASCENDING
data = [(100, 45), (200, 60), (100, 30), (200, 50)]

# Python tuple sorting naturally compares element-by-element
# Inverting sign on numeric key sorts that key in reverse
data.sort(key=lambda item: (-item[0], item[1]))

# Result: (200, 50), (200, 60), (100, 30), (100, 45)
print(data)`,
        notes: 'Using key=lambda x: (-x[0], x[1]) is an elegant competitive idiom for descending then ascending sorting.',
      },
      java: {
        code: `import java.util.Arrays;
import java.util.Comparator;

class Item {
    int score;
    int time;
    Item(int s, int t) { this.score = s; this.time = t; }
}

Item[] items = { new Item(100, 45), new Item(200, 60), new Item(100, 30) };

// Sort by score descending, then time ascending
Arrays.sort(items, (a, b) -> {
    if (a.score != b.score) {
        return Integer.compare(b.score, a.score); // descending
    }
    return Integer.compare(a.time, b.time);       // ascending
});`,
        notes: 'Always use Integer.compare(x, y) rather than x - y to prevent integer overflow with extreme values.',
      },
      cpp: {
        code: `#include <vector>
#include <algorithm>
using namespace std;

// pair<int, int> in C++ is sorted by first, then second automatically!
vector<pair<int, int>> pairs = {{100, 45}, {200, 60}, {100, 30}};

// Custom: score descending, time ascending
sort(pairs.begin(), pairs.end(), [](const pair<int, int>& a, const pair<int, int>& b) {
    if (a.first != b.first) {
        return a.first > b.first; // descending score
    }
    return a.second < b.second;   // ascending time
});`,
        notes: 'In C++ comparators, return true strictly when a should come before b (strict weak ordering).',
      },
      javascript: {
        code: `const items = [
    { score: 100, time: 45 },
    { score: 200, time: 60 },
    { score: 100, time: 30 }
];

// Sort by score descending, then time ascending
items.sort((a, b) => {
    if (a.score !== b.score) {
        return b.score - a.score; // descending
    }
    return a.time - b.time;       // ascending
});`,
        notes: 'Return negative when a precedes b, positive when b precedes a, and 0 for equal.',
      },
    },
  },
  {
    id: 'sort-custom-comparator',
    categoryId: 'sorting',
    title: 'Custom Sorting Comparators',
    summary: 'Defining custom comparison functions and stability rules.',
    explanation: 'Implementing arbitrary orderings (e.g. even numbers before odd numbers, custom frequency weights).',
    keywords: ['comparator', 'custom sort', 'strict weak ordering', 'stable sort'],
    languages: {
      python: {
        code: `from functools import cmp_to_key

# Custom comparator function (returns -1, 0, or 1)
# Example: Evens before odds, then smaller numbers first
def custom_cmp(a, b):
    a_even = (a % 2 == 0)
    b_even = (b % 2 == 0)
    if a_even != b_even:
        return -1 if a_even else 1
    return -1 if a < b else (1 if a > b else 0)

arr = [5, 2, 8, 1, 9, 4]
arr.sort(key=cmp_to_key(custom_cmp))
print(arr)  # [2, 4, 8, 1, 5, 9]`,
        notes: 'Use functools.cmp_to_key when converting legacy 2-argument comparison functions.',
      },
      java: {
        code: `import java.util.Arrays;
import java.util.Comparator;

Integer[] arr = {5, 2, 8, 1, 9, 4};

// Evens before odds, then ascending
Arrays.sort(arr, (a, b) -> {
    boolean aEven = (a % 2 == 0);
    boolean bEven = (b % 2 == 0);
    if (aEven != bEven) {
        return aEven ? -1 : 1;
    }
    return Integer.compare(a, b);
});`,
        notes: 'Java requires that comparators obey reflexivity, transitivity, and symmetry.',
      },
      cpp: {
        code: `#include <vector>
#include <algorithm>
using namespace std;

vector<int> arr = {5, 2, 8, 1, 9, 4};

// Lambda comparator: must implement strict weak ordering (return false if a == b)
sort(arr.begin(), arr.end(), [](int a, int b) {
    bool a_even = (a % 2 == 0);
    bool b_even = (b % 2 == 0);
    if (a_even != b_even) {
        return a_even; // evens come first
    }
    return a < b; // smaller first
});`,
        notes: 'CRITICAL: Comparator must return false for identical elements. Returning true for equal elements can cause segfaults in std::sort.',
      },
      javascript: {
        code: `const arr = [5, 2, 8, 1, 9, 4];

// Evens before odds, then ascending
arr.sort((a, b) => {
    const aEven = (a % 2 === 0);
    const bEven = (b % 2 === 0);
    if (aEven !== bEven) {
        return aEven ? -1 : 1;
    }
    return a - b;
});
console.log(arr); // [2, 4, 8, 1, 5, 9]`,
        notes: 'JavaScript sort is guaranteed stable since ECMAScript 2019.',
      },
    },
  },
]
