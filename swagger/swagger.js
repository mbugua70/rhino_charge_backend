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
const { registerAdminBodySchema, loginBodySchema } = require("../schemas/auth.schema");
const {
  createSegmentBodySchema,
  updateSegmentBodySchema,
  registerSpinBodySchema,
  playSpinBodySchema,
  spinResultBodySchema,
  updateQuantityBodySchema,
} = require("../schemas/spin.schema");

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
registry.register("RegisterAdminBody", registerAdminBodySchema);
registry.register("LoginBody", loginBodySchema);
registry.register("CreateSegmentBody", createSegmentBodySchema);
registry.register("UpdateSegmentBody", updateSegmentBodySchema);
registry.register("RegisterSpinBody", registerSpinBodySchema);
registry.register("PlaySpinBody", playSpinBodySchema);
registry.register("SpinResultBody", spinResultBodySchema);
registry.register("UpdateQuantityBody", updateQuantityBodySchema);

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

// ── Reusable spin schemas ─────────────────────────────────────────────────────
const segmentSchema = z.object({
  _id: z.string(),
  text: z.string(),
  fillStyle: z.string(),
  strokeStyle: z.string(),
  textFillStyle: z.string(),
  gift_number: z.number(),
  quantity: z.number(),
  is_active: z.boolean(),
  is_winnable: z.boolean(),
  sort_order: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const spinRecordSchema = z.object({
  _id: z.string(),
  player_id: z.string(),
  player_name: z.string(),
  has_spun: z.boolean(),
  spun_at: z.string().nullable(),
  segment_id: z.string().nullable(),
  prize_name: z.string().nullable(),
  prize_snapshot: z.object({}).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const adminSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["admin", "super_admin"]),
  isActive: z.boolean(),
});

const paginationMeta = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

// ── /api/auth/register-admin ──────────────────────────────────────────────────
registry.registerPath({
  method: "post",
  path: "/api/auth/register-admin",
  tags: ["Auth"],
  summary: "Register a new admin user",
  request: {
    body: { content: { "application/json": { schema: registerAdminBodySchema } } },
  },
  responses: {
    201: {
      description: "Admin registered",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean(), message: z.string(), token: z.string(), admin: adminSchema }),
        },
      },
    },
    409: { description: "Email already registered" },
    400: { description: "Validation error" },
  },
});

// ── /api/auth/login ───────────────────────────────────────────────────────────
registry.registerPath({
  method: "post",
  path: "/api/auth/login",
  tags: ["Auth"],
  summary: "Admin login",
  request: {
    body: { content: { "application/json": { schema: loginBodySchema } } },
  },
  responses: {
    200: {
      description: "Login successful",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean(), message: z.string(), token: z.string(), admin: adminSchema }),
        },
      },
    },
    401: { description: "Invalid credentials" },
    403: { description: "Account inactive" },
  },
});

// ── /api/auth/me ──────────────────────────────────────────────────────────────
registry.registerPath({
  method: "get",
  path: "/api/auth/me",
  tags: ["Auth"],
  summary: "Get current admin profile",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Admin profile",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean(), admin: adminSchema }),
        },
      },
    },
    401: { description: "Unauthorized" },
  },
});

// ── /api/auth/logout ──────────────────────────────────────────────────────────
registry.registerPath({
  method: "post",
  path: "/api/auth/logout",
  tags: ["Auth"],
  summary: "Admin logout",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Logged out",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean(), message: z.string() }),
        },
      },
    },
    401: { description: "Unauthorized" },
  },
});

// ── /api/spin/segments/public ─────────────────────────────────────────────────
registry.registerPath({
  method: "get",
  path: "/api/spin/segments/public",
  tags: ["Spin"],
  summary: "Get all active segments for the wheel",
  responses: {
    200: {
      description: "Active segments",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean(), segments: z.array(segmentSchema) }),
        },
      },
    },
  },
});

// ── /api/spin/register ────────────────────────────────────────────────────────
registry.registerPath({
  method: "post",
  path: "/api/spin/register",
  tags: ["Spin"],
  summary: "Register a player for spin the wheel",
  request: {
    body: { content: { "application/json": { schema: registerSpinBodySchema } } },
  },
  responses: {
    201: {
      description: "Player registered for spin",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean(), message: z.string(), spin: spinRecordSchema }),
        },
      },
    },
    200: { description: "Player already registered — returns existing record" },
    404: { description: "Player not found" },
  },
});

// ── /api/spin/play ────────────────────────────────────────────────────────────
registry.registerPath({
  method: "post",
  path: "/api/spin/play",
  tags: ["Spin"],
  summary: "Check eligibility and get segments for the wheel — does not save a result",
  request: {
    body: { content: { "application/json": { schema: playSpinBodySchema } } },
  },
  responses: {
    200: {
      description: "Eligible to spin — returns segments. Or already spun — returns existing result.",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            already_spun: z.boolean(),
            player_name: z.string().optional(),
            segments: z.array(segmentSchema).optional(),
            spin: spinRecordSchema.optional(),
            segment: segmentSchema.optional(),
          }),
        },
      },
    },
    404: { description: "Invalid player code or spin record not found" },
  },
});

// ── /api/spin/result ──────────────────────────────────────────────────────────
registry.registerPath({
  method: "post",
  path: "/api/spin/result",
  tags: ["Spin"],
  summary: "Submit the segment the wheel stopped on — backend validates and saves the result",
  request: {
    body: { content: { "application/json": { schema: spinResultBodySchema } } },
  },
  responses: {
    200: {
      description: "Result saved (or already spun)",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            already_spun: z.boolean().optional(),
            spin: spinRecordSchema,
            segment: segmentSchema.optional(),
            prize_snapshot: z.object({}).optional(),
          }),
        },
      },
    },
    404: { description: "Invalid player code, spin record, or segment not found" },
    400: { description: "Segment not eligible or prize ran out" },
    409: { description: "Prize just ran out — retry" },
  },
});

// ── /api/spin/player/{playerCode}/result ─────────────────────────────────────
registry.registerPath({
  method: "get",
  path: "/api/spin/player/{playerCode}/result",
  tags: ["Spin"],
  summary: "Get a player's spin result by player code",
  request: { params: z.object({ playerCode: z.string() }) },
  responses: {
    200: {
      description: "Spin record",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean(), spin: spinRecordSchema }),
        },
      },
    },
    404: { description: "Player or spin record not found" },
  },
});

// ── /api/admin/spin/segments ──────────────────────────────────────────────────
registry.registerPath({
  method: "get",
  path: "/api/admin/spin/segments",
  tags: ["Admin — Spin Segments"],
  summary: "List all segments",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "All segments",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean(), segments: z.array(segmentSchema) }),
        },
      },
    },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/admin/spin/segments",
  tags: ["Admin — Spin Segments"],
  summary: "Create a new segment",
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: createSegmentBodySchema } } },
  },
  responses: {
    201: {
      description: "Segment created",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean(), message: z.string(), segment: segmentSchema }),
        },
      },
    },
    400: { description: "Validation error" },
    401: { description: "Unauthorized" },
  },
});

// ── /api/admin/spin/segments/{id} ─────────────────────────────────────────────
registry.registerPath({
  method: "patch",
  path: "/api/admin/spin/segments/{id}",
  tags: ["Admin — Spin Segments"],
  summary: "Update a segment",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { "application/json": { schema: updateSegmentBodySchema } } },
  },
  responses: {
    200: {
      description: "Segment updated",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean(), message: z.string(), segment: segmentSchema }),
        },
      },
    },
    404: { description: "Segment not found" },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/admin/spin/segments/{id}",
  tags: ["Admin — Spin Segments"],
  summary: "Delete a segment",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      description: "Segment deleted",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean(), message: z.string() }),
        },
      },
    },
    404: { description: "Segment not found" },
    401: { description: "Unauthorized" },
  },
});

// ── /api/admin/spin/segments/{id}/toggle-winnable ─────────────────────────────
registry.registerPath({
  method: "patch",
  path: "/api/admin/spin/segments/{id}/toggle-winnable",
  tags: ["Admin — Spin Segments"],
  summary: "Toggle is_winnable on a segment",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      description: "is_winnable toggled",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean(), message: z.string(), segment: segmentSchema }),
        },
      },
    },
    404: { description: "Segment not found" },
    401: { description: "Unauthorized" },
  },
});

// ── /api/admin/spin/segments/{id}/update-quantity ─────────────────────────────
registry.registerPath({
  method: "patch",
  path: "/api/admin/spin/segments/{id}/update-quantity",
  tags: ["Admin — Spin Segments"],
  summary: "Update quantity of a segment",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { "application/json": { schema: updateQuantityBodySchema } } },
  },
  responses: {
    200: {
      description: "Quantity updated",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean(), message: z.string(), segment: segmentSchema }),
        },
      },
    },
    404: { description: "Segment not found" },
    401: { description: "Unauthorized" },
  },
});

// ── /api/admin/spin/players ───────────────────────────────────────────────────
registry.registerPath({
  method: "get",
  path: "/api/admin/spin/players",
  tags: ["Admin — Spin Reports"],
  summary: "List all spin-registered players (paginated)",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.coerce.number().optional(),
      limit: z.coerce.number().optional(),
    }),
  },
  responses: {
    200: {
      description: "Paginated player spin records",
      content: {
        "application/json": {
          schema: paginationMeta.extend({ success: z.boolean(), players: z.array(spinRecordSchema) }),
        },
      },
    },
    401: { description: "Unauthorized" },
  },
});

// ── /api/admin/spin/results ───────────────────────────────────────────────────
registry.registerPath({
  method: "get",
  path: "/api/admin/spin/results",
  tags: ["Admin — Spin Reports"],
  summary: "List all completed spin results (paginated)",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.coerce.number().optional(),
      limit: z.coerce.number().optional(),
    }),
  },
  responses: {
    200: {
      description: "Paginated spin results",
      content: {
        "application/json": {
          schema: paginationMeta.extend({ success: z.boolean(), results: z.array(spinRecordSchema) }),
        },
      },
    },
    401: { description: "Unauthorized" },
  },
});

// ── /api/admin/players ───────────────────────────────────────────────────────
registry.registerPath({
  method: "get",
  path: "/api/admin/players",
  tags: ["Admin — Players"],
  summary: "List all game players (paginated, filterable)",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.coerce.number().optional(),
      limit: z.coerce.number().optional(),
      isActive: z.string().optional(),
      completedLevels: z.coerce.number().optional(),
    }),
  },
  responses: {
    200: {
      description: "Paginated player list",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            totalPages: z.number(),
            players: z.array(
              z.object({
                _id: z.string(),
                name: z.string(),
                player_code: z.string(),
                totalScore: z.number(),
                currentLevel: z.number(),
                completedLevels: z.array(z.number()),
                isActive: z.boolean(),
                createdAt: z.string(),
                updatedAt: z.string(),
              })
            ),
          }),
        },
      },
    },
    401: { description: "Unauthorized" },
  },
});

// ── /api/admin/players/{id} ───────────────────────────────────────────────────
registry.registerPath({
  method: "get",
  path: "/api/admin/players/{id}",
  tags: ["Admin — Players"],
  summary: "Get a single player with their level attempts",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      description: "Player with level attempts",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            player: z.object({
              _id: z.string(),
              name: z.string(),
              player_code: z.string(),
              totalScore: z.number(),
              currentLevel: z.number(),
              completedLevels: z.array(z.number()),
              isActive: z.boolean(),
            }),
            levelAttempts: z.array(z.object({})),
          }),
        },
      },
    },
    404: { description: "Player not found" },
    401: { description: "Unauthorized" },
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
