export const programs = {
  python: {
    correct: "print(input())", wrong: "print(0)", runtime: 'raise ValueError("fixture")',
    timeout: "while True: pass", output: 'print("x" * 300000)',
    memory: "data = bytearray(300 * 1024 * 1024)\nfor i in range(0, len(data), 4096): data[i] = 1\nprint(len(data))"
  },
  java: {
    correct: "public class Main { public static void main(String[] args) { System.out.println(new java.util.Scanner(System.in).nextInt()); } }",
    wrong: "public class Main { public static void main(String[] args) { System.out.println(0); } }",
    runtime: 'public class Main { public static void main(String[] args) { throw new IllegalStateException("fixture"); } }',
    compilation: "public class Main { public static void main(String[] args) { invalid } }",
    timeout: "public class Main { public static void main(String[] args) { while (true) {} } }",
    output: "public class Main { public static void main(String[] args) { char[] a=new char[300000]; java.util.Arrays.fill(a,'x'); System.out.print(a); } }",
    memory: "public class Main { public static void main(String[] args) { byte[] data = new byte[300 * 1024 * 1024]; java.util.Arrays.fill(data, (byte) 1); System.out.println(data.length); } }"
  },
  cpp: {
    correct: "#include <iostream>\nint main(){int n; std::cin >> n; std::cout << n;}",
    wrong: "#include <iostream>\nint main(){std::cout << 0;}",
    runtime: "#include <cstdlib>\nint main(){std::abort();}", compilation: "int main( {",
    timeout: "int main(){for(;;){ volatile int n=1; (void)n; }}",
    output: '#include <iostream>\n#include <string>\nint main(){std::cout << std::string(300000, \'x\');}',
    memory: "#include <iostream>\n#include <vector>\nint main(){std::vector<char> data(300 * 1024 * 1024, 1); std::cout << data.at(0);}"
  },
  javascript: {
    correct: 'console.log(require("fs").readFileSync(0, "utf8").trim())', wrong: "console.log(0)",
    runtime: 'throw new Error("fixture")', timeout: "while(true){}",
    output: 'console.log("x".repeat(300000))',
    memory: "console.log(Buffer.alloc(300 * 1024 * 1024, 1).length)"
  }
};
