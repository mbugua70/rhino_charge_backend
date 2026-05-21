const { z } = require("../config/zod");

const levelParamSchema = z.object({
  level: z.coerce
    .number()
    .int()
    .min(1)
    .max(4),
});

const startLevelSchema = z.object({
  params: levelParamSchema,
});

const answerItemSchema = z
  .object({
    questionId: z.string().min(1, "questionId is required"),
    // trivia / timed_trivia: option key e.g. "A"
    selectedOptionKey: z.string().optional(),
    // word_puzzle / final_challenge: typed answer
    submittedAnswer: z.string().optional(),
    timeTaken: z.number().nonnegative().optional(),
  })
  .openapi("AnswerItem");

const submitLevelBodySchema = z
  .object({
    answers: z.array(answerItemSchema).min(1, "At least one answer is required"),
  })
  .openapi("SubmitLevelBody");

const submitLevelSchema = z.object({
  params: levelParamSchema,
  body: submitLevelBodySchema,
});

const leaderboardQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const leaderboardSchema = z.object({
  query: leaderboardQuerySchema,
});

module.exports = {
  levelParamSchema,
  startLevelSchema,
  submitLevelBodySchema,
  submitLevelSchema,
  leaderboardQuerySchema,
  leaderboardSchema,
  answerItemSchema,
};
