import type { SyntaxTopic } from '../types'

export const matricesTopics: SyntaxTopic[] = [
  {
    id: 'matrix-creation',
    categoryId: 'matrices',
    title: 'Creating & Initializing a 2D Grid / Matrix',
    summary: 'Allocating an R x C grid filled with zeros or default values.',
    explanation: 'Creating a two-dimensional grid with dimensions R rows by C columns. In Python, avoid the shallow-copy pitfall [[0]*C]*R.',
    keywords: ['matrix', '2d array', 'grid', 'rows', 'cols', 'dimensions'],
    languages: {
      python: {
        code: `rows = 3
cols = 4

# CORRECT: List comprehension creates independent inner row lists
grid = [[0] * cols for _ in range(rows)]

# CRITICAL PITFALL: NEVER do [[0] * cols] * rows !
# That creates R references to the SAME inner list, so updating
# grid[0][0] = 1 would change all rows simultaneously!`,
        notes: 'Always use [[0] * cols for _ in range(rows)] to ensure each row is an independent list.',
      },
      java: {
        code: `int rows = 3;
int cols = 4;

// 2D primitive array (auto-initialized with 0)
int[][] grid = new int[rows][cols];

// Initialized with literal values
int[][] predefined = {
    {1, 2, 3},
    {4, 5, 6}
};`,
        notes: 'In Java, 2D arrays are arrays of arrays. Primitive int[][] elements start at 0.',
      },
      cpp: {
        code: `#include <vector>
using namespace std;

int rows = 3;
int cols = 4;

// Dynamic 2D vector initialized with size rows x cols and value 0
vector<vector<int>> grid(rows, vector<int>(cols, 0));

// Fixed-size stack matrix
int fixed_grid[3][4] = {{0}};`,
        notes: 'vector<vector<int>> grid(R, vector<int>(C, 0)) is safe, dynamically sized, and standard for contests.',
      },
      javascript: {
        code: `const rows = 3;
const cols = 4;

// CORRECT: Array.from with mapping callback creates independent inner arrays
const grid = Array.from({ length: rows }, () => new Array(cols).fill(0));

// Initialized with literal values
const predefined = [
    [1, 2, 3],
    [4, 5, 6]
];`,
        notes: 'Do not use new Array(rows).fill(new Array(cols).fill(0)) as it references the same row array.',
      },
    },
  },
  {
    id: 'matrix-access-update',
    categoryId: 'matrices',
    title: 'Accessing & Updating Matrix Cells',
    summary: 'Reading and writing grid[r][c] coordinates with boundary checks.',
    explanation: 'Indexing into a 2D matrix at row r and column c, and safely checking grid boundaries.',
    keywords: ['grid cell', 'coordinates', 'bounds check', 'r c', 'in bounds'],
    languages: {
      python: {
        code: `rows, cols = 3, 4
grid = [[0] * cols for _ in range(rows)]

# Update cell at row 1, col 2
grid[1][2] = 42

# Read cell
val = grid[1][2] # 42

# Boundary check helper for grid traversal (DFS/BFS)
def is_valid(r: int, c: int) -> bool:
    return 0 <= r < rows and 0 <= c < cols`,
        notes: 'Chained comparison 0 <= r < rows makes grid boundary checks clean in Python.',
      },
      java: {
        code: `int rows = 3, cols = 4;
int[][] grid = new int[rows][cols];

// Update cell at row 1, col 2
grid[1][2] = 42;

// Read cell
int val = grid[1][2]; // 42

// Bounds check helper
boolean isValid = (r >= 0 && r < rows && c >= 0 && c < cols);`,
        notes: 'Always verify r and c bounds before indexing into grid[r][c].',
      },
      cpp: {
        code: `#include <vector>
using namespace std;

int rows = 3, cols = 4;
vector<vector<int>> grid(rows, vector<int>(cols, 0));

// Update cell
grid[1][2] = 42;

// Read cell
int val = grid[1][2]; // 42

// Bounds check helper
bool is_valid(int r, int c, int R, int C) {
    return r >= 0 && r < R && c >= 0 && c < C;
}`,
        notes: 'Direct indexing grid[r][c] is O(1) in C++.',
      },
      javascript: {
        code: `const rows = 3, cols = 4;
const grid = Array.from({ length: rows }, () => new Array(cols).fill(0));

// Update cell
grid[1][2] = 42;

// Read cell
const val = grid[1][2]; // 42

// Bounds check helper
const isValid = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols;`,
        notes: 'Double bracket notation grid[r][c] accesses the cell in JS.',
      },
    },
  },
  {
    id: 'matrix-iteration',
    categoryId: 'matrices',
    title: 'Row and Column Iteration',
    summary: 'Traversing across rows or across columns.',
    explanation: 'Visiting elements in row-major order (row by row) or column-major order (column by column).',
    keywords: ['row major', 'column major', 'traverse matrix', '2d loop'],
    languages: {
      python: {
        code: `rows = 3
cols = 4
grid = [[r * cols + c for c in range(cols)] for r in range(rows)]

# 1. Row-major iteration (visit all cells row by row)
for r in range(rows):
    for c in range(cols):
        cell = grid[r][c]

# 2. Column-major iteration (visit all cells column by column)
for c in range(cols):
    for r in range(rows):
        cell = grid[r][c]`,
        notes: 'Row-major order is generally faster due to CPU cache locality.',
      },
      java: {
        code: `int rows = 3, cols = 4;
int[][] grid = new int[rows][cols];

// Row-major iteration
for (int r = 0; r < rows; r++) {
    for (int c = 0; c < cols; c++) {
        int cell = grid[r][c];
    }
}

// Column-major iteration
for (int c = 0; c < cols; c++) {
    for (int r = 0; r < rows; r++) {
        int cell = grid[r][c];
    }
}`,
        notes: 'Row-major traversal minimizes cache misses.',
      },
      cpp: {
        code: `#include <vector>
using namespace std;

int rows = 3, cols = 4;
vector<vector<int>> grid(rows, vector<int>(cols, 0));

// Row-major iteration (optimal cache performance)
for (int r = 0; r < rows; r++) {
    for (int c = 0; c < cols; c++) {
        int cell = grid[r][c];
    }
}

// Column-major iteration
for (int c = 0; c < cols; c++) {
    for (int r = 0; r < rows; r++) {
        int cell = grid[r][c];
    }
}`,
        notes: 'C++ memory layout is contiguous by row. Always prefer iterating outer row, inner column.',
      },
      javascript: {
        code: `const rows = 3, cols = 4;
const grid = Array.from({ length: rows }, () => new Array(cols).fill(0));

// Row-major traversal
for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
    }
}`,
        notes: 'Iterate r then c for standard row-by-row matrix processing.',
      },
    },
  },
  {
    id: 'matrix-dimensions',
    categoryId: 'matrices',
    title: 'Finding Row and Column Counts',
    summary: 'Reading total rows and total columns from a 2D matrix.',
    explanation: 'Safely determining row and column sizes, handling empty matrices.',
    keywords: ['matrix dimensions', 'row count', 'column count', 'matrix size'],
    languages: {
      python: {
        code: `grid = [[1, 2, 3], [4, 5, 6]]

# Finding dimensions
row_count = len(grid)
col_count = len(grid[0]) if row_count > 0 else 0

print(f"{row_count} rows x {col_count} columns") # 2 rows x 3 columns`,
        notes: 'Always check if len(grid) > 0 before accessing grid[0] to prevent IndexError on empty grids.',
      },
      java: {
        code: `int[][] grid = {{1, 2, 3}, {4, 5, 6}};

int rowCount = grid.length;
int colCount = (rowCount > 0) ? grid[0].length : 0;

System.out.printf("%d rows x %d columns%n", rowCount, colCount);`,
        notes: 'grid.length gives the number of rows; grid[0].length gives the number of columns in row 0.',
      },
      cpp: {
        code: `#include <vector>
#include <iostream>
using namespace std;

vector<vector<int>> grid = {{1, 2, 3}, {4, 5, 6}};

int row_count = (int)grid.size();
int col_count = (row_count > 0) ? (int)grid[0].size() : 0;

cout << row_count << " rows x " << col_count << " columns\\n";`,
        notes: 'Check !grid.empty() before inspecting grid[0].size().',
      },
      javascript: {
        code: `const grid = [[1, 2, 3], [4, 5, 6]];

const rowCount = grid.length;
const colCount = rowCount > 0 ? grid[0].length : 0;

console.log(\`\${rowCount} rows x \${colCount} columns\`);`,
        notes: 'Check grid.length before reading grid[0].length.',
      },
    },
  },
]
