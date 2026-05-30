const { Router } = require("express");
const adminSpinController = require("../controllers/adminSpinController");
const adminAuth = require("../middleware/adminAuth");
const validateRequest = require("../middleware/validateRequest");
const {
  createSegmentSchema,
  updateSegmentSchema,
  segmentParamSchema,
  updateQuantitySchema,
} = require("../schemas/spin.schema");

const router = Router();

router.use(adminAuth);

router.get("/segments", adminSpinController.listSegments);
router.post("/segments", validateRequest(createSegmentSchema), adminSpinController.createSegment);
router.patch("/segments/:id", validateRequest(updateSegmentSchema), adminSpinController.updateSegment);
router.delete("/segments/:id", validateRequest(segmentParamSchema), adminSpinController.deleteSegment);
router.patch("/segments/:id/toggle-winnable", validateRequest(segmentParamSchema), adminSpinController.toggleWinnable);
router.patch("/segments/:id/update-quantity", validateRequest(updateQuantitySchema), adminSpinController.updateQuantity);

router.get("/players", adminSpinController.listPlayers);
router.get("/results", adminSpinController.results);

module.exports = router;
