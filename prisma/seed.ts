// ==============================================================================
// CODE GRAND PRIX 2026 — DATABASE SEED SCRIPT
// ==============================================================================

import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SEED_DATA } from "../src/data/seed-data.js";

const prisma = new PrismaClient();

export async function seed() {
  console.log("🌱 Starting Code Grand Prix database seed...");

  // 1. Seed Contest
  const contest = await prisma.contest.upsert({
    where: { id: SEED_DATA.contest.id },
    update: {
      status: SEED_DATA.contest.status,
      startsAt: SEED_DATA.contest.startsAt,
      endsAt: SEED_DATA.contest.endsAt
    },
    create: {
      id: SEED_DATA.contest.id,
      title: SEED_DATA.contest.title,
      status: SEED_DATA.contest.status,
      startsAt: SEED_DATA.contest.startsAt,
      endsAt: SEED_DATA.contest.endsAt
    }
  });
  console.log(`✅ Seeded contest: ${contest.title} (${contest.id})`);

  // 2. Seed Users
  for (const user of SEED_DATA.users) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(user.password, salt);

    const createdUser = await prisma.user.upsert({
      where: { driverId: user.driverId },
      update: {
        displayName: user.displayName,
        role: user.role,
        passwordHash
      },
      create: {
        driverId: user.driverId,
        displayName: user.displayName,
        role: user.role,
        passwordHash
      }
    });

    // Also initialize default Session for participants
    if (user.role === Role.PARTICIPANT) {
      await prisma.session.upsert({
        where: {
          userId_contestId: {
            userId: createdUser.id,
            contestId: contest.id
          }
        },
        update: {},
        create: {
          userId: createdUser.id,
          contestId: contest.id
        }
      });
    }

    console.log(`✅ Seeded user: ${user.driverId} [${user.role}] - Pass: ${user.password}`);
  }

  // 3. Seed Problems and Test Cases
  for (const problem of SEED_DATA.problems) {
    const createdProblem = await prisma.problem.upsert({
      where: { slug: problem.slug },
      update: {
        title: problem.title,
        difficulty: problem.difficulty,
        points: problem.points,
        statement: problem.statement,
        inputFormat: problem.inputFormat,
        outputFormat: problem.outputFormat,
        constraints: problem.constraints,
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb,
        allowedLanguages: problem.allowedLanguages
      },
      create: {
        contestId: contest.id,
        slug: problem.slug,
        title: problem.title,
        difficulty: problem.difficulty,
        points: problem.points,
        statement: problem.statement,
        inputFormat: problem.inputFormat,
        outputFormat: problem.outputFormat,
        constraints: problem.constraints,
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb,
        allowedLanguages: problem.allowedLanguages
      }
    });

    // Remove old test cases and re-create
    await prisma.testCase.deleteMany({ where: { problemId: createdProblem.id } });

    for (let i = 0; i < problem.testCases.length; i++) {
      const tc = problem.testCases[i];
      await prisma.testCase.create({
        data: {
          problemId: createdProblem.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isPublic: tc.isPublic,
          explanation: tc.explanation || null,
          order: i + 1
        }
      });
    }

    console.log(`✅ Seeded problem: ${problem.title} (${problem.difficulty}) with ${problem.testCases.length} test cases.`);
  }

  console.log("🏁 Database seeding completed successfully!");
}

if (process.argv[1]?.endsWith("seed.ts")) {
  seed()
    .catch((e) => {
      console.error("❌ Seeding failed:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
