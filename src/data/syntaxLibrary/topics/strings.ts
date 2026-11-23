import type { SyntaxTopic } from '../types'

export const stringsTopics: SyntaxTopic[] = [
  {
    id: 'string-declaration-length',
    categoryId: 'strings',
    title: 'String Declaration & Length',
    summary: 'Creating strings and reading character length.',
    explanation: 'Basic declaration, string immutability, and length retrieval across all four languages.',
    keywords: ['string', 'length', 'size', 'len', 'declaration'],
    quickReference: true,
    languages: {
      python: {
        code: `s = "Code Grand Prix"

# Finding string length (O(1) in Python)
length = len(s)  # 15

# Empty string check
if not s:
    print("Empty")`,
        notes: 'Python strings are immutable. Any modification creates a new string.',
      },
      java: {
        code: `String s = "Code Grand Prix";

// Finding length (method call with parentheses)
int length = s.length(); // 15

// Empty check
boolean empty = s.isEmpty(); // or s.length() == 0`,
        notes: 'Notice that String uses s.length(), while primitive arrays use arr.length without parentheses.',
      },
      cpp: {
        code: `#include <string>
using namespace std;

string s = "Code Grand Prix";

// Finding length (.length() and .size() are identical)
int length = (int)s.length(); // 15

// Empty check
bool empty = s.empty();`,
        notes: 'In C++, std::string is mutable and can be modified in-place.',
      },
      javascript: {
        code: `const s = "Code Grand Prix";

// Finding length (.length property)
const length = s.length; // 15

// Empty check
const empty = s.length === 0;`,
        notes: 'JavaScript strings are immutable UTF-16 code unit sequences.',
      },
    },
  },
  {
    id: 'string-char-access',
    categoryId: 'strings',
    title: 'Character Access',
    summary: 'Reading individual characters by 0-based index.',
    explanation: 'Retrieving single characters from specific positions.',
    keywords: ['charAt', 'character access', 'indexing', 'ascii'],
    languages: {
      python: {
        code: `s = "MONACO"

first = s[0]   # 'M'
second = s[1]  # 'O'
last = s[-1]   # 'O'

# ASCII code of character
code = ord(first)  # 77
from_code = chr(77) # 'M'`,
        notes: 'Strings are 0-indexed. Negative indices count backwards from the end.',
      },
      java: {
        code: `String s = "MONACO";

// Use charAt(index)
char first = s.charAt(0);           // 'M'
char last = s.charAt(s.length() - 1); // 'O'

// Character ASCII code
int code = (int) first; // 77`,
        notes: 's[0] is NOT valid syntax in Java; always use s.charAt(0).',
      },
      cpp: {
        code: `#include <string>
using namespace std;

string s = "MONACO";

// Bracket notation (no bounds checking, fast)
char first = s[0];            // 'M'
char last = s.back();         // 'O'

// In C++, chars are directly integers
int code = (int)first; // 77`,
        notes: 'Bracket indexing s[i] is fast and standard in C++ competitive programming.',
      },
      javascript: {
        code: `const s = "MONACO";

// Bracket indexing or charAt
const first = s[0];            // 'M'
const last = s.at(-1);         // 'O' (or s.charAt(s.length - 1))

// ASCII code
const code = s.charCodeAt(0);  // 77`,
        notes: 's.at(-1) safely reads the last character in modern JavaScript.',
      },
    },
  },
  {
    id: 'string-concatenation',
    categoryId: 'strings',
    title: 'String Concatenation & Fast Building',
    summary: 'Joining strings and efficient O(N) builder patterns.',
    explanation: 'Repeated string concatenation with + in loops is O(N^2). Use StringBuilder or join patterns for linear O(N) performance.',
    keywords: ['concat', 'stringbuilder', 'append', 'template literals', 'performance'],
    languages: {
      python: {
        code: `# Fast string building in loops: append to list then join!
parts = []
for i in range(5):
    parts.append(str(i))
result = "".join(parts)  # "01234" (O(N) time)

# Formatted f-string for small interpolations
name = "Driver"
lap = 14
msg = f"{name} on lap {lap}"`,
        notes: 'Never do s += new_part in large loops in Python; always collect in a list and "".join(list).',
      },
      java: {
        code: `// Use StringBuilder for O(N) concatenation in loops
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 5; i++) {
    sb.append(i);
}
String result = sb.toString(); // "01234"

// String + String creates new objects each time (slow in loops)
String simple = "Lap " + 14;`,
        notes: 'StringBuilder is mandatory when constructing large strings in competitive programming to avoid TLE.',
      },
      cpp: {
        code: `#include <string>
using namespace std;

// In C++, operator+= on std::string mutates in-place (O(1) amortized!)
string s = "";
for (int i = 0; i < 5; i++) {
    s += to_string(i); // "01234"
}

// Pre-reserve capacity if total size is known:
s.reserve(100000);`,
        notes: 'std::string::operator+= is amortized O(1), making it very fast in C++ without needing a separate builder class.',
      },
      javascript: {
        code: `// Template literals for formatting
const name = "Driver";
const lap = 14;
const msg = \`\${name} on lap \${lap}\`;

// Fast concatenation in loops: collect in array and join
const parts = [];
for (let i = 0; i < 5; i++) {
    parts.push(i);
}
const result = parts.join(""); // "01234"`,
        notes: 'Array push + join("") runs in linear O(N) time in V8.',
      },
    },
  },
  {
    id: 'string-comparison',
    categoryId: 'strings',
    title: 'String Comparison & Equality',
    summary: 'Checking equality and lexicographical ordering.',
    explanation: 'Value comparison vs reference comparison. In Java, using == on Strings compares object references and fails on non-interned strings.',
    keywords: ['equals', 'compareTo', 'localeCompare', 'lexicographical', 'equality'],
    languages: {
      python: {
        code: `s1 = "grandprix"
s2 = "grandprix"
s3 = "circuit"

# Equality (compares content values)
is_equal = (s1 == s2)   # True

# Lexicographical comparison
is_smaller = (s3 < s1)  # True ("circuit" < "grandprix")`,
        notes: 'In Python, == always compares string contents.',
      },
      java: {
        code: `String s1 = new String("grandprix");
String s2 = new String("grandprix");

// CRITICAL: Always use .equals() in Java!
boolean equals = s1.equals(s2); // true
boolean badRef = (s1 == s2);    // false! (compares references)

// Lexicographical comparison: compareTo
// Returns < 0 if s1 < s2, 0 if equal, > 0 if s1 > s2
int cmp = s1.compareTo("monaco");`,
        notes: 'NEVER use == for Java strings in competitive programming. Always use s1.equals(s2).',
      },
      cpp: {
        code: `#include <string>
using namespace std;

string s1 = "grandprix";
string s2 = "grandprix";

// == in C++ compares string contents
bool equals = (s1 == s2); // true

// Lexicographical comparisons
bool less_than = (s1 < "monaco"); // true`,
        notes: 'C++ string operators (==, !=, <, >) compare contents lexicographically.',
      },
      javascript: {
        code: `const s1 = "grandprix";
const s2 = "grandprix";

// Strict equality compares string primitive values
const equals = (s1 === s2); // true

// Lexicographical comparison
const cmp = s1.localeCompare("monaco"); // < 0`,
        notes: 'JavaScript compares string primitives by value with ===.',
      },
    },
  },
  {
    id: 'string-substring',
    categoryId: 'strings',
    title: 'Substring Extraction',
    summary: 'Extracting a slice from start index to end index.',
    explanation: 'Extracting contiguous character sequences from within a string.',
    keywords: ['substring', 'slice', 'substr', 'sub-range'],
    languages: {
      python: {
        code: `s = "FORMULA1"

# Slicing: s[start:stop] (stop is EXCLUSIVE)
prefix = s[:7]    # "FORMULA" (from index 0 up to 7)
suffix = s[7:]    # "1" (from index 7 to end)
mid = s[3:7]      # "MULA" (indices 3, 4, 5, 6)`,
        notes: 'Slices safely clamp out-of-range bounds in Python.',
      },
      java: {
        code: `String s = "FORMULA1";

// substring(beginIndex, endIndex) (endIndex is EXCLUSIVE)
String mid = s.substring(3, 7); // "MULA"

// substring(beginIndex) to end of string
String suffix = s.substring(7); // "1"`,
        notes: 'endIndex must be <= s.length(), otherwise StringIndexOutOfBoundsException is thrown.',
      },
      cpp: {
        code: `#include <string>
using namespace std;

string s = "FORMULA1";

// substr(startIndex, LENGTH) - NOTE: 2nd argument is LENGTH, not end index!
string mid = s.substr(3, 4); // "MULA" (start at 3, take 4 chars)

// substr(startIndex) to end
string suffix = s.substr(7); // "1"`,
        notes: 'IMPORTANT C++ DIFFERENCE: substr(pos, count) takes start position and LENGTH, NOT end index!',
      },
      javascript: {
        code: `const s = "FORMULA1";

// slice(start, end) where end is exclusive
const mid = s.slice(3, 7); // "MULA"

// slice from start to end
const suffix = s.slice(7); // "1"

// Negative index counts from end
const lastChar = s.slice(-1); // "1"`,
        notes: 'Prefer s.slice(start, end) over legacy s.substr() or s.substring().',
      },
    },
  },
  {
    id: 'string-split-join',
    categoryId: 'strings',
    title: 'String Splitting and Joining',
    summary: 'Splitting text by delimiters and joining array tokens into a string.',
    explanation: 'Parsing comma/space-separated strings into lists, and reconstituting arrays with custom separators.',
    keywords: ['split', 'join', 'delimiter', 'tokenize'],
    languages: {
      python: {
        code: `csv = "red,blue,green,yellow"

# Split by delimiter
colors = csv.split(",")  # ['red', 'blue', 'green', 'yellow']

# Split by any whitespace (strips leading/trailing spaces)
tokens = " 10   20   30 ".split() # ['10', '20', '30']

# Join list of strings with separator
rejoined = " - ".join(colors) # "red - blue - green - yellow"`,
        notes: 'split() with no arguments splits on arbitrary whitespace and discards empty runs.',
      },
      java: {
        code: `import java.util.Arrays;
import java.util.List;

String csv = "red,blue,green,yellow";

// Split by regex delimiter
String[] colors = csv.split(",");

// Join array of strings with delimiter (Java 8+)
String rejoined = String.join(" - ", colors);
// "red - blue - green - yellow"`,
        notes: 'String.split() takes a regex pattern; escape special characters like "\\\\." when splitting by dots.',
      },
      cpp: {
        code: `#include <string>
#include <vector>
#include <sstream>
using namespace std;

string csv = "red,blue,green,yellow";

// Split using stringstream and getline
vector<string> colors;
stringstream ss(csv);
string token;
while (getline(ss, token, ',')) {
    colors.push_back(token);
}

// Join vector of strings with delimiter
string rejoined = "";
for (int i = 0; i < (int)colors.size(); i++) {
    if (i > 0) rejoined += " - ";
    rejoined += colors[i];
}`,
        notes: 'stringstream with getline(ss, token, delim) is the standard C++ idiom for token splitting.',
      },
      javascript: {
        code: `const csv = "red,blue,green,yellow";

// Split string into array
const colors = csv.split(","); // ['red', 'blue', 'green', 'yellow']

// Join array into string with delimiter
const rejoined = colors.join(" - "); // "red - blue - green - yellow"`,
        notes: 'Standard split() and join() in JavaScript.',
      },
    },
  },
  {
    id: 'string-case-conversion',
    categoryId: 'strings',
    title: 'Case Conversion (Upper / Lower)',
    summary: 'Converting strings to uppercase and lowercase.',
    explanation: 'Normalizing strings for case-insensitive comparisons and formatting.',
    keywords: ['upper', 'lower', 'uppercase', 'lowercase', 'case conversion'],
    languages: {
      python: {
        code: `s = "GrandPrix"

upper_s = s.upper()  # "GRANDPRIX"
lower_s = s.lower()  # "grandprix"

# Check case
is_upper = s.isupper() # False
is_lower = s.islower() # False`,
        notes: 'upper() and lower() return brand new strings.',
      },
      java: {
        code: `String s = "GrandPrix";

String upperS = s.toUpperCase(); // "GRANDPRIX"
String lowerS = s.toLowerCase(); // "grandprix"

// Case-insensitive comparison
boolean eq = s.equalsIgnoreCase("grandprix"); // true`,
        notes: 'Use s.equalsIgnoreCase(...) for direct case-insensitive matching.',
      },
      cpp: {
        code: `#include <string>
#include <algorithm>
#include <cctype>
using namespace std;

string s = "GrandPrix";

// In-place uppercase conversion using transform
transform(s.begin(), s.end(), s.begin(), ::toupper);
// s is now "GRANDPRIX"

// In-place lowercase conversion
transform(s.begin(), s.end(), s.begin(), ::tolower);
// s is now "grandprix"`,
        notes: 'std::transform with ::toupper / ::tolower operates in-place on C++ strings.',
      },
      javascript: {
        code: `const s = "GrandPrix";

const upperS = s.toUpperCase(); // "GRANDPRIX"
const lowerS = s.toLowerCase(); // "grandprix"`,
        notes: 'Standard toUpperCase() and toLowerCase() in JavaScript.',
      },
    },
  },
  {
    id: 'string-search-replace',
    categoryId: 'strings',
    title: 'Finding & Replacing Substrings',
    summary: 'Locating character indices and substituting substrings.',
    explanation: 'Finding the index of a character or substring, and replacing occurrences.',
    keywords: ['find', 'indexOf', 'replace', 'replaceAll', 'search'],
    languages: {
      python: {
        code: `s = "grand_prix_2026_grand"

# Find index of substring (returns -1 if not found)
idx = s.find("prix")    # 6
not_found = s.find("xyz") # -1

# Check substring existence with 'in' keyword
has_sub = "2026" in s   # True

# Replace occurrences
replaced = s.replace("grand", "fast") # "fast_prix_2026_fast"`,
        notes: 's.replace() replaces all occurrences by default in Python.',
      },
      java: {
        code: `String s = "grand_prix_2026_grand";

// Find index (returns -1 if not found)
int idx = s.indexOf("prix"); // 6

// Check contains
boolean hasSub = s.contains("2026"); // true

// Replace all literal occurrences (does not use regex)
String replaced = s.replace("grand", "fast"); // "fast_prix_2026_fast"`,
        notes: 's.replace() replaces all literal matches without regex. s.replaceAll() uses regular expressions.',
      },
      cpp: {
        code: `#include <string>
using namespace std;

string s = "grand_prix_2026_grand";

// Find substring: returns string::npos if not found
size_t idx = s.find("prix");
if (idx != string::npos) {
    // Found at index idx
}

// In-place single replacement:
// s.replace(start_pos, length, replacement_string);
if (idx != string::npos) {
    s.replace(idx, 4, "RACE");
}`,
        notes: 'Always check idx != string::npos when using std::string::find.',
      },
      javascript: {
        code: `const s = "grand_prix_2026_grand";

// Find index (returns -1 if not found)
const idx = s.indexOf("prix"); // 6

// Check includes
const hasSub = s.includes("2026"); // true

// Replace all occurrences (modern JS replaceAll)
const replaced = s.replaceAll("grand", "fast");`,
        notes: 'Use replaceAll() to substitute every occurrence in JavaScript.',
      },
    },
  },
  {
    id: 'string-reverse',
    categoryId: 'strings',
    title: 'Reversing Strings',
    summary: 'Inverting character order for palindrome and suffix checks.',
    explanation: 'Flipping a string backwards.',
    keywords: ['reverse string', 'palindrome', 'flip string', 'invert'],
    languages: {
      python: {
        code: `s = "RACEالدCAR"
# Reversing via slice
rev = s[::-1]

# Palindrome check
is_palindrome = (s == s[::-1])`,
        notes: 's[::-1] is the fastest and most idiomatic string reversal in Python.',
      },
      java: {
        code: `String s = "RACECAR";

// Use StringBuilder.reverse()
String rev = new StringBuilder(s).reverse().toString();

// Palindrome check
boolean isPalindrome = s.equals(rev);`,
        notes: 'new StringBuilder(s).reverse().toString() runs in O(N) linear time.',
      },
      cpp: {
        code: `#include <string>
#include <algorithm>
using namespace std;

string s = "RACECAR";

// In-place reversal of string
reverse(s.begin(), s.end());

// Create reversed copy without mutating original
string orig = "RACE";
string rev = orig;
reverse(rev.begin(), rev.end());`,
        notes: 'std::reverse works directly on std::string in C++.',
      },
      javascript: {
        code: `const s = "RACECAR";

// Split to characters, reverse, and rejoin
const rev = s.split("").reverse().join("");

// Palindrome check
const isPalindrome = (s === rev);`,
        notes: 's.split("").reverse().join("") is the standard idiom in JavaScript.',
      },
    },
  },
  {
    id: 'string-number-conversion',
    categoryId: 'strings',
    title: 'String to Number & Number to String',
    summary: 'Parsing numeric values and stringifying integers.',
    explanation: 'Converting between string text and numerical primitives.',
    keywords: ['parse', 'int to string', 'string to int', 'stoi', 'to_string', 'parseInt'],
    languages: {
      python: {
        code: `# String to int & float
n = int("12345")
f = float("3.14")

# Number to string
s = str(n)  # "12345"

# Binary / Hex string parsing
from_bin = int("1010", 2) # 10
from_hex = int("FF", 16)   # 255`,
        notes: 'int(s, base) parses strings in arbitrary numerical bases.',
      },
      java: {
        code: `// String to numbers
int n = Integer.parseInt("12345");
long big = Long.parseLong("999999999999");
double d = Double.parseDouble("3.14");

// Numbers to string
String s = String.valueOf(n);
String sLong = Long.toString(big);`,
        notes: 'Integer.parseInt() parses base-10 integers in Java.',
      },
      cpp: {
        code: `#include <string>
using namespace std;

// String to numbers
int n = stoi("12345");
long long big = stoll("999999999999");
double d = stod("3.14");

// Numbers to string
string s = to_string(n);`,
        notes: 'to_string() and stoi/stoll are included in <string>.',
      },
      javascript: {
        code: `// String to numbers
const n = parseInt("12345", 10);
const big = BigInt("999999999999999999");
const d = parseFloat("3.14");

// Numbers to string
const s = String(n);
const sBig = big.toString();`,
        notes: 'Always pass radix 10 to parseInt.',
      },
    },
  },
]
