const SpinSegment = require("../models/SpinSegment");
const PlayerSpin = require("../models/PlayerSpin");

// GET /api/admin/spin/segments
module.exports.listSegments = async (req, res) => {
  try {
    const segments = await SpinSegment.find().sort({ sort_order: 1 }).select("-__v");
    return res.status(200).json({ success: true, segments });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// POST /api/admin/spin/segments
module.exports.createSegment = async (req, res) => {
  try {
    const segment = await SpinSegment.create(req.body);
    return res.status(201).json({
      success: true,
      message: "Segment created",
      segment,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PATCH /api/admin/spin/segments/:id
module.exports.updateSegment = async (req, res) => {
  try {
    const segment = await SpinSegment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select("-__v");

    if (!segment) {
      return res.status(404).json({ error: "Segment not found" });
    }

    return res.status(200).json({ success: true, message: "Segment updated", segment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /api/admin/spin/segments/:id
module.exports.deleteSegment = async (req, res) => {
  try {
    const segment = await SpinSegment.findByIdAndDelete(req.params.id);
    if (!segment) {
      return res.status(404).json({ error: "Segment not found" });
    }
    return res.status(200).json({ success: true, message: "Segment deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PATCH /api/admin/spin/segments/:id/toggle-winnable
module.exports.toggleWinnable = async (req, res) => {
  try {
    const segment = await SpinSegment.findById(req.params.id);
    if (!segment) {
      return res.status(404).json({ error: "Segment not found" });
    }
    segment.is_winnable = !segment.is_winnable;
    await segment.save();
    return res.status(200).json({
      success: true,
      message: `Segment is_winnable set to ${segment.is_winnable}`,
      segment,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PATCH /api/admin/spin/segments/:id/update-quantity
module.exports.updateQuantity = async (req, res) => {
  try {
    const { quantity } = req.body;
    const segment = await SpinSegment.findByIdAndUpdate(
      req.params.id,
      { quantity },
      { new: true, runValidators: true }
    ).select("-__v");

    if (!segment) {
      return res.status(404).json({ error: "Segment not found" });
    }

    return res.status(200).json({ success: true, message: "Quantity updated", segment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/admin/spin/players
module.exports.listPlayers = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 20, 200);
    const skip = (pageNum - 1) * limitNum;

    const [players, total] = await Promise.all([
      PlayerSpin.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("segment_id", "text fillStyle gift_number")
        .select("-__v"),
      PlayerSpin.countDocuments(),
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

// GET /api/admin/spin/results
module.exports.results = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 20, 200);
    const skip = (pageNum - 1) * limitNum;

    const [results, total] = await Promise.all([
      PlayerSpin.find({ has_spun: true })
        .sort({ spun_at: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("segment_id", "text fillStyle gift_number")
        .select("-__v"),
      PlayerSpin.countDocuments({ has_spun: true }),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      results,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
