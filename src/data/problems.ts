import type { Problem } from '../types/arena'

// Public demonstration statements and public examples only. These are not official contest problems.
export const mockProblems: Problem[] = [
  {
    allowedLanguages: ['python','java','cpp','javascript'], id: 'p1', number: 1, title: 'Fastest Route', difficulty: 'Easy', points: 100,
    timeLimitMs: 2000, memoryLimitMb: 256,
    statement: ['Race control has mapped a circuit as a directed network of checkpoints. Each road connects two checkpoints and takes a positive number of seconds to travel.', 'Find the minimum travel time from the starting checkpoint s to the finish checkpoint t. If the finish cannot be reached, print -1. A road can be used more than once, and there can be multiple roads between the same checkpoints.'],
    inputFormat: ['The first line contains n, m, s and t: checkpoints, roads, start and finish.', 'Each of the next m lines contains u, v and w, describing a directed road from u to v with travel time w.'],
    outputFormat: 'Print the minimum travel time from s to t, or -1 if no route exists.',
    constraints: ['2 â‰¤ n â‰¤ 100,000', '1 â‰¤ m â‰¤ 200,000', '1 â‰¤ u, v, s, t â‰¤ n', '1 â‰¤ w â‰¤ 1,000,000', 'Use a 64-bit integer for total travel time.'],
    samples: [
      { id: 'sample-1', input: '4 4 1 4\n1 2 3\n2 4 4\n1 3 2\n3 4 9', output: '7', explanation: 'The route 1 â†’ 2 â†’ 4 takes 3 + 4 = 7 seconds.' },
      { id: 'sample-2', input: '3 1 1 3\n1 2 5', output: '-1', explanation: 'There is no directed route from checkpoint 1 to checkpoint 3.' },
    ],
    expectedTimeComplexity: 'O((n + m) log n)', expectedSpaceComplexity: 'O(n + m)',
  },
  {
    allowedLanguages: ['python','java','cpp','javascript'], id: 'p2', number: 2, title: 'Pit Stop Planning', difficulty: 'Medium', points: 150,
    timeLimitMs: 1000, memoryLimitMb: 128,
    statement: ['You are given n available pit stops and the time required at each pit. Your race strategy requires exactly k distinct stops.', 'Determine the minimum total time spent in the pits. Each pit can be chosen at most once, and the order of the chosen stops does not affect their total time.'],
    inputFormat: ['The first line contains two integers n and k.', 'The second line contains n space-separated integers denoting the time at each pit.'],
    outputFormat: 'Print one integer: the smallest possible total time for exactly k pit stops.',
    constraints: ['1 â‰¤ k â‰¤ n â‰¤ 100,000', '1 â‰¤ pit time â‰¤ 1,000,000,000', 'The total time may require a 64-bit integer.'],
    samples: [
      { id: 'sample-1', input: '5 2\n4 2 7 1 3', output: '3', explanation: 'Choose the pits taking 1 and 2 units of time. Their total is 3.' },
      { id: 'sample-2', input: '3 3\n5 5 2', output: '12', explanation: 'All three stops are required, so the total is 5 + 5 + 2 = 12.' },
    ],
    expectedTimeComplexity: 'O(n log n) or better', expectedSpaceComplexity: 'O(n) or better',
  },
  {
    allowedLanguages: ['python','java','cpp','javascript'], id: 'p3', number: 3, title: 'Lap Optimizer', difficulty: 'Medium', points: 150,
    timeLimitMs: 1500, memoryLimitMb: 128,
    statement: ['Your telemetry contains the positive duration of each of n consecutive laps. You have a replay budget of b time units.', 'Find the maximum number of consecutive laps whose total duration does not exceed b. Print 0 if no single lap fits within the budget.'],
    inputFormat: ['The first line contains n and the time budget b.', 'The second line contains n positive integers: the duration of each lap in chronological order.'],
    outputFormat: 'Print the largest number of consecutive laps that fit within the time budget.',
    constraints: ['1 â‰¤ n â‰¤ 200,000', '1 â‰¤ b â‰¤ 1,000,000,000,000', '1 â‰¤ lap duration â‰¤ 1,000,000,000', 'Lap order must not be changed.'],
    samples: [
      { id: 'sample-1', input: '6 9\n2 1 5 1 2 3', output: '4', explanation: 'Laps 2 through 5 take 1 + 5 + 1 + 2 = 9 time units.' },
      { id: 'sample-2', input: '3 2\n4 5 3', output: '0', explanation: 'Every lap exceeds the budget.' },
    ],
    expectedTimeComplexity: 'O(n)', expectedSpaceComplexity: 'O(n) or better',
  },
  {
    allowedLanguages: ['python','java','cpp','javascript'], id: 'p4', number: 4, title: 'Overtake Strategy', difficulty: 'Hard', points: 200,
    timeLimitMs: 2000, memoryLimitMb: 256,
    statement: ['Drivers are listed in their current track order. Each driver has a unique target rank from 1 to n. An overtake swaps two adjacent drivers.', 'Find the minimum number of adjacent overtakes needed to put the drivers into increasing target-rank order.'],
    inputFormat: ['The first line contains n, the number of drivers.', 'The second line contains a permutation of the integers 1 through n representing current track order.'],
    outputFormat: 'Print the minimum number of adjacent overtakes needed to reach the target order.',
    constraints: ['1 â‰¤ n â‰¤ 200,000', 'Each rank from 1 to n occurs exactly once.', 'The answer may require a 64-bit integer.'],
    samples: [
      { id: 'sample-1', input: '5\n2 1 3 5 4', output: '2', explanation: 'Swap drivers ranked 2 and 1, then drivers ranked 5 and 4.' },
      { id: 'sample-2', input: '4\n1 2 3 4', output: '0', explanation: 'The drivers are already in target order.' },
    ],
    expectedTimeComplexity: 'O(n log n)', expectedSpaceComplexity: 'O(n)',
  },
]
