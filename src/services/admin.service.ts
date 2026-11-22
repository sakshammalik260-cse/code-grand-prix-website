import { randomUUID } from "node:crypto";
import { Difficulty, Prisma, type Hint, type TestCase } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { ERROR_CODES } from "../constants/index.js";
import { AppError } from "../middleware/error.middleware.js";
import { RoundService } from "./round.service.js";
import type { caseSchema, createProblemSchema, editProblemSchema, hintSchema, publishSchema } from "../controllers/admin.schemas.js";

type NewProblem = z.output<typeof createProblemSchema>;
type EditProblem = z.output<typeof editProblemSchema>;
type CaseInput = z.output<typeof caseSchema>;
type HintInput = z.output<typeof hintSchema>;

const details = {
  testCases: { where: { isPublic: true }, orderBy: [{ order: "asc" }, { id: "asc" }] },
  hints: { orderBy: [{ order: "asc" }, { id: "asc" }] }
} satisfies Prisma.ProblemInclude;
type Question = Prisma.ProblemGetPayload<{ include: typeof details }>;
const languagesOrder = (values: string[]) => [...values].sort().join(",");

function invalid(message: string) { return new AppError(400, ERROR_CODES.VALIDATION_ERROR, message); }
function conflict(message: string) { return new AppError(409, ERROR_CODES.VALIDATION_ERROR, message); }
function missing(message: string) { return new AppError(404, ERROR_CODES.RESOURCE_NOT_FOUND, message); }

function hintDto(hint: Hint) {
  return { id: hint.id, order: hint.order, deductionPoints: hint.deductionPoints, content: hint.content };
}

function questionDto(question: Question) {
  const lines = (value: string) => value.split(/\n\n+/).filter(line => line.trim());
  return {
    id: question.id, slug: question.slug, contestId: question.contestId, roundId: question.roundId,
    number: question.order, order: question.order, title: question.title,
    revision: question.revision, status: question.status === "SCHEDULED" && question.publishAt && question.publishAt <= new Date() ? "PUBLISHED" : question.status, publishAt: question.publishAt,
    difficulty: question.difficulty === "EASY" ? "Easy" : question.difficulty === "HARD" ? "Hard" : "Medium",
    points: question.points, statement: lines(question.statement), inputFormat: lines(question.inputFormat),
    outputFormat: question.outputFormat, constraints: lines(question.constraints),
    samples: question.testCases.map(test => ({ id: test.id, input: test.input,
      output: test.expectedOutput, explanation: test.explanation ?? "" })),
    timeLimitMs: question.timeLimitMs, memoryLimitMb: question.memoryLimitMb, allowedLanguages: question.allowedLanguages,
    expectedTimeComplexity: question.expectedTimeComplexity ?? "", expectedSpaceComplexity: question.expectedSpaceComplexity ?? "",
    hints: question.hints.map(hintDto)
  };
}

function caseDto(test: TestCase) {
  return {
    id: test.id, problemId: test.problemId, isPublic: test.isPublic,
    visibility: test.isPublic ? "PUBLIC" : "HIDDEN", weight: test.weight,
    ...(test.isPublic ? { input: test.input, expectedOutput: test.expectedOutput } : {})
  };
}

export async function adminTransaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>, serializable = false): Promise<T> {
  try {
    return await prisma.$transaction(work, serializable ? { isolationLevel: "Serializable" } : undefined);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2003", "P2034"].includes(error.code)) {
      throw conflict("The requested change conflicts with existing records or a concurrent update. Refresh and retry.");
    }
    throw error;
  }
}

async function lockQuestion(tx: Prisma.TransactionClient, id: string, expected?: number) {
  // Serialize all changes to this question and any persisted judging activity.
  await tx.$queryRaw`SELECT id FROM problems WHERE id = ${id} AND "contestId" = ${env.CONTEST_ID} FOR UPDATE`;
  const question = await tx.problem.findFirst({ where: { id, contestId: env.CONTEST_ID }, include: details });
  if (!question) throw missing("Question not found.");
  if (expected !== undefined && question.revision !== expected) throw conflict("Question revision changed. Refresh before editing.");
  return question;
}

async function verifyRound(tx: Prisma.TransactionClient, id?: string | null) {
  if (id && !await tx.competitionRound.findFirst({ where: { id, contestId: env.CONTEST_ID } })) {
    throw missing("Round not found.");
  }
}

async function history(tx: Prisma.TransactionClient, id: string) {
  const [submissions, receipts, drafts] = await Promise.all([
    tx.submission.count({ where: { problemId: id } }),
    tx.hintReceipt.count({ where: { problemId: id } }),
    tx.draft.count({ where: { problemId: id } })
  ]);
  return { submissions, receipts, drafts };
}

async function nextOrder(tx: Prisma.TransactionClient, roundId: string | null) {
  const { _max } = await tx.problem.aggregate({ where: { contestId: env.CONTEST_ID, roundId }, _max: { order: true } });
  return (_max.order ?? 0) + 1;
}

function validateHints(hints: HintInput[], points: number) {
  if (new Set(hints.map(hint => hint.order)).size !== hints.length ||
      new Set(hints.flatMap(hint => hint.id ? [hint.id] : [])).size !== hints.filter(hint => hint.id).length ||
      hints.some(hint => hint.deductionPoints > points)) {
    throw invalid("Hint IDs and orders must be distinct and deductions must fit the question value.");
  }
}

async function syncHints(tx: Prisma.TransactionClient, question: Question, input: HintInput[], points = question.points) {
  validateHints(input, points);
  const purchased = new Set((await tx.hintReceipt.findMany({
    where: { problemId: question.id }, distinct: ["hintId"], select: { hintId: true }
  })).map(row => row.hintId));
  for (const old of question.hints) {
    const next = input.find(hint => hint.id === old.id);
    if (purchased.has(old.id) && (!next || next.content !== old.content || next.deductionPoints !== old.deductionPoints)) {
      throw conflict("A hint with purchase receipts cannot be removed, repriced, or rewritten.");
    }
    if (!next) await tx.hint.delete({ where: { id: old.id } });
  }
  for (const { id, ...data } of input) {
    if (id && question.hints.some(hint => hint.id === id)) await tx.hint.update({ where: { id }, data });
    else await tx.hint.create({ data: { ...data, problemId: question.id } });
  }
}

function sampleRows(samples: NonNullable<NewProblem["samples"]>) {
  return samples.map((sample, index) => ({ input: sample.input, expectedOutput: sample.output,
    explanation: sample.explanation, isPublic: true, order: index + 1 }));
}

export class QuestionAdminService {
  static async list() {
    const questions = await prisma.problem.findMany({ where: { contestId: env.CONTEST_ID },
      orderBy: [{ order: "asc" }, { id: "asc" }], include: details });
    return questions.map(questionDto);
  }

  static async get(id: string) {
    const question = await prisma.problem.findFirst({ where: { id, contestId: env.CONTEST_ID }, include: details });
    if (!question) throw missing("Question not found.");
    return questionDto(question);
  }

  static create(input: NewProblem) {
    return adminTransaction(async tx => {
      const { samples = [], hints = [], order, roundId = null, difficulty, ...fields } = input;
      await verifyRound(tx, roundId);
      validateHints(hints, input.points);
      const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "question-" + randomUUID();
      const question = await tx.problem.create({
        data: { ...fields, slug, difficulty: difficulty.toUpperCase() as Difficulty, contestId: env.CONTEST_ID,
          roundId, order: order ?? await nextOrder(tx, roundId), status: "DRAFT",
          testCases: { create: sampleRows(samples) },
          hints: { create: hints.map(({ id: _clientId, ...hint }) => hint) } },
        include: details
      });
      return questionDto(question);
    });
  }

  static edit(id: string, input: EditProblem) {
    return adminTransaction(async tx => {
      const { expectedRevision, samples, hints, roundId, difficulty, ...fields } = input;
      const question = await lockQuestion(tx, id, expectedRevision);
      if (question.status !== "DRAFT") throw conflict("Unpublish this question before editing.");
      await verifyRound(tx, roundId);
      const activity = await history(tx, id);
      const changedRound = roundId !== undefined && roundId !== question.roundId;
      if ((activity.receipts || activity.submissions) && (changedRound ||
          fields.points !== undefined && fields.points !== question.points ||
          fields.timeLimitMs !== undefined && fields.timeLimitMs !== question.timeLimitMs ||
          fields.memoryLimitMb !== undefined && fields.memoryLimitMb !== question.memoryLimitMb ||
          fields.allowedLanguages && languagesOrder(fields.allowedLanguages) !== languagesOrder(question.allowedLanguages))) {
        throw conflict("Round and scoring settings are protected by existing submissions or hint receipts.");
      }

      if (samples) {
        const next = sampleRows(samples);
        const same = next.length === question.testCases.length && next.every((test, index) => {
          const previous = question.testCases[index];
          return test.input === previous.input && test.expectedOutput === previous.expectedOutput &&
            (test.explanation || "") === (previous.explanation || "");
        });
        if (!same) {
          if (activity.submissions) throw conflict("Judged test cases are protected by existing submissions.");
          const retained = new Set<string>();
          for (const [index, sample] of samples.entries()) {
            const existing = question.testCases.find(test => test.id === sample.id);
            if (existing) {
              if (retained.has(existing.id)) throw invalid("Sample IDs must be distinct.");
              retained.add(existing.id);
              await tx.testCase.update({ where: { id: existing.id }, data: {
                ...next[index], explanation: next[index].explanation ?? null
              } });
            } else {
              await tx.testCase.create({ data: { ...next[index], problemId: id } });
            }
          }
          const removed = question.testCases.filter(test => !retained.has(test.id)).map(test => test.id);
          await tx.testCase.deleteMany({ where: { problemId: id, isPublic: true, id: { in: removed } } });
        }
      }
      if (hints) await syncHints(tx, question, hints, fields.points ?? question.points);
      else validateHints(question.hints, fields.points ?? question.points);
      return questionDto(await tx.problem.update({ where: { id }, data: {
        ...fields, roundId, difficulty: difficulty?.toUpperCase() as Difficulty | undefined,
        ...(changedRound && fields.order === undefined ? { order: await nextOrder(tx, roundId ?? null) } : {}),
        revision: { increment: 1 }
      }, include: details }));
    });
  }

  static publish(id: string, request: z.output<typeof publishSchema>) {
    return adminTransaction(async tx => {
      const question = await lockQuestion(tx, id, request.expectedRevision);
      if (question.status !== "DRAFT") throw conflict("Only a draft can be published.");
      if (!question.roundId) throw invalid("Assign the question to a round before publishing.");
      const round = await tx.competitionRound.findUniqueOrThrow({ where: { id: question.roundId } });
      if (round.status === "FINISHED" || round.status === "ENDED" || round.endsAt <= new Date()) throw conflict("The assigned round has finished.");
      const hidden = await tx.testCase.count({ where: { problemId: id, isPublic: false } });
      if (![question.statement, question.inputFormat, question.outputFormat, question.constraints].every(value => value.trim()) ||
          !question.testCases.length || question.testCases.some(test => !test.expectedOutput.trim()) || !hidden) {
        throw invalid("Complete the problem text, public samples and at least one hidden judging case before publishing.");
      }
      const publishAt = request.publishAt ? new Date(request.publishAt) : null;
      if (publishAt && publishAt >= round.endsAt) throw invalid("Publication must occur before the round ends.");
      const status = publishAt && publishAt > new Date() ? "SCHEDULED" : "PUBLISHED";
      return questionDto(await tx.problem.update({ where: { id }, data: {
        status, publishAt, revision: { increment: 1 }
      }, include: details }));
    });
  }

  static unpublish(id: string, expected?: number) {
    return adminTransaction(async tx => {
      await lockQuestion(tx, id, expected);
      return questionDto(await tx.problem.update({ where: { id }, data: {
        status: "DRAFT", publishAt: null, revision: { increment: 1 }
      }, include: details }));
    });
  }

  static remove(id: string, expected: number) {
    return adminTransaction(async tx => {
      const question = await lockQuestion(tx, id, expected);
      const activity = await history(tx, id);
      if (question.status !== "DRAFT" || activity.submissions || activity.receipts || activity.drafts) {
        throw conflict("Only drafts without submissions, purchased hints, or saved code can be deleted.");
      }
      await tx.problem.delete({ where: { id } });
    });
  }

  static async cases(id: string) {
    await this.get(id);
    return (await prisma.testCase.findMany({ where: { problemId: id }, orderBy: [{ order: "asc" }, { id: "asc" }] })).map(caseDto);
  }

  static changeCase(target: { problemId: string } | { caseId: string }, input?: CaseInput) {
    return adminTransaction(async tx => {
      const old = "caseId" in target ? await tx.testCase.findUnique({ where: { id: target.caseId } }) : null;
      const problemId = "problemId" in target ? target.problemId : old?.problemId;
      if (!problemId) throw missing("Test case not found.");
      const question = await lockQuestion(tx, problemId, input?.expectedRevision);
      if (question.status !== "DRAFT" || await tx.submission.count({ where: { problemId } })) {
        throw conflict("Test cases can only change on a draft without submissions.");
      }
      if (old && !await tx.testCase.findUnique({ where: { id: old.id } })) throw missing("Test case not found.");
      if (!input && old) {
        await tx.testCase.delete({ where: { id: old.id } });
        await tx.problem.update({ where: { id: problemId }, data: { revision: { increment: 1 } } });
        return;
      }
      if (!input) throw invalid("Test case content is required.");
      const data = {
        input: input.input, expectedOutput: input.expectedOutput,
        isPublic: input.visibility ? input.visibility === "PUBLIC" : input.isPublic ?? old?.isPublic ?? false,
        weight: input.weight === undefined ? (old ? old.weight : 1) : input.weight
      };
      const { _max } = await tx.testCase.aggregate({ where: { problemId }, _max: { order: true } });
      const saved = old ? await tx.testCase.update({ where: { id: old.id }, data })
        : await tx.testCase.create({ data: { ...data, problemId, order: (_max.order ?? 0) + 1 } });
      await tx.problem.update({ where: { id: problemId }, data: { revision: { increment: 1 } } });
      return caseDto(saved);
    });
  }

  static async hints(id: string) { return (await this.get(id)).hints; }

  static changeHint(target: { problemId: string } | { hintId: string }, expected: number, input?: HintInput) {
    return adminTransaction(async tx => {
      const old = "hintId" in target ? await tx.hint.findUnique({ where: { id: target.hintId } }) : null;
      const problemId = "problemId" in target ? target.problemId : old?.problemId;
      if (!problemId) throw missing("Hint not found.");
      const question = await lockQuestion(tx, problemId, expected);
      if (question.status !== "DRAFT") throw conflict("Unpublish the question before editing hints.");
      const next: HintInput[] = question.hints.filter(hint => hint.id !== old?.id).map(hintDto);
      if (input) next.push({ ...input, id: old?.id });
      await syncHints(tx, question, next);
      await tx.problem.update({ where: { id: problemId }, data: { revision: { increment: 1 } } });
      return (await tx.hint.findMany({ where: { problemId }, orderBy: { order: "asc" } })).map(hintDto);
    });
  }

  static async overview() {
    const where = { contestId: env.CONTEST_ID };
    const [totalQuestions, draftQuestions, publishedQuestions, participants, totalIncidents, openIncidents, clock, rounds] = await Promise.all([
      prisma.problem.count({ where }),
      prisma.problem.count({ where: { ...where, status: "DRAFT" } }),
      prisma.problem.count({ where: { ...where, OR: [{ status: "PUBLISHED" }, { status: "SCHEDULED", publishAt: { lte: new Date() } }] } }),
      prisma.user.count({ where: { role: { in: ["PARTICIPANT", "CANDIDATE"] } } }),
      prisma.incident.count({ where: { session: where } }),
      prisma.incident.count({ where: { status: "OPEN", session: where } }),
      RoundService.clock(), RoundService.list()
    ]);
    const activeRounds = clock.status === "LIVE" ? rounds.filter(round => round.id === clock.roundId).map(round => ({
      ...round, name: round.title, round: round.title, contestStartTime: round.startsAt, contestEndTime: round.endsAt
    })) : [];
    return { totalQuestions, draftQuestions, publishedQuestions, participants, competitionStatus: clock.status,
      activeRounds, activeRoundCount: activeRounds.length, totalProblems: totalQuestions,
      totalParticipants: participants, totalIncidents, openIncidents, contestId: clock.id, contestStatus: clock.status };
  }
}
