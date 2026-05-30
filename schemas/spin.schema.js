const { z } = require("../config/zod");

const segmentIdParamSchema = z.object({
  id: z.string().min(1, "Segment ID is required"),
});

const createSegmentBodySchema = z
  .object({
    text: z.string().min(1, "Text is required").trim(),
    fillStyle: z.string().min(1, "fillStyle is required"),
    strokeStyle: z.string().default("#ffffff"),
    textFillStyle: z.string().default("#ffffff"),
    gift_number: z.number().int().min(0).default(0),
    quantity: z.number().int().min(0),
    is_active: z.boolean().default(true),
    is_winnable: z.boolean().default(true),
    sort_order: z.number().int().default(0),
  })
  .openapi("CreateSegmentBody");

const createSegmentSchema = z.object({
  body: createSegmentBodySchema,
});

const updateSegmentBodySchema = z
  .object({
    text: z.string().min(1).trim().optional(),
    fillStyle: z.string().optional(),
    strokeStyle: z.string().optional(),
    textFillStyle: z.string().optional(),
    gift_number: z.number().int().min(0).optional(),
    quantity: z.number().int().min(0).optional(),
    is_active: z.boolean().optional(),
    is_winnable: z.boolean().optional(),
    sort_order: z.number().int().optional(),
  })
  .openapi("UpdateSegmentBody");

const updateSegmentSchema = z.object({
  params: segmentIdParamSchema,
  body: updateSegmentBodySchema,
});

const segmentParamSchema = z.object({
  params: segmentIdParamSchema,
});

const updateQuantityBodySchema = z
  .object({
    quantity: z.number().int().min(0),
  })
  .openapi("UpdateQuantityBody");

const updateQuantitySchema = z.object({
  params: segmentIdParamSchema,
  body: updateQuantityBodySchema,
});

const registerSpinBodySchema = z
  .object({
    player_id: z.string().min(1, "player_id is required"),
  })
  .openapi("RegisterSpinBody");

const registerSpinSchema = z.object({
  body: registerSpinBodySchema,
});

const playSpinBodySchema = z
  .object({
    player_id: z.string().min(1, "player_id is required"),
  })
  .openapi("PlaySpinBody");

const playSpinSchema = z.object({
  body: playSpinBodySchema,
});

const playerIdParamSchema = z.object({
  playerId: z.string().min(1, "playerId is required"),
});

const getPlayerResultSchema = z.object({
  params: playerIdParamSchema,
});

const adminPaginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(20),
  }),
});

module.exports = {
  createSegmentBodySchema,
  createSegmentSchema,
  updateSegmentBodySchema,
  updateSegmentSchema,
  segmentParamSchema,
  updateQuantityBodySchema,
  updateQuantitySchema,
  registerSpinBodySchema,
  registerSpinSchema,
  playSpinBodySchema,
  playSpinSchema,
  getPlayerResultSchema,
  adminPaginationSchema,
};
