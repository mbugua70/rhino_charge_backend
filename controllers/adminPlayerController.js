const Player = require("../models/Player");
const LevelAttempt = require("../models/LevelAttempt");

// GET /api/admin/players
module.exports.listPlayers = async (req, res) => {
  try {
    const { page, limit, isActive, completedLevels } = req.query;
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 20, 200);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (completedLevels !== undefined) filter.completedLevels = Number(completedLevels);

    const [players, total] = await Promise.all([
      Player.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select("-__v"),
      Player.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      players,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/admin/players/:id
module.exports.getPlayer = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id).select("-__v");
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    const levelAttempts = await LevelAttempt.find({ playerId: player._id })
      .sort({ level: 1 })
      .select("-__v");

    return res.status(200).json({
      success: true,
      player,
      levelAttempts,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
