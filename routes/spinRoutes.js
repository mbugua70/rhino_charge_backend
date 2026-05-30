const { Router } = require("express");
const spinController = require("../controllers/spinController");
const validateRequest = require("../middleware/validateRequest");
const {
  registerSpinSchema,
  playSpinSchema,
  spinResultSchema,
  getPlayerResultSchema,
} = require("../schemas/spin.schema");

const router = Router();

router.get("/segments/public", spinController.publicSegments);
router.post("/register", validateRequest(registerSpinSchema), spinController.register);
router.post("/play", validateRequest(playSpinSchema), spinController.play);
router.post("/result", validateRequest(spinResultSchema), spinController.submitResult);
router.get("/player/:playerCode/result", validateRequest(getPlayerResultSchema), spinController.playerResult);

module.exports = router;
