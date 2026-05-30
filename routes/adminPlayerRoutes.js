const { Router } = require("express");
const adminPlayerController = require("../controllers/adminPlayerController");
const adminAuth = require("../middleware/adminAuth");

const router = Router();

router.use(adminAuth);

router.get("/", adminPlayerController.listPlayers);
router.get("/:id", adminPlayerController.getPlayer);

module.exports = router;
