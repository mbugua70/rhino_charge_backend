const { z } = require("../config/zod");

const registerPlayerBodySchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").trim(),
    phone: z.string().min(9, "Phone number is too short").trim(),
  })
  .openapi("RegisterPlayerBody");

const registerPlayerSchema = z.object({
  body: registerPlayerBodySchema,
});

module.exports = { registerPlayerBodySchema, registerPlayerSchema };
