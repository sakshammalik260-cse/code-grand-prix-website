import { randomUUID } from "node:crypto";
import type { Request } from "express";
import { AppError } from "../middleware/error.middleware.js";
import { ERROR_CODES } from "../constants/index.js";
import { adminTransaction, QuestionAdminService as questions } from "../services/admin.service.js";
import { RoundService } from "../services/round.service.js";
import { idSchema } from "./admin.schemas.js";

function id(req: Request) {
  const value = idSchema.safeParse(req.params.id);
  if (!value.success) throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, "A valid resource ID is required.");
  return value.data;
}

export const AdminController = {
  overview: () => questions.overview(),
  list: () => questions.list(),
  get: (req: Request) => questions.get(id(req)),
  create: (req: Request) => questions.create(req.body),
  edit: (req: Request) => questions.edit(id(req), req.body),
  remove: (req: Request) => questions.remove(id(req), req.body.expectedRevision),
  publish: (req: Request) => questions.publish(id(req), req.body),
  unpublish: (req: Request) => questions.unpublish(id(req), req.body.expectedRevision),
  cases: (req: Request) => questions.cases(id(req)),
  addCase: (req: Request) => questions.changeCase({ problemId: id(req) }, req.body),
  editCase: (req: Request) => questions.changeCase({ caseId: id(req) }, req.body),
  removeCase: (req: Request) => questions.changeCase({ caseId: id(req) }),
  hints: (req: Request) => questions.hints(id(req)),
  addHint: (req: Request) => questions.changeHint({ problemId: id(req) }, req.body.expectedRevision, req.body.hint),
  editHint: (req: Request) => questions.changeHint({ hintId: id(req) }, req.body.expectedRevision, req.body.hint),
  removeHint: (req: Request) => questions.changeHint({ hintId: id(req) }, req.body.expectedRevision),
  rounds: () => RoundService.list(),
  createRound: (req: Request) => adminTransaction(tx => RoundService.save(tx, req.body.id ?? randomUUID(), req.body, true), true),
  saveRound: (req: Request) => {
    const roundId = id(req);
    if (req.body.id !== undefined && roundId !== req.body.id) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, "Round IDs must match.");
    }
    return adminTransaction(tx => RoundService.save(tx, roundId, req.body), true);
  },
  assign: (req: Request) => questions.edit(req.body.problemId, {
    roundId: id(req), order: req.body.order, expectedRevision: req.body.expectedRevision
  })
};
