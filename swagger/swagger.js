const { OpenAPIRegistry, OpenApiGeneratorV3 } = require("@asteasolutions/zod-to-openapi");
const { z } = require("../config/zod");
const { registerPlayerBodySchema } = require("../schemas/player.schema");
const {
  answerItemSchema,
  submitLevelBodySchema,
} = require("../schemas/game.schema");
const {
  optionItemSchema,
  createQuestionBodySchema,
  updateQuestionBodySchema,
} = require("../schemas/question.schema");

const registry = new OpenAPIRegistry();

// ── Bearer auth ──────────────────────────────────────────────────────────────
registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

// ── Register schemas ─────────────────────────────────────────────────────────
registry.register("RegisterPlayerBody", registerPlayerBodySchema);
registry.register("AnswerItem", answerItemSchema);
registry.register("SubmitLevelBody", submitLevelBodySchema);
registry.register("QuestionOption", optionItemSchema);
registry.register("CreateQuestionBody", createQuestionBodySchema);
registry.register("UpdateQuestionBody", updateQuestionBodySchema);

// ── Reusable inline schemas ───────────────────────────────────────────────────
const progressSchema = z.object({
  currentLevel: z.number(),
  completedLevels: z.array(z.number()),
  totalScore: z.number(),
});

const playerSchema = z.object({
  _id: z.string(),
  name: z.string(),
  phone: z.string(),
  isActive: z.boolean(),
});

// ── /api/game/register ───────────────────────────────────────────────────────
registry.registerPath({
  method: "post",
  path: "/api/game/register",
  tags: ["Game"],
  summary: "Register or return existing player",
  request: {
    body: { content: { "application/json": { schema: registerPlayerBodySchema } } },
  },
  responses: {
    201: {
      description: "Player registered",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            token: z.string(),
            player: playerSchema,
            progress: progressSchema,
          }),
        },
      },
    },
  },
});

// ── /api/game/me ─────────────────────────────────────────────────────────────
registry.registerPath({
  method: "get",
  path: "/api/game/me",
  tags: ["Game"],
  summary: "Get current player profile and level attempts",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Player profile",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean(), player: playerSchema }),
        },
      },
    },
  },
});

// ── /api/game/progress ───────────────────────────────────────────────────────
registry.registerPath({
  method: "get",
  path: "/api/game/progress",
  tags: ["Game"],
  summary: "Get player level progress",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Progress details",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            currentLevel: z.number(),
            completedLevels: z.array(z.number()),
            totalScore: z.number(),
            unlockedLevel: z.number(),
          }),
        },
      },
    },
  },
});

// ── /api/game/results ────────────────────────────────────────────────────────
registry.registerPath({
  method: "get",
  path: "/api/game/results",
  tags: ["Game"],
  summary: "Get final results and rank for current player",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Final results",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            rank: z.number(),
            totalScore: z.number(),
          }),
        },
      },
    },
  },
});

// ── /api/game/leaderboard ────────────────────────────────────────────────────
registry.registerPath({
  method: "get",
  path: "/api/game/leaderboard",
  tags: ["Game"],
  summary: "Get paginated leaderboard",
  request: {
    query: z.object({
      page: z.coerce.number().optional(),
      limit: z.coerce.number().optional(),
    }),
  },
  responses: {
    200: {
      description: "Leaderboard",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            totalPages: z.number(),
          }),
        },
      },
    },
  },
});

// ── /api/game/levels/{level}/start ───────────────────────────────────────────
registry.registerPath({
  method: "post",
  path: "/api/game/levels/{level}/start",
  tags: ["Game"],
  summary: "Start a level — returns questions for that level",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ level: z.coerce.number().min(1).max(4) }),
  },
  responses: {
    200: {
      description: "Level started with questions",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            level: z.number(),
            gameType: z.string(),
            attemptId: z.string(),
            questions: z.array(z.object({})),
          }),
        },
      },
    },
    403: { description: "Prerequisite level not completed" },
    400: { description: "Level already completed or no questions available" },
  },
});

// ── /api/game/levels/{level}/submit ──────────────────────────────────────────
registry.registerPath({
  method: "post",
  path: "/api/game/levels/{level}/submit",
  tags: ["Game"],
  summary: "Submit level score",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ level: z.coerce.number().min(1).max(4) }),
    body: { content: { "application/json": { schema: submitLevelBodySchema } } },
  },
  responses: {
    200: {
      description: "Level completed",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            levelScore: z.number(),
            totalScore: z.number(),
            nextLevel: z.number().nullable(),
            completedLevels: z.array(z.number()),
          }),
        },
      },
    },
    400: { description: "Level not started or already completed" },
  },
});

// ── /api/questions ───────────────────────────────────────────────────────────
registry.registerPath({
  method: "post",
  path: "/api/questions",
  tags: ["Questions"],
  summary: "Create a question",
  request: {
    body: { content: { "application/json": { schema: createQuestionBodySchema } } },
  },
  responses: {
    201: { description: "Question created" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/questions",
  tags: ["Questions"],
  summary: "List all questions",
  request: {
    query: z.object({
      level: z.coerce.number().optional(),
      gameType: z.string().optional(),
      isActive: z.string().optional(),
    }),
  },
  responses: {
    200: { description: "List of questions" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/questions/{id}",
  tags: ["Questions"],
  summary: "Get a question by ID",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "Question found" },
    404: { description: "Question not found" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/questions/{id}",
  tags: ["Questions"],
  summary: "Update a question",
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { "application/json": { schema: updateQuestionBodySchema } } },
  },
  responses: {
    200: { description: "Question updated" },
    404: { description: "Question not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/questions/{id}",
  tags: ["Questions"],
  summary: "Delete a question",
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "Question deleted" },
    404: { description: "Question not found" },
  },
});

// ── Generate spec ─────────────────────────────────────────────────────────────
const generator = new OpenApiGeneratorV3(registry.definitions);

const swaggerSpec = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "Safaricom QR Game API",
    version: "1.0.0",
    description: "Backend API for the Safaricom QR event game",
  },
  servers: [{ url: process.env.API_URL || "http://localhost:4040" }],
});

module.exports = swaggerSpec;
