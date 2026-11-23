import type { Problem } from '../types/arena'
import type { AdminHint } from '../types/assist'

// Code Grand Prix 2026 - F1-Themed Competitive Programming Problem Set
// 35 problems: 20 Easy (p1-p20), 12 Medium (p21-p32), 3 Hard (p33-p35)
export const mockProblems: Problem[] = [
  {
    "id": "p1",
    "number": 1,
    "title": "Lights Out",
    "difficulty": "Easy",
    "points": 100,
    "timeLimitMs": 1000,
    "memoryLimitMb": 256,
    "statement": [
      "A Formula 1 race begins when all five red lights turn off. The reaction time of a driver is recorded in milliseconds.",
      "Classify the start as FAST if the reaction time is at most 250 ms; otherwise classify it as SLOW. Print the classification."
    ],
    "inputFormat": [
      "One integer R, the reaction time in milliseconds."
    ],
    "outputFormat": "Print FAST if R <= 250, otherwise print SLOW.",
    "constraints": [
      "0 <= R <= 2000"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "240",
        "output": "FAST",
        "explanation": "240 is no greater than 250, so the reaction is FAST."
      }
    ],
    "expectedTimeComplexity": "O(1)",
    "expectedSpaceComplexity": "O(1)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p2",
    "number": 2,
    "title": "Fuel Remaining",
    "difficulty": "Easy",
    "points": 100,
    "timeLimitMs": 1000,
    "memoryLimitMb": 256,
    "statement": [
      "A car starts a lap with F litres of fuel and consumes C litres during the lap. Find how much fuel remains. You may assume the car never consumes more fuel than it has."
    ],
    "inputFormat": [
      "Two integers F and C."
    ],
    "outputFormat": "Print F-C.",
    "constraints": [
      "0 <= C <= F <= 10^9"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "80 17",
        "output": "63",
        "explanation": "The car has 80-17 = 63 litres left."
      }
    ],
    "expectedTimeComplexity": "O(1)",
    "expectedSpaceComplexity": "O(1)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p3",
    "number": 3,
    "title": "Pit Crew Countdown",
    "difficulty": "Easy",
    "points": 100,
    "timeLimitMs": 1000,
    "memoryLimitMb": 256,
    "statement": [
      "A pit crew needs S seconds to service a car. The pit lane is open for T seconds. Determine the minimum number of complete service windows of length T needed to cover S seconds. A final partially used window still counts as one."
    ],
    "inputFormat": [
      "Two positive integers S and T."
    ],
    "outputFormat": "Print ceil(S/T).",
    "constraints": [
      "1 <= S,T <= 10^9"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "125 60",
        "output": "3",
        "explanation": "Two windows cover 120 seconds, so a third is needed for the remaining 5 seconds."
      }
    ],
    "expectedTimeComplexity": "O(1)",
    "expectedSpaceComplexity": "O(1)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p4",
    "number": 4,
    "title": "Fastest Sector",
    "difficulty": "Easy",
    "points": 100,
    "timeLimitMs": 1000,
    "memoryLimitMb": 256,
    "statement": [
      "A circuit is divided into N sectors. The timing system records the time taken in each sector. Find the smallest sector time."
    ],
    "inputFormat": [
      "N, followed by N positive integers A[i]."
    ],
    "outputFormat": "Print the minimum value in the array.",
    "constraints": [
      "1 <= N <= 10^5",
      "1 <= A[i] <= 10^9"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "5\n31 28 35 29 33",
        "output": "28",
        "explanation": "The smallest recorded sector time is 28."
      }
    ],
    "expectedTimeComplexity": "O(N)",
    "expectedSpaceComplexity": "O(1) extra space",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p5",
    "number": 5,
    "title": "Constructor Points",
    "difficulty": "Easy",
    "points": 100,
    "timeLimitMs": 1000,
    "memoryLimitMb": 256,
    "statement": [
      "A constructor earns points from each race. Given its points from N races, calculate its season total."
    ],
    "inputFormat": [
      "N, followed by N non-negative integers P[i]."
    ],
    "outputFormat": "Print the sum of all points.",
    "constraints": [
      "1 <= N <= 10^5",
      "0 <= P[i] <= 10^6"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "4\n25 18 15 12",
        "output": "70",
        "explanation": "25+18+15+12 = 70 points."
      }
    ],
    "expectedTimeComplexity": "O(N)",
    "expectedSpaceComplexity": "O(1) extra space",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p6",
    "number": 6,
    "title": "Tire Wear Alert",
    "difficulty": "Easy",
    "points": 100,
    "timeLimitMs": 1000,
    "memoryLimitMb": 256,
    "statement": [
      "A tyre is considered worn out when its wear percentage reaches or exceeds W. Given the measured wear percentage X, report whether the team must replace it."
    ],
    "inputFormat": [
      "Two integers X and W."
    ],
    "outputFormat": "Print REPLACE if X >= W; otherwise print CONTINUE.",
    "constraints": [
      "0 <= X,W <= 100"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "72 70",
        "output": "REPLACE",
        "explanation": "72% is at least the 70% threshold."
      }
    ],
    "expectedTimeComplexity": "O(1)",
    "expectedSpaceComplexity": "O(1)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p7",
    "number": 7,
    "title": "Grid Position",
    "difficulty": "Easy",
    "points": 100,
    "timeLimitMs": 1000,
    "memoryLimitMb": 256,
    "statement": [
      "There are N cars on the starting grid. A driver is currently in position P.",
      "After a penalty, the driver moves back by K places. Positions cannot go behind the last grid position."
    ],
    "inputFormat": [
      "Three integers N, P and K."
    ],
    "outputFormat": "Print the new position: min(N, P+K).",
    "constraints": [
      "1 <= P <= N <= 10^9",
      "0 <= K <= 10^9"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "20 4 3",
        "output": "7",
        "explanation": "The driver drops from fourth to seventh."
      }
    ],
    "expectedTimeComplexity": "O(1)",
    "expectedSpaceComplexity": "O(1)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p8",
    "number": 8,
    "title": "Race Clock",
    "difficulty": "Easy",
    "points": 100,
    "timeLimitMs": 1000,
    "memoryLimitMb": 256,
    "statement": [
      "A race session lasts M minutes and S additional seconds. Convert the duration entirely into seconds."
    ],
    "inputFormat": [
      "Two integers M and S, where S is between 0 and 59."
    ],
    "outputFormat": "Print 60*M+S.",
    "constraints": [
      "0 <= M <= 10^6",
      "0 <= S < 60"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "12 35",
        "output": "755",
        "explanation": "12 minutes and 35 seconds equals 720+35 = 755 seconds."
      }
    ],
    "expectedTimeComplexity": "O(1)",
    "expectedSpaceComplexity": "O(1)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p9",
    "number": 9,
    "title": "DRS Detection",
    "difficulty": "Easy",
    "points": 100,
    "timeLimitMs": 1000,
    "memoryLimitMb": 256,
    "statement": [
      "A driver may use DRS when the gap to the car ahead is at most 1.0 second at the detection point.",
      "Given the gap in milliseconds, decide whether DRS is available."
    ],
    "inputFormat": [
      "One integer G, the gap in milliseconds."
    ],
    "outputFormat": "Print DRS if G <= 1000; otherwise print NO DRS.",
    "constraints": [
      "0 <= G <= 10000"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "875",
        "output": "DRS",
        "explanation": "875 ms is within the 1000 ms limit."
      }
    ],
    "expectedTimeComplexity": "O(1)",
    "expectedSpaceComplexity": "O(1)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p10",
    "number": 10,
    "title": "Top Speed",
    "difficulty": "Easy",
    "points": 100,
    "timeLimitMs": 1000,
    "memoryLimitMb": 256,
    "statement": [
      "A speed trap records a car's speed at N checkpoints. Find the maximum recorded speed."
    ],
    "inputFormat": [
      "N, followed by N integers V[i]."
    ],
    "outputFormat": "Print the maximum speed.",
    "constraints": [
      "1 <= N <= 10^5",
      "0 <= V[i] <= 10^6"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "5\n301 315 298 322 310",
        "output": "322",
        "explanation": "The highest checkpoint speed is 322."
      }
    ],
    "expectedTimeComplexity": "O(N)",
    "expectedSpaceComplexity": "O(1) extra space",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p11",
    "number": 11,
    "title": "Penalty Seconds",
    "difficulty": "Easy",
    "points": 100,
    "timeLimitMs": 1000,
    "memoryLimitMb": 256,
    "statement": [
      "A driver receives N time penalties during a race. Calculate the total number of penalty seconds."
    ],
    "inputFormat": [
      "N, followed by N non-negative integers."
    ],
    "outputFormat": "Print the total penalty time.",
    "constraints": [
      "1 <= N <= 10^5",
      "0 <= A[i] <= 10^6"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "3\n5 10 5",
        "output": "20",
        "explanation": "The penalties add up to 5+10+5 = 20 seconds."
      }
    ],
    "expectedTimeComplexity": "O(N)",
    "expectedSpaceComplexity": "O(1) extra space",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p12",
    "number": 12,
    "title": "Podium Check",
    "difficulty": "Easy",
    "points": 100,
    "timeLimitMs": 1000,
    "memoryLimitMb": 256,
    "statement": [
      "Three drivers finish a race. Given a driver's finishing position P, determine whether the driver is on the podium."
    ],
    "inputFormat": [
      "One integer P."
    ],
    "outputFormat": "Print PODIUM if P is 1, 2 or 3; otherwise print OUT.",
    "constraints": [
      "1 <= P <= 20"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "3",
        "output": "PODIUM",
        "explanation": "Third place is the final podium position."
      }
    ],
    "expectedTimeComplexity": "O(1)",
    "expectedSpaceComplexity": "O(1)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p13",
    "number": 13,
    "title": "Team Radio",
    "difficulty": "Easy",
    "points": 100,
    "timeLimitMs": 1000,
    "memoryLimitMb": 256,
    "statement": [
      "A team radio message is represented by a single word.",
      "If the message is exactly BOX, the driver must enter the pit lane. Otherwise, the driver stays on track."
    ],
    "inputFormat": [
      "A single uppercase word M."
    ],
    "outputFormat": "Print PIT for BOX; otherwise print TRACK.",
    "constraints": [
      "1 <= length(M) <= 20"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "BOX",
        "output": "PIT",
        "explanation": "The message is BOX, so the driver enters the pit lane."
      }
    ],
    "expectedTimeComplexity": "O(1) for bounded message length",
    "expectedSpaceComplexity": "O(1)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p14",
    "number": 14,
    "title": "Fuel Efficiency",
    "difficulty": "Easy",
    "points": 100,
    "timeLimitMs": 1000,
    "memoryLimitMb": 256,
    "statement": [
      "A car travels D kilometres using F litres of fuel. Find its fuel efficiency in kilometres per litre. F is guaranteed to be positive.",
      "Print the answer with exactly two digits after the decimal point."
    ],
    "inputFormat": [
      "Two numbers D and F."
    ],
    "outputFormat": "Print D/F rounded to two decimal places.",
    "constraints": [
      "0 < D <= 10^6",
      "0 < F <= 10^6"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "250 40",
        "output": "6.25",
        "explanation": "250 divided by 40 is 6.25 km/litre."
      }
    ],
    "expectedTimeComplexity": "O(1)",
    "expectedSpaceComplexity": "O(1)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p15",
    "number": 15,
    "title": "Pit Window",
    "difficulty": "Easy",
    "points": 100,
    "timeLimitMs": 1000,
    "memoryLimitMb": 256,
    "statement": [
      "A team's planned pit stop lap is L. The permitted pit window starts at A and ends at B, inclusive.",
      "Decide whether the planned stop is inside the window."
    ],
    "inputFormat": [
      "Three integers L, A and B."
    ],
    "outputFormat": "Print VALID if A <= L <= B; otherwise print INVALID.",
    "constraints": [
      "1 <= A <= B <= 10^9",
      "1 <= L <= 10^9"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "22 20 25",
        "output": "VALID",
        "explanation": "Lap 22 lies between laps 20 and 25, inclusive."
      }
    ],
    "expectedTimeComplexity": "O(1)",
    "expectedSpaceComplexity": "O(1)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p16",
    "number": 16,
    "title": "Driver Number",
    "difficulty": "Easy",
    "points": 100,
    "timeLimitMs": 1000,
    "memoryLimitMb": 256,
    "statement": [
      "A driver's car number is a positive integer N. The team assigns a lucky score equal to the sum of its decimal digits. Calculate that score."
    ],
    "inputFormat": [
      "One positive integer N."
    ],
    "outputFormat": "Print the sum of the digits of N.",
    "constraints": [
      "1 <= N <= 10^18"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "2026",
        "output": "10",
        "explanation": "2+0+2+6 = 10."
      }
    ],
    "expectedTimeComplexity": "O(number of digits)",
    "expectedSpaceComplexity": "O(1)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p17",
    "number": 17,
    "title": "Gap Formatter",
    "difficulty": "Easy",
    "points": 100,
    "timeLimitMs": 1000,
    "memoryLimitMb": 256,
    "statement": [
      "The timing screen stores a gap as an integer number of milliseconds G.",
      "Display the gap as whole seconds and leftover milliseconds, separated by a space."
    ],
    "inputFormat": [
      "One non-negative integer G."
    ],
    "outputFormat": "Print G/1000 and G%1000.",
    "constraints": [
      "0 <= G <= 10^9"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "2345",
        "output": "2 345",
        "explanation": "2345 ms contains 2 whole seconds and 345 ms."
      }
    ],
    "expectedTimeComplexity": "O(1)",
    "expectedSpaceComplexity": "O(1)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p18",
    "number": 18,
    "title": "Points Difference",
    "difficulty": "Easy",
    "points": 100,
    "timeLimitMs": 1000,
    "memoryLimitMb": 256,
    "statement": [
      "Two rival drivers earn A and B championship points. Find the absolute difference between their scores."
    ],
    "inputFormat": [
      "Two integers A and B."
    ],
    "outputFormat": "Print |A-B|.",
    "constraints": [
      "0 <= A,B <= 10^9"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "156 143",
        "output": "13",
        "explanation": "The difference between 156 and 143 is 13."
      }
    ],
    "expectedTimeComplexity": "O(1)",
    "expectedSpaceComplexity": "O(1)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p19",
    "number": 19,
    "title": "Wet Track",
    "difficulty": "Easy",
    "points": 100,
    "timeLimitMs": 1000,
    "memoryLimitMb": 256,
    "statement": [
      "The race director declares a wet track when the measured rainfall R is at least the threshold W. Determine the track condition."
    ],
    "inputFormat": [
      "Two integers R and W."
    ],
    "outputFormat": "Print WET if R >= W; otherwise print DRY.",
    "constraints": [
      "0 <= R,W <= 10^6"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "8 10",
        "output": "DRY",
        "explanation": "Rainfall 8 is below the threshold 10."
      }
    ],
    "expectedTimeComplexity": "O(1)",
    "expectedSpaceComplexity": "O(1)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p20",
    "number": 20,
    "title": "Green Flag Streak",
    "difficulty": "Easy",
    "points": 100,
    "timeLimitMs": 1000,
    "memoryLimitMb": 256,
    "statement": [
      "A lap is marked 1 if it was completed under green-flag conditions and 0 otherwise. Find the longest consecutive sequence of green-flag laps."
    ],
    "inputFormat": [
      "N, followed by N values, each either 0 or 1."
    ],
    "outputFormat": "Print the maximum length of a consecutive run of 1s.",
    "constraints": [
      "1 <= N <= 10^5"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "8\n1 1 0 1 1 1 0 1",
        "output": "3",
        "explanation": "The longest uninterrupted green-flag run has length 3."
      }
    ],
    "expectedTimeComplexity": "O(N)",
    "expectedSpaceComplexity": "O(1)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p21",
    "number": 21,
    "title": "Best Three-Lap Average",
    "difficulty": "Medium",
    "points": 200,
    "timeLimitMs": 2000,
    "memoryLimitMb": 256,
    "statement": [
      "A driver records one lap time for each of N consecutive laps.",
      "Find the minimum average time over any block of exactly three consecutive laps. N is at least 3."
    ],
    "inputFormat": [
      "N followed by N positive lap times."
    ],
    "outputFormat": "Print the minimum three-lap average with exactly two decimal places.",
    "constraints": [
      "3 <= N <= 2*10^5",
      "1 <= A[i] <= 10^6"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "5\n90 88 91 85 86",
        "output": "87.33",
        "explanation": "The three-lap sums are 269, 264 and 262. The minimum is 262, so the average is 262/3 = 87.33."
      }
    ],
    "expectedTimeComplexity": "O(N)",
    "expectedSpaceComplexity": "O(1) extra space",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p22",
    "number": 22,
    "title": "Drivers Above Average",
    "difficulty": "Medium",
    "points": 200,
    "timeLimitMs": 2000,
    "memoryLimitMb": 256,
    "statement": [
      "The team wants to identify drivers whose points are strictly greater than the team's average points. Given N drivers and their points, count such drivers."
    ],
    "inputFormat": [
      "N followed by N non-negative integers."
    ],
    "outputFormat": "Print the count of values strictly greater than the arithmetic mean.",
    "constraints": [
      "1 <= N <= 2*10^5",
      "0 <= A[i] <= 10^9"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "4\n10 20 30 40",
        "output": "2",
        "explanation": "The average is 25; scores 30 and 40 are strictly greater."
      }
    ],
    "expectedTimeComplexity": "O(N)",
    "expectedSpaceComplexity": "O(N)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p23",
    "number": 23,
    "title": "Longest Stint",
    "difficulty": "Medium",
    "points": 200,
    "timeLimitMs": 2000,
    "memoryLimitMb": 256,
    "statement": [
      "Each lap consumes one unit of tyre life. A stint is a consecutive group of laps whose total tyre wear does not exceed W.",
      "Given the wear added on each lap, find the maximum number of consecutive laps in a valid stint. All wear values are positive."
    ],
    "inputFormat": [
      "N W, followed by N positive wear values."
    ],
    "outputFormat": "Print the maximum valid subarray length.",
    "constraints": [
      "1 <= N <= 2*10^5",
      "1 <= W,A[i] <= 10^9"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "6 10\n2 3 4 2 1 5",
        "output": "3",
        "explanation": "The longest valid stint is 2,1,5 with total wear 8, length 3."
      }
    ],
    "expectedTimeComplexity": "O(N)",
    "expectedSpaceComplexity": "O(1) extra space",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p24",
    "number": 24,
    "title": "Overtake Count",
    "difficulty": "Medium",
    "points": 200,
    "timeLimitMs": 2000,
    "memoryLimitMb": 256,
    "statement": [
      "The timing system lists the positions of N cars before and after a sector.",
      "For this problem, the input is the sequence of car IDs in the order they appear before the sector, followed by their order after the sector. Count pairs of cars whose relative order is reversed. IDs are distinct."
    ],
    "inputFormat": [
      "N, then N IDs in the first order, then N IDs in the second order."
    ],
    "outputFormat": "Print the number of reversed pairs.",
    "constraints": [
      "1 <= N <= 2*10^5",
      "IDs are distinct integers."
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "3\n10 20 30\n30 10 20",
        "output": "2",
        "explanation": "Car 30 passes both 10 and 20, creating two reversed pairs."
      }
    ],
    "expectedTimeComplexity": "O(N log N)",
    "expectedSpaceComplexity": "O(N)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p25",
    "number": 25,
    "title": "Pit Lane Queue",
    "difficulty": "Medium",
    "points": 200,
    "timeLimitMs": 2000,
    "memoryLimitMb": 256,
    "statement": [
      "N cars request pit entry at integer times. Each service takes exactly one time unit, and only one car can be serviced at a time. A car may start service at its requested time or later.",
      "Find the earliest possible finish time of all cars if requests are handled in nondecreasing requested-time order."
    ],
    "inputFormat": [
      "N followed by N requested start times."
    ],
    "outputFormat": "Print the finish time of the final car. Service occupies [start,start+1), so the finish is an integer.",
    "constraints": [
      "1 <= N <= 2*10^5",
      "0 <= T[i] <= 10^9"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "4\n1 2 2 3",
        "output": "5",
        "explanation": "Sorted requests are 1,2,2,3. Services start at 1,2,3,4 and finish at 5; intervals [1,2),[2,3),[3,4),[4,5), so answer is 5."
      }
    ],
    "expectedTimeComplexity": "O(N log N)",
    "expectedSpaceComplexity": "O(1) extra space apart from sorting",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p26",
    "number": 26,
    "title": "Sector Personal Best",
    "difficulty": "Medium",
    "points": 200,
    "timeLimitMs": 2000,
    "memoryLimitMb": 256,
    "statement": [
      "A driver has N sector times. For each of Q queries, the engineer asks for the total time from sector L through sector R, inclusive. Answer every query."
    ],
    "inputFormat": [
      "N Q, N sector times, then Q pairs L R (1-indexed)."
    ],
    "outputFormat": "For each query, print the sum from L to R on its own line.",
    "constraints": [
      "1 <= N,Q <= 2*10^5",
      "1 <= A[i] <= 10^6",
      "1 <= L <= R <= N"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "5 2\n10 20 30 40 50\n2 4\n1 5",
        "output": "90\n150",
        "explanation": "Sectors 2..4 sum to 90; all five sum to 150."
      }
    ],
    "expectedTimeComplexity": "O(N + Q)",
    "expectedSpaceComplexity": "O(N)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p27",
    "number": 27,
    "title": "Championship Standings",
    "difficulty": "Medium",
    "points": 200,
    "timeLimitMs": 2000,
    "memoryLimitMb": 256,
    "statement": [
      "Each driver has a name and a points total. Rank drivers by points in descending order. If points are equal, the name that comes first in lexicographic order ranks first. Print the ordered names."
    ],
    "inputFormat": [
      "N, followed by N lines containing a name (no spaces) and its points."
    ],
    "outputFormat": "Print the names in ranking order, one per line.",
    "constraints": [
      "1 <= N <= 10^5",
      "1 <= length(name) <= 20",
      "0 <= points <= 10^9"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "3\nMIA 25\nLEO 25\nAVA 30",
        "output": "AVA\nLEO\nMIA",
        "explanation": "AVA has the most points. LEO precedes MIA alphabetically in the tie."
      }
    ],
    "expectedTimeComplexity": "O(N log N)",
    "expectedSpaceComplexity": "O(N)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p28",
    "number": 28,
    "title": "Track Sector Wrap",
    "difficulty": "Medium",
    "points": 200,
    "timeLimitMs": 2000,
    "memoryLimitMb": 256,
    "statement": [
      "A circuit has N sectors numbered 0 to N-1. A car starts at sector S and moves forward by K sectors, wrapping around to sector 0 after sector N-1. Find its final sector."
    ],
    "inputFormat": [
      "Three integers N, S and K."
    ],
    "outputFormat": "Print (S+K) modulo N.",
    "constraints": [
      "1 <= N <= 10^9",
      "0 <= S < N",
      "0 <= K <= 10^18"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "12 10 5",
        "output": "3",
        "explanation": "Starting at 10 and moving 5 sectors gives 15; modulo 12 gives sector 3."
      }
    ],
    "expectedTimeComplexity": "O(1)",
    "expectedSpaceComplexity": "O(1)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p29",
    "number": 29,
    "title": "Maximum Points Run",
    "difficulty": "Medium",
    "points": 200,
    "timeLimitMs": 2000,
    "memoryLimitMb": 256,
    "statement": [
      "A driver gains or loses points in a sequence of N sprint events. Find the maximum total points obtainable from one non-empty consecutive block of events."
    ],
    "inputFormat": [
      "N followed by N signed integers."
    ],
    "outputFormat": "Print the maximum non-empty subarray sum.",
    "constraints": [
      "1 <= N <= 2*10^5",
      "-10^9 <= A[i] <= 10^9"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "5\n-2 3 -1 4 -5",
        "output": "6",
        "explanation": "The block 3,-1,4 has sum 6, which is maximum."
      }
    ],
    "expectedTimeComplexity": "O(N)",
    "expectedSpaceComplexity": "O(1)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p30",
    "number": 30,
    "title": "Pit Window Overlap",
    "difficulty": "Medium",
    "points": 200,
    "timeLimitMs": 2000,
    "memoryLimitMb": 256,
    "statement": [
      "Each planned pit stop occupies an interval [S,E), where S is its start time and E is its end time. Find the maximum number of cars simultaneously occupying the pit lane."
    ],
    "inputFormat": [
      "N followed by N pairs S E with S < E."
    ],
    "outputFormat": "Print the maximum overlap.",
    "constraints": [
      "1 <= N <= 2*10^5",
      "0 <= S < E <= 10^9"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "3\n1 5\n2 4\n5 7",
        "output": "2",
        "explanation": "At time 2, the first two stops overlap. The third begins exactly when the first ends, so it does not overlap the first."
      }
    ],
    "expectedTimeComplexity": "O(N log N)",
    "expectedSpaceComplexity": "O(N)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p31",
    "number": 31,
    "title": "Fastest Route to the Pits",
    "difficulty": "Medium",
    "points": 200,
    "timeLimitMs": 2000,
    "memoryLimitMb": 256,
    "statement": [
      "The paddock is represented as a weighted undirected graph. Junctions are vertices and roads are edges with positive travel times.",
      "Find the minimum travel time from the garage (vertex 1) to the pit entrance (vertex N)."
    ],
    "inputFormat": [
      "N M, followed by M edges u v w."
    ],
    "outputFormat": "Print the shortest distance from 1 to N, or -1 if unreachable.",
    "constraints": [
      "1 <= N <= 10^5",
      "0 <= M <= 2*10^5",
      "1 <= w <= 10^9"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "4 4\n1 2 4\n2 4 5\n1 3 2\n3 4 10",
        "output": "9",
        "explanation": "The route 1-2-4 costs 4+5=9, less than the route through 3."
      }
    ],
    "expectedTimeComplexity": "O((N + M) log N)",
    "expectedSpaceComplexity": "O(N + M)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p32",
    "number": 32,
    "title": "Lap Record Sequence",
    "difficulty": "Medium",
    "points": 200,
    "timeLimitMs": 2000,
    "memoryLimitMb": 256,
    "statement": [
      "A driver's lap speeds are recorded in order. A record sequence is a strictly increasing subsequence of these speeds; laps need not be adjacent. Find the maximum possible length."
    ],
    "inputFormat": [
      "N followed by N integers."
    ],
    "outputFormat": "Print the length of the longest strictly increasing subsequence.",
    "constraints": [
      "1 <= N <= 2*10^5",
      "0 <= A[i] <= 10^9"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "7\n4 2 3 1 5 6 2",
        "output": "4",
        "explanation": "One longest increasing subsequence is 2,3,5,6."
      }
    ],
    "expectedTimeComplexity": "O(N log N)",
    "expectedSpaceComplexity": "O(N)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p33",
    "number": 33,
    "title": "Balanced Tyre Strategy",
    "difficulty": "Hard",
    "points": 300,
    "timeLimitMs": 2000,
    "memoryLimitMb": 256,
    "statement": [
      "A team chooses a tyre compound for each of N stints. Compound A costs X[i] points of performance loss on stint i, and compound B costs Y[i].",
      "To avoid consecutive overheating, the same compound cannot be used for more than two consecutive stints. Find the minimum total performance loss."
    ],
    "inputFormat": [
      "N, followed by N pairs X[i] Y[i]."
    ],
    "outputFormat": "Print the minimum possible total loss.",
    "constraints": [
      "1 <= N <= 2*10^5",
      "0 <= X[i],Y[i] <= 10^9"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "4\n3 5\n4 2\n6 1\n2 4",
        "output": "8",
        "explanation": "One optimal choice is A,B,B,A with loss 3+2+1+2 = 8; no compound is used more than twice consecutively."
      }
    ],
    "expectedTimeComplexity": "O(N)",
    "expectedSpaceComplexity": "O(1)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p34",
    "number": 34,
    "title": "Maximum Championship Gain",
    "difficulty": "Hard",
    "points": 300,
    "timeLimitMs": 2000,
    "memoryLimitMb": 256,
    "statement": [
      "There are N races. In race i, a driver can earn A[i] points by taking an aggressive strategy, or 0 points by taking a safe strategy.",
      "However, aggressive strategy cannot be used in two consecutive races. Find the maximum points."
    ],
    "inputFormat": [
      "N followed by N non-negative integers A[i]."
    ],
    "outputFormat": "Print the maximum achievable points.",
    "constraints": [
      "1 <= N <= 2*10^5",
      "0 <= A[i] <= 10^9"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "5\n5 1 10 2 7",
        "output": "22",
        "explanation": "Choose races 1, 3 and 5 for 5+10+7 = 22 points."
      }
    ],
    "expectedTimeComplexity": "O(N)",
    "expectedSpaceComplexity": "O(1)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
  {
    "id": "p35",
    "number": 35,
    "title": "Pit Stop Cost Optimizer",
    "difficulty": "Hard",
    "points": 300,
    "timeLimitMs": 2000,
    "memoryLimitMb": 256,
    "statement": [
      "A race has N laps. The team may schedule pit stops after selected laps. A stop after lap i costs C[i].",
      "Between two consecutive stops, at most K laps may pass; the first stop must also occur within the first K laps, and the final stop must be no earlier than lap N-K+1. Find the minimum total stop cost. A stop after lap N is allowed."
    ],
    "inputFormat": [
      "N K, followed by N non-negative costs C[i]."
    ],
    "outputFormat": "Print the minimum total cost of a valid set of pit stops.",
    "constraints": [
      "1 <= K <= N <= 2*10^5",
      "0 <= C[i] <= 10^9"
    ],
    "samples": [
      {
        "id": "sample-1",
        "input": "5 2\n8 2 7 3 6",
        "output": "5",
        "explanation": "Stops after laps 2 and 4 cost 2+3=5; the first and last stop constraints are satisfied, and the gap is at most 2 laps."
      }
    ],
    "expectedTimeComplexity": "O(N)",
    "expectedSpaceComplexity": "O(N)",
    "allowedLanguages": [
      "python",
      "java",
      "cpp",
      "javascript"
    ]
  },
]

export const problemHints: Record<string, AdminHint[]> = {
  "p1": [
    {
      "id": "p1-hint-1",
      "order": 1,
      "deductionPoints": 10,
      "content": "Check whether the reaction time crosses a fixed threshold."
    },
    {
      "id": "p1-hint-2",
      "order": 2,
      "deductionPoints": 20,
      "content": "The threshold is 250 milliseconds."
    },
    {
      "id": "p1-hint-3",
      "order": 3,
      "deductionPoints": 30,
      "content": "A single comparison is sufficient."
    }
  ],
  "p2": [
    {
      "id": "p2-hint-1",
      "order": 1,
      "deductionPoints": 10,
      "content": "The car begins with a known amount of fuel."
    },
    {
      "id": "p2-hint-2",
      "order": 2,
      "deductionPoints": 20,
      "content": "Only the consumed amount must be removed."
    },
    {
      "id": "p2-hint-3",
      "order": 3,
      "deductionPoints": 30,
      "content": "Subtract C from F."
    }
  ],
  "p3": [
    {
      "id": "p3-hint-1",
      "order": 1,
      "deductionPoints": 10,
      "content": "A final partially used service window still counts."
    },
    {
      "id": "p3-hint-2",
      "order": 2,
      "deductionPoints": 20,
      "content": "Think about rounding division upward."
    },
    {
      "id": "p3-hint-3",
      "order": 3,
      "deductionPoints": 30,
      "content": "Use (S + T - 1) / T with integer division."
    }
  ],
  "p4": [
    {
      "id": "p4-hint-1",
      "order": 1,
      "deductionPoints": 10,
      "content": "You only need one value from the entire list."
    },
    {
      "id": "p4-hint-2",
      "order": 2,
      "deductionPoints": 20,
      "content": "Keep the smallest value seen so far."
    },
    {
      "id": "p4-hint-3",
      "order": 3,
      "deductionPoints": 30,
      "content": "Update a running minimum while reading the N values."
    }
  ],
  "p5": [
    {
      "id": "p5-hint-1",
      "order": 1,
      "deductionPoints": 10,
      "content": "Every race contributes to the season total."
    },
    {
      "id": "p5-hint-2",
      "order": 2,
      "deductionPoints": 20,
      "content": "A running total avoids storing all scores."
    },
    {
      "id": "p5-hint-3",
      "order": 3,
      "deductionPoints": 30,
      "content": "Add each P[i] to a 64-bit sum."
    }
  ],
  "p6": [
    {
      "id": "p6-hint-1",
      "order": 1,
      "deductionPoints": 10,
      "content": "Compare the measured wear with the replacement threshold."
    },
    {
      "id": "p6-hint-2",
      "order": 2,
      "deductionPoints": 20,
      "content": "Equality also triggers replacement."
    },
    {
      "id": "p6-hint-3",
      "order": 3,
      "deductionPoints": 30,
      "content": "Replace exactly when X >= W."
    }
  ],
  "p7": [
    {
      "id": "p7-hint-1",
      "order": 1,
      "deductionPoints": 10,
      "content": "The penalty moves the driver backward in the grid order."
    },
    {
      "id": "p7-hint-2",
      "order": 2,
      "deductionPoints": 20,
      "content": "The position cannot exceed N."
    },
    {
      "id": "p7-hint-3",
      "order": 3,
      "deductionPoints": 30,
      "content": "Calculate min(N, P + K)."
    }
  ],
  "p8": [
    {
      "id": "p8-hint-1",
      "order": 1,
      "deductionPoints": 10,
      "content": "Convert the minutes before combining them with seconds."
    },
    {
      "id": "p8-hint-2",
      "order": 2,
      "deductionPoints": 20,
      "content": "One minute contains 60 seconds."
    },
    {
      "id": "p8-hint-3",
      "order": 3,
      "deductionPoints": 30,
      "content": "Compute 60*M + S."
    }
  ],
  "p9": [
    {
      "id": "p9-hint-1",
      "order": 1,
      "deductionPoints": 10,
      "content": "Convert the one-second DRS limit into milliseconds."
    },
    {
      "id": "p9-hint-2",
      "order": 2,
      "deductionPoints": 20,
      "content": "The limit is inclusive."
    },
    {
      "id": "p9-hint-3",
      "order": 3,
      "deductionPoints": 30,
      "content": "DRS is available when G <= 1000."
    }
  ],
  "p10": [
    {
      "id": "p10-hint-1",
      "order": 1,
      "deductionPoints": 10,
      "content": "The answer is one of the recorded speeds."
    },
    {
      "id": "p10-hint-2",
      "order": 2,
      "deductionPoints": 20,
      "content": "Maintain the largest value encountered."
    },
    {
      "id": "p10-hint-3",
      "order": 3,
      "deductionPoints": 30,
      "content": "Use a running maximum."
    }
  ],
  "p11": [
    {
      "id": "p11-hint-1",
      "order": 1,
      "deductionPoints": 10,
      "content": "Penalties accumulate independently."
    },
    {
      "id": "p11-hint-2",
      "order": 2,
      "deductionPoints": 20,
      "content": "A running sum is enough."
    },
    {
      "id": "p11-hint-3",
      "order": 3,
      "deductionPoints": 30,
      "content": "Add all N penalty values."
    }
  ],
  "p12": [
    {
      "id": "p12-hint-1",
      "order": 1,
      "deductionPoints": 10,
      "content": "Only the first three positions count as podium places."
    },
    {
      "id": "p12-hint-2",
      "order": 2,
      "deductionPoints": 20,
      "content": "The boundary position is included."
    },
    {
      "id": "p12-hint-3",
      "order": 3,
      "deductionPoints": 30,
      "content": "Print PODIUM exactly when P <= 3."
    }
  ],
  "p13": [
    {
      "id": "p13-hint-1",
      "order": 1,
      "deductionPoints": 10,
      "content": "The radio message is a single token."
    },
    {
      "id": "p13-hint-2",
      "order": 2,
      "deductionPoints": 20,
      "content": "Only one exact word has a special meaning."
    },
    {
      "id": "p13-hint-3",
      "order": 3,
      "deductionPoints": 30,
      "content": "Compare the string with BOX."
    }
  ],
  "p14": [
    {
      "id": "p14-hint-1",
      "order": 1,
      "deductionPoints": 10,
      "content": "Efficiency means distance divided by fuel used."
    },
    {
      "id": "p14-hint-2",
      "order": 2,
      "deductionPoints": 20,
      "content": "Use floating-point division."
    },
    {
      "id": "p14-hint-3",
      "order": 3,
      "deductionPoints": 30,
      "content": "Format the quotient with fixed and setprecision(2)."
    }
  ],
  "p15": [
    {
      "id": "p15-hint-1",
      "order": 1,
      "deductionPoints": 10,
      "content": "Both endpoints of the permitted window are allowed."
    },
    {
      "id": "p15-hint-2",
      "order": 2,
      "deductionPoints": 20,
      "content": "Check the lower and upper bounds."
    },
    {
      "id": "p15-hint-3",
      "order": 3,
      "deductionPoints": 30,
      "content": "The condition is A <= L && L <= B."
    }
  ],
  "p16": [
    {
      "id": "p16-hint-1",
      "order": 1,
      "deductionPoints": 10,
      "content": "The lucky score depends on decimal digits, not the car number itself."
    },
    {
      "id": "p16-hint-2",
      "order": 2,
      "deductionPoints": 20,
      "content": "Repeatedly extract the last digit using % 10."
    },
    {
      "id": "p16-hint-3",
      "order": 3,
      "deductionPoints": 30,
      "content": "Add each last digit and divide N by 10 until it becomes zero."
    }
  ],
  "p17": [
    {
      "id": "p17-hint-1",
      "order": 1,
      "deductionPoints": 10,
      "content": "You need both the whole-second part and the remainder."
    },
    {
      "id": "p17-hint-2",
      "order": 2,
      "deductionPoints": 20,
      "content": "Integer division gives whole seconds."
    },
    {
      "id": "p17-hint-3",
      "order": 3,
      "deductionPoints": 30,
      "content": "Use G/1000 and G%1000."
    }
  ],
  "p18": [
    {
      "id": "p18-hint-1",
      "order": 1,
      "deductionPoints": 10,
      "content": "The order of the two drivers does not matter."
    },
    {
      "id": "p18-hint-2",
      "order": 2,
      "deductionPoints": 20,
      "content": "The result must never be negative."
    },
    {
      "id": "p18-hint-3",
      "order": 3,
      "deductionPoints": 30,
      "content": "Use the absolute difference |A-B|."
    }
  ],
  "p19": [
    {
      "id": "p19-hint-1",
      "order": 1,
      "deductionPoints": 10,
      "content": "Compare rainfall against the wet-track threshold."
    },
    {
      "id": "p19-hint-2",
      "order": 2,
      "deductionPoints": 20,
      "content": "The threshold is inclusive."
    },
    {
      "id": "p19-hint-3",
      "order": 3,
      "deductionPoints": 30,
      "content": "Print WET exactly when R >= W."
    }
  ],
  "p20": [
    {
      "id": "p20-hint-1",
      "order": 1,
      "deductionPoints": 10,
      "content": "A run ends whenever a zero appears."
    },
    {
      "id": "p20-hint-2",
      "order": 2,
      "deductionPoints": 20,
      "content": "Track the current run and the longest run separately."
    },
    {
      "id": "p20-hint-3",
      "order": 3,
      "deductionPoints": 30,
      "content": "Increment on 1, reset on 0, and update the best length."
    }
  ],
  "p21": [
    {
      "id": "p21-hint-1",
      "order": 1,
      "deductionPoints": 20,
      "content": "Every candidate block contains exactly three laps."
    },
    {
      "id": "p21-hint-2",
      "order": 2,
      "deductionPoints": 30,
      "content": "After evaluating the first block, reuse most of its sum."
    },
    {
      "id": "p21-hint-3",
      "order": 3,
      "deductionPoints": 50,
      "content": "Slide the window by adding the next time and removing the oldest; divide the minimum sum by 3."
    }
  ],
  "p22": [
    {
      "id": "p22-hint-1",
      "order": 1,
      "deductionPoints": 20,
      "content": "First compute the total points to determine the average."
    },
    {
      "id": "p22-hint-2",
      "order": 2,
      "deductionPoints": 30,
      "content": "Avoid floating-point comparisons by multiplying both sides by N."
    },
    {
      "id": "p22-hint-3",
      "order": 3,
      "deductionPoints": 50,
      "content": "Count A[i] for which A[i]*N > sum."
    }
  ],
  "p23": [
    {
      "id": "p23-hint-1",
      "order": 1,
      "deductionPoints": 20,
      "content": "All wear values are positive, so extending a window only increases its sum."
    },
    {
      "id": "p23-hint-2",
      "order": 2,
      "deductionPoints": 30,
      "content": "Maintain a window and shrink it whenever its sum exceeds W."
    },
    {
      "id": "p23-hint-3",
      "order": 3,
      "deductionPoints": 50,
      "content": "Use two pointers and record the largest valid window length."
    }
  ],
  "p24": [
    {
      "id": "p24-hint-1",
      "order": 1,
      "deductionPoints": 20,
      "content": "A pair is counted if its relative order changes."
    },
    {
      "id": "p24-hint-2",
      "order": 2,
      "deductionPoints": 30,
      "content": "Map each car ID to its index in the first order."
    },
    {
      "id": "p24-hint-3",
      "order": 3,
      "deductionPoints": 50,
      "content": "Count inversions in the mapped second-order array."
    }
  ],
  "p25": [
    {
      "id": "p25-hint-1",
      "order": 1,
      "deductionPoints": 20,
      "content": "Service cannot overlap, so each car starts no earlier than the previous finish."
    },
    {
      "id": "p25-hint-2",
      "order": 2,
      "deductionPoints": 30,
      "content": "Process requested times in sorted order."
    },
    {
      "id": "p25-hint-3",
      "order": 3,
      "deductionPoints": 50,
      "content": "Update finish = max(finish, request) + 1 for each car."
    }
  ],
  "p26": [
    {
      "id": "p26-hint-1",
      "order": 1,
      "deductionPoints": 20,
      "content": "Many queries ask for sums over contiguous ranges."
    },
    {
      "id": "p26-hint-2",
      "order": 2,
      "deductionPoints": 30,
      "content": "Precompute cumulative sums from the beginning."
    },
    {
      "id": "p26-hint-3",
      "order": 3,
      "deductionPoints": 50,
      "content": "Answer [L,R] with prefix[R] - prefix[L-1]."
    }
  ],
  "p27": [
    {
      "id": "p27-hint-1",
      "order": 1,
      "deductionPoints": 20,
      "content": "Points determine the primary ranking."
    },
    {
      "id": "p27-hint-2",
      "order": 2,
      "deductionPoints": 30,
      "content": "Names resolve ties."
    },
    {
      "id": "p27-hint-3",
      "order": 3,
      "deductionPoints": 50,
      "content": "Sort by points descending, then name ascending."
    }
  ],
  "p28": [
    {
      "id": "p28-hint-1",
      "order": 1,
      "deductionPoints": 20,
      "content": "The circuit wraps after sector N-1."
    },
    {
      "id": "p28-hint-2",
      "order": 2,
      "deductionPoints": 30,
      "content": "The final position depends only on the remainder after division by N."
    },
    {
      "id": "p28-hint-3",
      "order": 3,
      "deductionPoints": 50,
      "content": "Compute (S+K)%N using 64-bit arithmetic."
    }
  ],
  "p29": [
    {
      "id": "p29-hint-1",
      "order": 1,
      "deductionPoints": 20,
      "content": "The chosen events must form one non-empty consecutive block."
    },
    {
      "id": "p29-hint-2",
      "order": 2,
      "deductionPoints": 30,
      "content": "At each position, either extend the previous block or start a new one."
    },
    {
      "id": "p29-hint-3",
      "order": 3,
      "deductionPoints": 50,
      "content": "Use Kadane's recurrence: current=max(x,current+x), and track the global maximum."
    }
  ],
  "p30": [
    {
      "id": "p30-hint-1",
      "order": 1,
      "deductionPoints": 20,
      "content": "Pit stops are intervals that may overlap."
    },
    {
      "id": "p30-hint-2",
      "order": 2,
      "deductionPoints": 30,
      "content": "Represent each start as +1 and each end as -1."
    },
    {
      "id": "p30-hint-3",
      "order": 3,
      "deductionPoints": 50,
      "content": "Sort events by time; process end events before starts at equal times for [S,E) intervals."
    }
  ],
  "p31": [
    {
      "id": "p31-hint-1",
      "order": 1,
      "deductionPoints": 20,
      "content": "Roads have positive travel times, so a greedy shortest-path algorithm applies."
    },
    {
      "id": "p31-hint-2",
      "order": 2,
      "deductionPoints": 30,
      "content": "Keep the best known distance to each junction."
    },
    {
      "id": "p31-hint-3",
      "order": 3,
      "deductionPoints": 50,
      "content": "Use Dijkstra's algorithm with a min-priority queue."
    }
  ],
  "p32": [
    {
      "id": "p32-hint-1",
      "order": 1,
      "deductionPoints": 20,
      "content": "The subsequence need not use adjacent laps."
    },
    {
      "id": "p32-hint-2",
      "order": 2,
      "deductionPoints": 30,
      "content": "Maintain the smallest possible ending speed for each subsequence length."
    },
    {
      "id": "p32-hint-3",
      "order": 3,
      "deductionPoints": 50,
      "content": "Use lower_bound to update the tails array for a strictly increasing subsequence."
    }
  ],
  "p33": [
    {
      "id": "p33-hint-1",
      "order": 1,
      "deductionPoints": 30,
      "content": "A state must remember the chosen compound and its current consecutive-use count."
    },
    {
      "id": "p33-hint-2",
      "order": 2,
      "deductionPoints": 50,
      "content": "The count can only be 1 or 2; switching compound resets it to 1."
    },
    {
      "id": "p33-hint-3",
      "order": 3,
      "deductionPoints": 70,
      "content": "Use four DP states: A-run-1, A-run-2, B-run-1, B-run-2."
    }
  ],
  "p34": [
    {
      "id": "p34-hint-1",
      "order": 1,
      "deductionPoints": 30,
      "content": "Aggressive and safe are the two choices for each race."
    },
    {
      "id": "p34-hint-2",
      "order": 2,
      "deductionPoints": 50,
      "content": "An aggressive choice is allowed only if the previous race was safe."
    },
    {
      "id": "p34-hint-3",
      "order": 3,
      "deductionPoints": 70,
      "content": "Maintain the best total ending safe and ending aggressive."
    }
  ],
  "p35": [
    {
      "id": "p35-hint-1",
      "order": 1,
      "deductionPoints": 30,
      "content": "A stop at lap i can follow a stop no more than K laps earlier."
    },
    {
      "id": "p35-hint-2",
      "order": 2,
      "deductionPoints": 50,
      "content": "The transition needs the minimum dp value in a sliding range."
    },
    {
      "id": "p35-hint-3",
      "order": 3,
      "deductionPoints": 70,
      "content": "Use a monotonic deque to maintain the minimum of dp[i-K..i-1]."
    }
  ]
}
