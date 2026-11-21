// ==============================================================================
// CODE GRAND PRIX 2026 — SEED DATA DEFINITIONS (SINGLE SOURCE OF TRUTH)
// ==============================================================================

import { Role, Difficulty, ContestStatus } from "@prisma/client";

export const SEED_DATA = {
  contest: {
    id: "cgp_2026",
    title: "Code Grand Prix 2026",
    status: ContestStatus.LIVE,
    resultsVisible: true,
    startsAt: new Date(Date.now() - 30 * 60 * 1000), // Started 30 mins ago
    endsAt: new Date(Date.now() + 90 * 60 * 1000) // Ends in 90 mins
  },
  users: [
    // Frontend demo accounts matching Saksham's mock
    {
      driverId: "CGP2026",
      password: "Race2026!",
      displayName: "Demo Driver",
      team: "CPC / Preview grid",
      role: Role.CANDIDATE
    },
    {
      driverId: "VOLUNTEER2026",
      password: "Marshal2026!",
      displayName: "Demo Marshal",
      team: "CPC / Race control",
      role: Role.VOLUNTEER
    },
    {
      driverId: "ADMIN2026",
      password: "Control2026!",
      displayName: "Demo Organizer",
      team: "CPC / Administration",
      role: Role.ADMIN
    },
    // Standard driver accounts
    {
      driverId: "CGP_045",
      password: "driver123",
      displayName: "Lewis Hamilton",
      team: "Mercedes AMG",
      role: Role.CANDIDATE
    },
    {
      driverId: "CGP_016",
      password: "driver123",
      displayName: "Charles Leclerc",
      team: "Scuderia Ferrari",
      role: Role.CANDIDATE
    },
    {
      driverId: "CGP_001",
      password: "driver123",
      displayName: "Max Verstappen",
      team: "Red Bull Racing",
      role: Role.CANDIDATE
    },
    {
      driverId: "VOL_RACE_CONTROL",
      password: "racecontrol2026",
      displayName: "Race Director Charlie",
      team: "FIA Race Control",
      role: Role.VOLUNTEER
    }
  ],
  problems: [
    {
      slug: "speed-trap-detection",
      title: "Speed Trap Detection",
      difficulty: Difficulty.EASY,
      points: 100,
      order: 1,
      revision: 1,
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      allowedLanguages: ["python", "javascript", "cpp", "java"],
      statement: `### Speed Trap Detection

Formula 1 telemetry systems monitor car velocities across designated speed trap sectors.
Given a speed limit $S$ (in km/h) and a series of $N$ recorded velocities from sector sensors, determine how many times a car violated the speed limit, and the maximum recorded speed.

#### Input Format
- First line contains two integers $N$ and $S$: the number of speed readings and the speed limit.
- Second line contains $N$ space-separated integers representing the car's speeds $v_1, v_2, \\dots, v_N$.

#### Output Format
- Print two space-separated integers: the count of speed limit violations, and the maximum speed recorded.`,
      inputFormat: "N S\\nv1 v2 ... vN",
      outputFormat: "violations maxSpeed",
      constraints: "1 <= N <= 10^5\n50 <= S <= 400\n0 <= vi <= 450",
      hints: [
        {
          id: "hint-speed-1",
          order: 1,
          deductionPoints: 10,
          content: "Iterate through speeds and compare each speed strictly greater than S while keeping track of the running maximum."
        }
      ],
      testCases: [
        {
          input: "5 320\n310 325 330 315 340",
          expectedOutput: "3 340",
          isPublic: true,
          explanation: "Speeds 325, 330, and 340 exceed 320. Maximum speed is 340."
        },
        {
          input: "4 300\n280 290 295 300",
          expectedOutput: "0 300",
          isPublic: true,
          explanation: "No speed strictly exceeds 300. Max is 300."
        },
        {
          input: "3 350\n351 352 353",
          expectedOutput: "3 353",
          isPublic: false
        },
        {
          input: "6 250\n100 200 250 251 249 260",
          expectedOutput: "2 260",
          isPublic: false
        }
      ]
    },
    {
      slug: "pit-stop-optimization",
      title: "Pit Stop Strategy Optimization",
      difficulty: Difficulty.MEDIUM,
      points: 250,
      order: 2,
      revision: 1,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      allowedLanguages: ["python", "javascript", "cpp", "java"],
      statement: `### Pit Stop Strategy Optimization

A race team needs to choose optimal pit stop laps.
Given a race of $T$ laps and tire degradation data, calculating the minimum total race time given tire wear rates and a fixed pit stop penalty $P$ seconds.

For this simplified simulation:
You are given $N$ lap times $t_1, t_2, \\dots, t_N$ without a pit stop. If a pit stop is taken at lap $k$, it costs $P$ penalty seconds but reduces each subsequent lap time by $D$ seconds.
Calculate the minimum total race time achievable with at most one pit stop.

#### Input Format
- First line contains three integers $N$, $P$, and $D$.
- Second line contains $N$ integers representing baseline lap times.

#### Output Format
- A single integer representing the minimum total race time in seconds.`,
      inputFormat: "N P D\\nt1 t2 ... tN",
      outputFormat: "minTotalTime",
      constraints: "1 <= N <= 10^5\n1 <= P <= 10^4\n1 <= D <= 50",
      hints: [
        {
          id: "hint-pit-1",
          order: 1,
          deductionPoints: 25,
          content: "Calculate the base sum first, then evaluate the net savings for each possible pit lap k."
        }
      ],
      testCases: [
        {
          input: "5 20 5\n90 92 95 98 100",
          expectedOutput: "475",
          isPublic: true,
          explanation: "No pit stop gives total 475. Taking a pit stop does not improve overall time."
        },
        {
          input: "4 10 10\n100 100 100 100",
          expectedOutput: "380",
          isPublic: true,
          explanation: "Pit stop after lap 1 saves 10s for laps 2, 3, 4 (30s saved) with 10s penalty = 20s net savings -> 380s."
        },
        {
          input: "3 50 5\n80 80 80",
          expectedOutput: "240",
          isPublic: false
        },
        {
          input: "5 5 15\n100 100 100 100 100",
          expectedOutput: "445",
          isPublic: false
        }
      ]
    },
    {
      slug: "aerodynamic-downforce-path",
      title: "Optimal Aerodynamic Racing Line",
      difficulty: Difficulty.HARD,
      points: 500,
      order: 3,
      revision: 1,
      timeLimitMs: 3000,
      memoryLimitMb: 512,
      allowedLanguages: ["python", "javascript", "cpp", "java"],
      statement: `### Optimal Aerodynamic Racing Line

A race track grid has dimensions $R \\times C$. Each cell $(r, c)$ has a surface grip coefficient $G(r, c)$.
A car starts at top-left $(0, 0)$ and must reach bottom-right $(R-1, C-1)$ moving only right or down.
Find the path that maximizes the total grip collected.

#### Input Format
- First line contains two integers $R$ and $C$.
- The next $R$ lines each contain $C$ space-separated integers.

#### Output Format
- Print the maximum sum of grip along any valid path from $(0, 0)$ to $(R-1, C-1)$.`,
      inputFormat: "R C\\nRow 1\\n...\\nRow R",
      outputFormat: "maxGrip",
      constraints: "1 <= R, C <= 1000\n0 <= G(r, c) <= 1000",
      hints: [],
      testCases: [
        {
          input: "3 3\n1 3 1\n1 5 1\n4 2 1",
          expectedOutput: "12",
          isPublic: true,
          explanation: "Path (0,0)->(0,1)->(1,1)->(2,1)->(2,2) with grip 1 + 3 + 5 + 2 + 1 = 12."
        },
        {
          input: "2 2\n5 10\n15 20",
          expectedOutput: "40",
          isPublic: true,
          explanation: "Path 5 -> 15 -> 20 gives 40."
        },
        {
          input: "1 4\n10 20 30 40",
          expectedOutput: "100",
          isPublic: false
        },
        {
          input: "3 1\n10\n20\n30",
          expectedOutput: "60",
          isPublic: false
        }
      ]
    }
  ]
};
