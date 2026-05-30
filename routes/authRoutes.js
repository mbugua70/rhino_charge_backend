const { Router } = require("express");
const authController = require("../controllers/authController");
const adminAuth = require("../middleware/adminAuth");
const validateRequest = require("../middleware/validateRequest");
const { registerAdminSchema, loginSchema } = require("../schemas/auth.schema");

const router = Router();

router.post("/register-admin", validateRequest(registerAdminSchema), authController.registerAdmin);
router.post("/login", validateRequest(loginSchema), authController.login);
router.get("/me", adminAuth, authController.me);
router.post("/logout", adminAuth, authController.logout);

module.exports = router;
