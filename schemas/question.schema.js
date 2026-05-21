const { z } = require("../config/zod");

const optionItemSchema = z
  .object({
    key: z.string().min(1),
    text: z.string().min(1),
    isCorrect: z.boolean(),
  })
  .openapi("QuestionOption");

const createQuestionBodySchema = z
  .object({
    level: z.number().int().min(1).max(4),
    gameType: z.enum(["trivia", "timed_trivia", "word_puzzle", "final_challenge"]),
    questionText: z.string().trim().optional(),
    // trivia / timed_trivia: options with embedded isCorrect
    options: z.array(optionItemSchema).default([]),
    // word_puzzle / final_challenge: plain string answer
    correctAnswer: z.string().trim().optional(),
    scrambledWord: z.string().trim().optional(),
    hint: z.string().trim().optional(),
    points: z.number().int().min(0).default(10),
    timeLimitSeconds: z.number().int().positive().optional(),
    isActive: z.boolean().default(true),
  })
  .openapi("CreateQuestionBody");

const updateQuestionBodySchema = z
  .object({
    level: z.number().int().min(1).max(4).optional(),
    gameType: z
      .enum(["trivia", "timed_trivia", "word_puzzle", "final_challenge"])
      .optional(),
    questionText: z.string().trim().optional(),
    options: z.array(optionItemSchema).optional(),
    correctAnswer: z.string().trim().optional(),
    scrambledWord: z.string().trim().optional(),
    hint: z.string().trim().optional(),
    points: z.number().int().min(0).optional(),
    timeLimitSeconds: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
  })
  .openapi("UpdateQuestionBody");

const questionIdParamSchema = z.object({
  id: z.string().min(1, "Question ID is required"),
});

const createQuestionSchema = z.object({
  body: createQuestionBodySchema,
});

const updateQuestionSchema = z.object({
  params: questionIdParamSchema,
  body: updateQuestionBodySchema,
});

const questionIdSchema = z.object({
  params: questionIdParamSchema,
});

module.exports = {
  optionItemSchema,
  createQuestionBodySchema,
  updateQuestionBodySchema,
  questionIdParamSchema,
  createQuestionSchema,
  updateQuestionSchema,
  questionIdSchema,
};
