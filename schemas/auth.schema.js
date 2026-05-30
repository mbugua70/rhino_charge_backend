const { z } = require("../config/zod");

const registerAdminBodySchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").trim(),
    email: z.string().email("Invalid email").trim(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["admin", "super_admin"]).default("admin").optional(),
  })
  .openapi("RegisterAdminBody");

const registerAdminSchema = z.object({
  body: registerAdminBodySchema,
});

const loginBodySchema = z
  .object({
    email: z.string().email("Invalid email").trim(),
    password: z.string().min(1, "Password is required"),
  })
  .openapi("LoginBody");

const loginSchema = z.object({
  body: loginBodySchema,
});

module.exports = { registerAdminBodySchema, registerAdminSchema, loginBodySchema, loginSchema };
