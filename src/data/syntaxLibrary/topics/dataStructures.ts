import type { SyntaxTopic } from '../types'

export const dataStructuresTopics: SyntaxTopic[] = [
  {
    id: 'ds-stack',
    categoryId: 'data-structures',
    title: 'Stack (LIFO)',
    summary: 'Last-In First-Out structure for parenthesis matching and monotonic stacks.',
    explanation: 'Standard stack operations: push, pop, top/peek, check size, and emptiness.',
    keywords: ['stack', 'lifo', 'push', 'pop', 'peek', 'top'],
    quickReference: true,
    languages: {
      python: {
        code: `# In Python, standard list is an efficient stack (LIFO)
stack = []

# 1. Insert / Push: O(1)
stack.append(10)
stack.append(20)

# 2. Access top: O(1)
top_val = stack[-1] # 20

# 3. Remove / Pop: O(1)
popped = stack.pop() # 20

# 4. Check size and emptiness
size = len(stack)    # 1
is_empty = not stack # False`,
        notes: 'Python list append() and pop() operate in O(1) amortized time at the tail.',
      },
      java: {
        code: `import java.util.ArrayDeque;
import java.util.Deque;

// ArrayDeque is faster and preferred over legacy java.util.Stack
Deque<Integer> stack = new ArrayDeque<>();

// 1. Insert / Push: O(1)
stack.push(10);
stack.push(20);

// 2. Access top: O(1)
int topVal = stack.peek(); // 20

// 3. Remove / Pop: O(1)
int popped = stack.pop();  // 20

// 4. Check size and emptiness
int size = stack.size();
boolean isEmpty = stack.isEmpty();`,
        notes: 'Always prefer ArrayDeque over java.util.Stack in Java because Stack has synchronized method overhead.',
      },
      cpp: {
        code: `#include <stack>
#include <iostream>
using namespace std;

// C++ STL stack from <stack>
stack<int> s;

// 1. Insert / Push: O(1)
s.push(10);
s.push(20);

// 2. Access top: O(1)
int top_val = s.top(); // 20

// 3. Remove / Pop: O(1)
// Note: pop() returns void; read s.top() before popping
s.pop();

// 4. Check size and emptiness
int size = (int)s.size();
bool is_empty = s.empty();`,
        notes: 'Remember s.pop() returns void in C++. Always read s.top() before popping.',
      },
      javascript: {
        code: `// JavaScript Array works directly as a stack
const stack = [];

// 1. Insert / Push: O(1)
stack.push(10);
stack.push(20);

// 2. Access top: O(1)
const topVal = stack.at(-1); // 20 (or stack[stack.length - 1])

// 3. Remove / Pop: O(1)
const popped = stack.pop();  // 20

// 4. Check size and emptiness
const size = stack.length;
const isEmpty = stack.length === 0;`,
        notes: 'push() and pop() on JS arrays operate on the end in O(1) time.',
      },
    },
  },
  {
    id: 'ds-queue',
    categoryId: 'data-structures',
    title: 'Queue (FIFO)',
    summary: 'First-In First-Out structure for BFS and processing pipelines.',
    explanation: 'Standard queue operations: push/enqueue, poll/dequeue, front/peek, check size.',
    keywords: ['queue', 'fifo', 'deque', 'popleft', 'bfs', 'enqueue', 'dequeue'],
    quickReference: true,
    languages: {
      python: {
        code: `from collections import deque

# CRITICAL: Use collections.deque for O(1) FIFO operations
# Standard list pop(0) is O(N) slow!
queue = deque()

# 1. Insert / Enqueue: O(1)
queue.append(10)
queue.append(20)

# 2. Access front: O(1)
front_val = queue[0]   # 10

# 3. Remove / Dequeue: O(1)
dequeued = queue.popleft() # 10

# 4. Check size and emptiness
size = len(queue)
is_empty = not queue`,
        notes: 'NEVER use list.pop(0) in Python for queues in competitive programming because it is O(N). Always use collections.deque.',
      },
      java: {
        code: `import java.util.ArrayDeque;
import java.util.Queue;

Queue<Integer> queue = new ArrayDeque<>();

// 1. Insert / Enqueue: O(1)
queue.offer(10);
queue.offer(20);

// 2. Access front: O(1)
int frontVal = queue.peek(); // 10

// 3. Remove / Dequeue: O(1)
int dequeued = queue.poll();  // 10

// 4. Check size and emptiness
int size = queue.size();
boolean isEmpty = queue.isEmpty();`,
        notes: 'Use offer(), peek(), and poll() which return null or false on empty queues instead of throwing exceptions.',
      },
      cpp: {
        code: `#include <queue>
using namespace std;

queue<int> q;

// 1. Insert / Enqueue: O(1)
q.push(10);
q.push(20);

// 2. Access front: O(1)
int front_val = q.front(); // 10

// 3. Remove / Dequeue: O(1)
// Note: pop() returns void; read q.front() before popping
q.pop();

// 4. Check size and emptiness
int size = (int)q.size();
bool is_empty = q.empty();`,
        notes: 'In C++, queue<int> is in <queue>. Inspect q.front() before calling q.pop().',
      },
      javascript: {
        code: `// For standard competitive problems with moderate queues:
const queue = [];
let head = 0; // Pointer avoiding expensive O(N) shift()

// 1. Enqueue: O(1)
queue.push(10);
queue.push(20);

// 2. Access front: O(1)
const frontVal = queue[head]; // 10

// 3. Dequeue: O(1) via pointer increment
const dequeued = queue[head++];

// 4. Check size
const size = queue.length - head;
const isEmpty = head >= queue.length;`,
        notes: 'Using a head index pointer instead of array.shift() guarantees O(1) dequeues without re-indexing the array.',
      },
    },
  },
  {
    id: 'ds-set',
    categoryId: 'data-structures',
    title: 'Set (Unique Elements)',
    summary: 'Collection of distinct elements with O(1) average lookup.',
    explanation: 'Deduplicating elements and performing fast membership lookups.',
    keywords: ['set', 'hashset', 'unordered_set', 'unique', 'membership'],
    languages: {
      python: {
        code: `# Initialize set
s = set()

# 1. Insert / Add: O(1)
s.add(42)
s.add(100)

# 2. Check membership: O(1)
has_42 = 42 in s        # True

# 3. Remove element: O(1)
s.remove(42)            # Raises KeyError if not present
s.discard(999)          # Safe removal: no error if absent

# 4. Check size and set from array
size = len(s)
unique_items = set([1, 2, 2, 3, 3]) # {1, 2, 3}`,
        notes: 'Use s.discard(x) to remove without throwing KeyError when x might not exist.',
      },
      java: {
        code: `import java.util.HashSet;
import java.util.Set;

Set<Integer> set = new HashSet<>();

// 1. Insert / Add: O(1)
set.add(42);
set.add(100);

// 2. Check membership: O(1)
boolean has42 = set.contains(42); // true

// 3. Remove element: O(1)
set.remove(42);

// 4. Check size and emptiness
int size = set.size();
boolean isEmpty = set.isEmpty();`,
        notes: 'HashSet provides O(1) average time complexity for add, remove, and contains.',
      },
      cpp: {
        code: `#include <unordered_set>
#include <set>
using namespace std;

// unordered_set is O(1) hash table; set is O(log N) red-black tree (ordered)
unordered_set<int> s;

// 1. Insert: O(1)
s.insert(42);
s.insert(100);

// 2. Check membership: O(1)
bool has_42 = s.count(42) > 0;
// Or: if (s.find(42) != s.end())

// 3. Remove element: O(1)
s.erase(42);

// 4. Check size
int size = (int)s.size();`,
        notes: 'unordered_set is O(1) average. Use std::set if elements must be maintained in sorted order (O(log N)).',
      },
      javascript: {
        code: `const set = new Set();

// 1. Insert / Add: O(1)
set.add(42);
set.add(100);

// 2. Check membership: O(1)
const has42 = set.has(42); // true

// 3. Remove element: O(1)
set.delete(42);

// 4. Check size (property .size, NOT .length)
const size = set.size;

// Deduplicate array
const uniqueArr = [...new Set([1, 2, 2, 3, 3])]; // [1, 2, 3]`,
        notes: 'Set size is accessed via the .size property. Spread [...new Set(arr)] is the idiomatic array deduplicator.',
      },
    },
  },
  {
    id: 'ds-map',
    categoryId: 'data-structures',
    title: 'Map / Dictionary / HashMap',
    summary: 'Key-value associative mapping with O(1) average lookups.',
    explanation: 'Storing key-value pairs, tracking item frequency counts, and caching memoized subproblem values.',
    keywords: ['map', 'hashmap', 'dict', 'dictionary', 'unordered_map', 'frequency map'],
    quickReference: true,
    languages: {
      python: {
        code: `# Initialize dictionary
d = {}

# 1. Insert or update key-value: O(1)
d["pole_position"] = "Verstappen"
d["laps"] = 57

# 2. Access with default fallback
laps = d.get("laps", 0)       # 57
pits = d.get("pit_stops", 0)  # 0 (fallback, does not raise KeyError)

# 3. Frequency count idiom:
freq = {}
for num in [1, 2, 2, 3, 3, 3]:
    freq[num] = freq.get(num, 0) + 1

# 4. Remove key
del d["pole_position"]

# 5. Check existence and size
has_key = "laps" in d
size = len(d)`,
        notes: 'd.get(key, default) avoids KeyError when reading keys that might not yet exist.',
      },
      java: {
        code: `import java.util.HashMap;
import java.util.Map;

Map<String, Integer> map = new HashMap<>();

// 1. Insert / Update: O(1)
map.put("laps", 57);

// 2. Access with default fallback
int laps = map.getOrDefault("laps", 0); // 57
int pits = map.getOrDefault("pitStops", 0); // 0

// 3. Frequency count idiom
for (int num : new int[]{1, 2, 2, 3, 3, 3}) {
    map.put(String.valueOf(num), map.getOrDefault(String.valueOf(num), 0) + 1);
}

// 4. Remove key: O(1)
map.remove("laps");

// 5. Check key and size
boolean hasKey = map.containsKey("laps");
int size = map.size();`,
        notes: 'getOrDefault(key, defaultValue) is the cleanest way to build frequency tables in Java.',
      },
      cpp: {
        code: `#include <unordered_map>
#include <string>
using namespace std;

unordered_map<string, int> m;

// 1. Insert or update: O(1)
m["laps"] = 57;

// 2. Frequency counting (auto-initializes missing int keys to 0)
m["car_1"]++; // increments from 0 to 1

// 3. Safe lookup without accidental key insertion
auto it = m.find("laps");
if (it != m.end()) {
    int val = it->second;
}

// 4. Remove key: O(1)
m.erase("laps");

// 5. Check key and size
bool has_key = m.count("laps") > 0;
int size = (int)m.size();`,
        notes: 'WARNING: In C++, m[key] automatically inserts the key with value 0 if missing. Use m.count(k) or m.find(k) to inspect existence.',
      },
      javascript: {
        code: `const map = new Map();

// 1. Insert / Update: O(1)
map.set("laps", 57);

// 2. Access key
const laps = map.get("laps") ?? 0; // 57

// 3. Frequency count idiom
const freq = new Map();
for (const x of [1, 2, 2, 3, 3, 3]) {
    freq.set(x, (freq.get(x) ?? 0) + 1);
}

// 4. Remove key: O(1)
map.delete("laps");

// 5. Check key and size
const hasKey = map.has("laps");
const size = map.size;`,
        notes: 'JavaScript Map supports any data type (including numbers, objects, arrays) as keys.',
      },
    },
  },
  {
    id: 'ds-pair',
    categoryId: 'data-structures',
    title: 'Pair & Tuple (Grouping Elements)',
    summary: 'Grouping 2 or more related values into a single compound element.',
    explanation: 'Useful for coordinates (x, y), graph edges (weight, neighbor), and interval endpoints.',
    keywords: ['pair', 'tuple', 'coordinates', 'tie', 'make_pair', 'record'],
    languages: {
      python: {
        code: `# Tuples are created with parentheses and are immutable
coord = (10, 20)

# Access by index
x = coord[0] # 10
y = coord[1] # 20

# Tuple unpacking
x_pos, y_pos = coord

# Tuples compare lexicographically by default
p1 = (1, 5)
p2 = (1, 10)
print(p1 < p2) # True (compares first, then second)`,
        notes: 'Tuples can be used as dictionary keys and set elements because they are hashable.',
      },
      java: {
        code: `// Modern Java: records provide immutable pair structures
record Pair(int first, int second) {}

Pair p = new Pair(10, 20);
int x = p.first();
int y = p.second();

// Custom comparable pair class for priority queues:
class Edge implements Comparable<Edge> {
    int to, weight;
    Edge(int to, int weight) { this.to = to; this.weight = weight; }
    @Override
    public int compareTo(Edge o) {
        return Integer.compare(this.weight, o.weight);
    }
}`,
        notes: 'In modern Java (Java 16+), record Pair(int first, int second) {} is concise and idiomatic.',
      },
      cpp: {
        code: `#include <utility>
#include <tuple>
using namespace std;

// pair<T1, T2> from <utility>
pair<int, int> p = {10, 20}; // or make_pair(10, 20)

// Access members
int x = p.first;  // 10
int y = p.second; // 20

// Structured binding (C++17)
auto [a, b] = p;

// Default comparison: compares first, then second
pair<int, int> p1 = {1, 5}, p2 = {1, 10};
bool less_than = (p1 < p2); // true`,
        notes: 'std::pair has built-in lexicographical comparison, making it instantly sortable and usable in priority_queue.',
      },
      javascript: {
        code: `// Array-based pair
const pair = [10, 20];

// Destructuring
const [x, y] = pair;

// Object-based pair
const point = { x: 10, y: 20 };
const { x: px, y: py } = point;`,
        notes: 'Array pairs [a, b] are simple, lightweight, and support destructuring.',
      },
    },
  },
  {
    id: 'ds-priority-queue-heap',
    categoryId: 'data-structures',
    title: 'Priority Queue / Heap',
    summary: 'Min-heap and Max-heap structures with O(log N) insert and extract-min.',
    explanation: 'Retrieving the minimum or maximum element dynamically in O(log N) time. Essential for Dijkstra, Prim, and Top-K algorithms.',
    keywords: ['priority queue', 'heap', 'heapq', 'min-heap', 'max-heap', 'heappop', 'heappush'],
    languages: {
      python: {
        code: `import heapq

# Python heapq implements a MIN-HEAP by default
heap = []

# 1. Insert / Push: O(log N)
heapq.heappush(heap, 42)
heapq.heappush(heap, 10)
heapq.heappush(heap, 88)

# 2. Access minimum: O(1)
min_val = heap[0] # 10

# 3. Remove minimum: O(log N)
smallest = heapq.heappop(heap) # 10

# 4. Turn existing list into heap in-place: O(N)
arr = [5, 1, 9, 3]
heapq.heapify(arr)

# MAX-HEAP idiom: invert numeric sign (-x)
max_heap = []
heapq.heappush(max_heap, -42)
max_val = -heapq.heappop(max_heap) # 42`,
        notes: 'Python heapq is always a min-heap. To build a max-heap, multiply values by -1.',
      },
      java: {
        code: `import java.util.PriorityQueue;
import java.util.Collections;

// MIN-HEAP by default
PriorityQueue<Integer> minHeap = new PriorityQueue<>();

// 1. Insert: O(log N)
minHeap.offer(42);
minHeap.offer(10);
minHeap.offer(88);

// 2. Access minimum: O(1)
int minVal = minHeap.peek(); // 10

// 3. Remove minimum: O(log N)
int smallest = minHeap.poll(); // 10

// MAX-HEAP: Pass Collections.reverseOrder()
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
maxHeap.offer(42);
maxHeap.offer(10);
int largest = maxHeap.poll(); // 42`,
        notes: 'Java PriorityQueue is min-heap by default; pass Collections.reverseOrder() for max-heap.',
      },
      cpp: {
        code: `#include <queue>
#include <vector>
using namespace std;

// CRITICAL DIFFERENCE: In C++, priority_queue is a MAX-HEAP by default!
priority_queue<int> max_heap;

// 1. Insert: O(log N)
max_heap.push(10);
max_heap.push(42);

// 2. Access top: O(1)
int max_val = max_heap.top(); // 42

// 3. Remove top: O(log N)
max_heap.pop(); // returns void

// MIN-HEAP in C++: specify vector container and greater<int> comparator:
priority_queue<int, vector<int>, greater<int>> min_heap;
min_heap.push(42);
min_heap.push(10);
int min_val = min_heap.top(); // 10`,
        notes: 'IMPORTANT C++ DIFFERENCE: priority_queue<int> is MAX-HEAP by default. Use greater<int> for MIN-HEAP.',
      },
      javascript: {
        code: `// Standard library note: JavaScript lacks a native PriorityQueue in Node / ES.
// In contests, for simple cases keep array sorted via binary insertion,
// or use this standard minimal 20-line binary min-heap:
class MinHeap {
    constructor() { this.data = []; }
    push(val) {
        this.data.push(val);
        let idx = this.data.length - 1;
        while (idx > 0) {
            let p = (idx - 1) >> 1;
            if (this.data[p] <= this.data[idx]) break;
            [this.data[p], this.data[idx]] = [this.data[idx], this.data[p]];
            idx = p;
        }
    }
    pop() {
        if (this.data.length <= 1) return this.data.pop();
        const top = this.data[0];
        this.data[0] = this.data.pop();
        let idx = 0, len = this.data.length;
        while ((idx << 1) + 1 < len) {
            let left = (idx << 1) + 1, right = left + 1, best = idx;
            if (this.data[left] < this.data[best]) best = left;
            if (right < len && this.data[right] < this.data[best]) best = right;
            if (best === idx) break;
            [this.data[idx], this.data[best]] = [this.data[best], this.data[idx]];
            idx = best;
        }
        return top;
    }
    peek() { return this.data[0]; }
    size() { return this.data.length; }
}`,
        notes: 'JavaScript has no standard priority queue class in the core specification; a compact binary heap class is standard for CP.',
      },
    },
  },
  {
    id: 'ds-dynamic-array',
    categoryId: 'data-structures',
    title: 'Dynamic Array (Resizable Vector / List)',
    summary: 'Continuous memory array with automatic resizing and O(1) amortized append.',
    explanation: 'Sequential container providing random access and amortized constant-time additions to the end.',
    keywords: ['vector', 'arraylist', 'dynamic array', 'resizable list', 'capacity'],
    languages: {
      python: {
        code: `# Python list is a dynamic array implemented in C
arr = []

for i in range(10):
    arr.append(i) # O(1) amortized

# Random access: O(1)
val = arr[5]

# Slice or clear
arr.clear()`,
        notes: 'Python list resizes with growth factor ~1.125 to amortize reallocation cost.',
      },
      java: {
        code: `import java.util.ArrayList;

// Initial capacity hint avoids reallocations
ArrayList<Integer> list = new ArrayList<>(1000);

for (int i = 0; i < 10; i++) {
    list.add(i);
}

int val = list.get(5);
list.set(5, 99); // update
list.clear();`,
        notes: 'Specify new ArrayList<>(expectedCapacity) when the final size is known to prevent internal array copies.',
      },
      cpp: {
        code: `#include <vector>
using namespace std;

vector<int> vec;
// Reserve capacity upfront to prevent reallocations
vec.reserve(1000);

for (int i = 0; i < 10; i++) {
    vec.push_back(i);
}

int val = vec[5];
vec.clear(); // clears elements, maintains allocated capacity`,
        notes: 'vec.reserve(N) pre-allocates memory without creating default elements, drastically improving push_back speed.',
      },
      javascript: {
        code: `const arr = [];

for (let i = 0; i < 10; i++) {
    arr.push(i);
}

const val = arr[5];
arr.length = 0; // Idiomatic way to clear array in JavaScript`,
        notes: 'Setting arr.length = 0 clears the array in-place.',
      },
    },
  },
]
