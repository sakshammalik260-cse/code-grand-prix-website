// ==============================================================================
// CODE GRAND PRIX 2026 — DATABASE SEED SCRIPT
// ==============================================================================
import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SEED_DATA } from "../src/data/seed-data.js";

const prisma = new PrismaClient();

export async function seed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed published demo credentials into production.");
  }
  console.log("🌱 Starting Code Grand Prix database seed...");

  const database = new URL(process.env.DATABASE_URL ?? "");
  if (!["postgres:", "postgresql:"].includes(database.protocol) ||
      !["localhost", "127.0.0.1", "[::1]"].includes(database.hostname)) {
    throw new Error("Demo seeding requires a local PostgreSQL database.");
  }

  // 1. Seed Contest
  const contest = await prisma.contest.upsert({
    where: { id: SEED_DATA.contest.id },
    update: {},
    create: {
      id: SEED_DATA.contest.id,
      title: SEED_DATA.contest.title,
      status: SEED_DATA.contest.status,
      resultsVisible: SEED_DATA.contest.resultsVisible,
      startsAt: SEED_DATA.contest.startsAt,
      endsAt: SEED_DATA.contest.endsAt
    }
  });
  console.log(`✅ Seeded contest: ${contest.title} (${contest.id})`);

  await prisma.competitionRound.upsert({
    where: { id: contest.id },
    update: {},
    create: {
      id: contest.id,
      contestId: contest.id,
      title: "Round 1",
      status: contest.status,
      startsAt: contest.startsAt,
      endsAt: contest.endsAt,
      resultsVisible: contest.resultsVisible
    }
  });

  // 2. Seed Users
  for (const user of SEED_DATA.users) {
    const existing = await prisma.user.findUnique({ where: { driverId: user.driverId } });
    const passwordHash = existing && await bcrypt.compare(user.password, existing.passwordHash)
      ? existing.passwordHash
      : await bcrypt.hash(user.password, 10);

    const createdUser = await prisma.user.upsert({
      where: { driverId: user.driverId },
      update: {
        team: existing?.team ?? user.team,
        displayName: user.displayName,
        role: user.role,
        passwordHash
      },
      create: {
        driverId: user.driverId,
        team: user.team,
        displayName: user.displayName,
        role: user.role,
        passwordHash
      }
    });

    // Also initialize default Session for participants
    if (user.role === Role.CANDIDATE || user.role === Role.PARTICIPANT) {
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

    console.log(`✅ Seeded user: ${user.driverId} [${user.role}]`);
  }

  // 3. Seed Problems and Test Cases
  for (const problem of SEED_DATA.problems) {
    const createdProblem = await prisma.problem.upsert({
      where: { slug: problem.slug },
      update: {
        title: problem.title,
        difficulty: problem.difficulty,
        points: problem.points,
        order: problem.order,
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
        roundId: contest.id,
        slug: problem.slug,
        title: problem.title,
        difficulty: problem.difficulty,
        points: problem.points,
        order: problem.order,
        statement: problem.statement,
        inputFormat: problem.inputFormat,
        outputFormat: problem.outputFormat,
        constraints: problem.constraints,
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb,
        allowedLanguages: problem.allowedLanguages
      }
    });

    await prisma.$transaction(async (tx) => {
      const existing = await tx.testCase.findMany({
        where: { problemId: createdProblem.id },
        orderBy: [{ order: "asc" }, { id: "asc" }]
      });
      for (const [index, tc] of problem.testCases.entries()) {
        const data = {
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isPublic: tc.isPublic,
          explanation: tc.explanation ?? null,
          order: index + 1
        };
        const prior = existing.find(row => row.order === data.order);
        if (prior) {
          await tx.testCase.update({ where: { id: prior.id }, data });
        } else {
          await tx.testCase.create({ data: { ...data, problemId: createdProblem.id } });
        }
      }

      for (const { id, ...data } of problem.hints) {
        const prior = await tx.hint.findUnique({ where: { id }, select: { problemId: true } });
        if (prior && prior.problemId !== createdProblem.id) {
          throw new Error("Seed hint already belongs to a different problem.");
        }
        await tx.hint.upsert({
          where: { id },
          update: data,
          create: { id, ...data, problemId: createdProblem.id }
        });
      }
    });

    console.log(`✅ Seeded problem: ${problem.title} (${problem.difficulty}) with ${problem.testCases.length} test cases.`);
  }

  console.log("🏁 Database seeding completed successfully!");
}

if (process.argv[1]?.endsWith("seed.ts")) {
  seed()
    .catch(() => {
      console.error("❌ Seeding failed. Check the database connection and migrations.");
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
