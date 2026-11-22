import { Router, type NextFunction, type Request, type Response } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { AdminController as admin } from "../controllers/admin.controller.js";
import { assignmentSchema, caseSchema, createProblemSchema, deleteSchema, editProblemSchema,
  hintEditSchema, publishSchema, roundSchema, unpublishSchema } from "../controllers/admin.schemas.js";

export const adminRouter = Router();
adminRouter.use("/admin", requireAuth, requireRole([Role.ADMIN]));
const handle = (action: (req: Request) => Promise<unknown>, status = 200) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try { const result = await action(req); res.status(status).json(result); }
    catch (error) { next(error); }
  };

adminRouter.get("/admin/overview", handle(admin.overview));
adminRouter.get("/admin/problems", handle(admin.list));
adminRouter.post("/admin/problems", validateBody(createProblemSchema), handle(admin.create, 201));
adminRouter.get("/admin/problems/:id", handle(admin.get));
adminRouter.patch("/admin/problems/:id", validateBody(editProblemSchema), handle(admin.edit));
adminRouter.delete("/admin/problems/:id", validateBody(deleteSchema), handle(admin.remove, 204));
adminRouter.post("/admin/problems/:id/publish", validateBody(publishSchema), handle(admin.publish));
adminRouter.post("/admin/problems/:id/unpublish", validateBody(unpublishSchema), handle(admin.unpublish));
adminRouter.get("/admin/problems/:id/testcases", handle(admin.cases));
adminRouter.post("/admin/problems/:id/testcases", validateBody(caseSchema), handle(admin.addCase, 201));
adminRouter.patch("/admin/testcases/:id", validateBody(caseSchema), handle(admin.editCase));
adminRouter.delete("/admin/testcases/:id", handle(admin.removeCase, 204));
adminRouter.get("/admin/problems/:id/hints", handle(admin.hints));
adminRouter.post("/admin/problems/:id/hints", validateBody(hintEditSchema), handle(admin.addHint, 201));
adminRouter.patch("/admin/hints/:id", validateBody(hintEditSchema), handle(admin.editHint));
adminRouter.delete("/admin/hints/:id", validateBody(deleteSchema), handle(admin.removeHint));
adminRouter.get("/admin/rounds", handle(admin.rounds));
adminRouter.post("/admin/rounds", validateBody(roundSchema), handle(admin.createRound, 201));
adminRouter.put("/admin/rounds/:id", validateBody(roundSchema), handle(admin.saveRound));
adminRouter.post("/admin/rounds/:id/problems", validateBody(assignmentSchema), handle(admin.assign));
