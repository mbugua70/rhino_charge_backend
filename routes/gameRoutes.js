const { Router } = require("express");
const gameController = require("../controllers/gameController");
const playerAuth = require("../middleware/playerAuth");
const validateRequest = require("../middleware/validateRequest");
const { registerPlayerSchema } = require("../schemas/player.schema");
const {
  startLevelSchema,
  submitLevelSchema,
  leaderboardSchema,
} = require("../schemas/game.schema");

const router = Router();

// Public
router.post("/register", validateRequest(registerPlayerSchema), gameController.register);
router.get("/leaderboard", validateRequest(leaderboardSchema), gameController.leaderboard);

// Protected
router.get("/me", playerAuth, gameController.me);
router.get("/progress", playerAuth, gameController.progress);
router.get("/results", playerAuth, gameController.results);
router.post("/levels/:level/start", playerAuth, validateRequest(startLevelSchema), gameController.startLevel);
router.post("/levels/:level/submit", playerAuth, validateRequest(submitLevelSchema), gameController.submitLevel);

module.exports = router;
