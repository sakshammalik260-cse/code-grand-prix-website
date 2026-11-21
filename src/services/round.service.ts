import type { CompetitionRound, Prisma } from "@prisma/client";
import { ERROR_CODES } from "../constants/index.js";
import { AppError } from "../middleware/error.middleware.js";
import { env } from "../config/env.js";
import { prisma } from "../config/database.js";
import { ContestRepository } from "../repositories/contest.repository.js";

export type RoundPhase = "WAITING" | "LIVE" | "PAUSED_BY_ORGANIZER" | "FINISHED";

export function roundPhase(round: CompetitionRound, now = new Date()): RoundPhase {
  if (round.status === "FINISHED" || round.status === "ENDED" || now >= round.endsAt) return "FINISHED";
  if (now < round.startsAt) return "WAITING";
  if (round.status === "PAUSED" || round.status === "PAUSED_BY_ORGANIZER") return "PAUSED_BY_ORGANIZER";
  return round.status === "LIVE" ? "LIVE" : "WAITING";
}

export function roundDto(round: CompetitionRound) {
  return { id: round.id, title: round.title, status: roundPhase(round), startsAt: round.startsAt,
    endsAt: round.endsAt, resultsVisible: round.resultsVisible, questionsVisible: round.questionsVisible };
}

export function visibleProblem(now = new Date()): Prisma.ProblemWhereInput {
  return {
    contestId: env.CONTEST_ID,
    contest: { status: "LIVE", startsAt: { lte: now }, endsAt: { gt: now } },
    round: { status: "LIVE", questionsVisible: true, startsAt: { lte: now }, endsAt: { gt: now } },
    OR: [{ status: "PUBLISHED" }, { status: "SCHEDULED", publishAt: { lte: now } }]
  };
}

type RoundInput = {
  title: string;
  status: RoundPhase;
  startsAt: string;
  endsAt: string;
  resultsVisible: boolean;
  questionsVisible?: boolean;
};

export class RoundService {
  static async list() {
    const rounds = await prisma.competitionRound.findMany({
      where: { contestId: env.CONTEST_ID }, orderBy: [{ startsAt: "asc" }, { id: "asc" }]
    });
    return rounds.map(roundDto);
  }

  static async save(tx: Prisma.TransactionClient, id: string, input: RoundInput, createOnly = false) {
    const prior = await tx.competitionRound.findUnique({ where: { id } });
    if (prior && createOnly) throw conflict("Round ID is already in use.");
    if (prior && prior.contestId !== env.CONTEST_ID) throw conflict("Round ID is already in use.");
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    const now = new Date();
    if (endsAt <= startsAt) throw invalid("Round end must follow its start.");
    const contest = await tx.contest.findUniqueOrThrow({ where: { id: env.CONTEST_ID } });
    const scheduleChanged = !prior || +prior.startsAt !== +startsAt || +prior.endsAt !== +endsAt;
    if (scheduleChanged && (startsAt < contest.startsAt || endsAt > contest.endsAt)) {
      throw invalid("The round schedule must fit inside the contest window.");
    }
    if (!prior && endsAt <= now) throw invalid("A new round must end in the future.");

    const previous = prior && roundPhase(prior, now);
    if (previous === "FINISHED" && input.status !== "FINISHED") throw conflict("A closed round cannot reopen.");
    if (prior && scheduleChanged && (now >= prior.startsAt || prior.status !== "WAITING" && prior.status !== "UPCOMING")) {
      throw conflict("A round schedule can only change before the round begins.");
    }
    if (prior && input.status === "WAITING" && (previous === "LIVE" || previous === "PAUSED_BY_ORGANIZER")) {
      throw conflict("Pause or close an opened round.");
    }
    if (input.status === "PAUSED_BY_ORGANIZER" && previous !== "LIVE" && previous !== "PAUSED_BY_ORGANIZER") {
      throw conflict("Only an opened round can be paused.");
    }
    if (input.status === "LIVE") {
      if (contest.status !== "LIVE" || now < startsAt || now >= endsAt) throw conflict("Open the round during its scheduled window and a live contest.");
      const another = await tx.competitionRound.findFirst({
        where: { contestId: env.CONTEST_ID, id: { not: id },
          status: { in: ["LIVE", "PAUSED", "PAUSED_BY_ORGANIZER"] }, startsAt: { lte: now }, endsAt: { gt: now } }
      });
      if (another) throw conflict("Close the current round before opening another.");
    }

    const data = { title: input.title, startsAt, endsAt, status: input.status,
      resultsVisible: input.resultsVisible, questionsVisible: input.questionsVisible ?? prior?.questionsVisible ?? true };
    const round = await tx.competitionRound.upsert({
      where: { id }, create: { ...data, id, contestId: env.CONTEST_ID }, update: data
    });
    return roundDto(round);
  }

  static async clock(contestId = env.CONTEST_ID) {
    const contest = await ContestRepository.getContest(contestId);
    const clock = ContestRepository.calculateTimeDetails(contest);
    const rounds = await prisma.competitionRound.findMany({ where: { contestId },
      orderBy: [{ startsAt: "asc" }, { id: "asc" }] });
    const now = new Date();
    const active = rounds.find(round => ["LIVE", "PAUSED_BY_ORGANIZER"].includes(roundPhase(round, now)));
    const round = active ?? rounds.find(item => roundPhase(item, now) === "WAITING") ?? rounds.at(-1);
    if (!round) return { ...clock, roundId: null, resultsVisible: false, status: clock.status === "LIVE" ? "WAITING" as const : clock.status };
    const status = clock.status === "LIVE" ? roundPhase(round, now) : clock.status;
    return {
      ...clock, round: round.title, roundId: round.id, roundNumber: rounds.indexOf(round) + 1, resultsVisible: clock.resultsVisible && round.resultsVisible, status,
      startsAt: round.startsAt.toISOString(), endsAt: round.endsAt.toISOString(),
      contestStartTime: round.startsAt.toISOString(), contestEndTime: round.endsAt.toISOString(),
      remainingMs: status === "FINISHED" ? 0 : Math.max(0, +(status === "WAITING" ? round.startsAt : round.endsAt) - +now)
    };
  }
}

function invalid(message: string) {
  return new AppError(400, ERROR_CODES.VALIDATION_ERROR, message);
}
function conflict(message: string) {
  return new AppError(409, ERROR_CODES.VALIDATION_ERROR, message);
}
