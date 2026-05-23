const { z } = require("../config/zod");

const registerPlayerBodySchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").trim(),
  })
  .openapi("RegisterPlayerBody");

const registerPlayerSchema = z.object({
  body: registerPlayerBodySchema,
});

module.exports = { registerPlayerBodySchema, registerPlayerSchema };
