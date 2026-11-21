import { z } from "zod";

const text = z.string().max(65536);
const paragraphs = z.union([text, z.array(text).max(200)]).transform(value => Array.isArray(value) ? value.join("\n\n") : value);
const language = z.enum(["python", "javascript", "cpp", "java"]);
const languages = z.array(language).min(1).max(4).refine(values => new Set(values).size === values.length);
export const idSchema = z.string().trim().min(1).max(160);
export const revision = z.number().int().positive();
const order = z.number().int().min(1).max(10000);
export const hintSchema = z.object({
  id: idSchema.optional(), order, deductionPoints: z.number().int().min(0).max(10000), content: text.trim().min(1)
});
export const caseSchema = z.object({
  input: text, expectedOutput: text,
  visibility: z.enum(["PUBLIC", "HIDDEN"]).optional(), isPublic: z.boolean().optional(),
  weight: z.number().finite().positive().max(10000).nullable().optional(), expectedRevision: revision.optional()
}).refine(value => value.visibility === undefined || value.isPublic === undefined ||
  (value.visibility === "PUBLIC") === value.isPublic, "Conflicting test case visibility.");

const problemFields = {
  title: z.string().trim().min(1).max(160),
  difficulty: z.enum(["Easy", "Medium", "Hard", "EASY", "MEDIUM", "HARD"]),
  points: z.number().int().min(1).max(10000), statement: paragraphs,
  inputFormat: paragraphs, outputFormat: text, constraints: paragraphs,
  samples: z.array(z.object({ id: idSchema.optional(), input: text, output: text, explanation: text.optional() })).max(100),
  timeLimitMs: z.number().int().min(100).max(60000),
  memoryLimitMb: z.number().int().min(16).max(4096), allowedLanguages: languages,
  expectedTimeComplexity: z.string().max(200).nullable(),
  expectedSpaceComplexity: z.string().max(200).nullable(), roundId: idSchema.nullable(),
  order, hints: z.array(hintSchema).max(30)
};
export const createProblemSchema = z.object({
  ...problemFields,
  difficulty: problemFields.difficulty.default("Medium"), points: problemFields.points.default(100),
  inputFormat: paragraphs.default(""), outputFormat: text.default(""), constraints: paragraphs.default(""),
  samples: problemFields.samples.optional(), hints: problemFields.hints.optional(),
  timeLimitMs: problemFields.timeLimitMs.default(2000), memoryLimitMb: problemFields.memoryLimitMb.default(256),
  allowedLanguages: languages.default(["python", "javascript", "cpp", "java"]),
  expectedTimeComplexity: problemFields.expectedTimeComplexity.optional(),
  expectedSpaceComplexity: problemFields.expectedSpaceComplexity.optional(),
  roundId: problemFields.roundId.optional(), order: order.optional()
});
export const editProblemSchema = z.object(problemFields).partial().extend({ expectedRevision: revision });
export const publishSchema = z.object({ expectedRevision: revision.optional(), publishAt: z.string().datetime({ offset: true }).nullable().optional() });
export const unpublishSchema = z.object({ expectedRevision: revision.optional() });
export const deleteSchema = z.object({ expectedRevision: revision });
export const assignmentSchema = z.object({ problemId: idSchema, expectedRevision: revision, order: order.optional() });
export const hintEditSchema = z.object({ hint: hintSchema, expectedRevision: revision });
export const roundSchema = z.object({
  id: idSchema.optional(), title: z.string().trim().min(1).max(160),
  status: z.enum(["WAITING", "LIVE", "PAUSED_BY_ORGANIZER", "FINISHED"]),
  startsAt: z.string().datetime({ offset: true }), endsAt: z.string().datetime({ offset: true }),
  resultsVisible: z.boolean(), questionsVisible: z.boolean().optional()
});
