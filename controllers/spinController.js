const Player = require("../models/Player");
const SpinSegment = require("../models/SpinSegment");
const PlayerSpin = require("../models/PlayerSpin");

// GET /api/spin/segments/public
module.exports.publicSegments = async (req, res) => {
  try {
    const segments = await SpinSegment.find({ is_active: true })
      .sort({ sort_order: 1 })
      .select("-__v");

    return res.status(200).json({ success: true, segments });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// POST /api/spin/register
module.exports.register = async (req, res) => {
  try {
    const { player_id } = req.body;

    const player = await Player.findById(player_id);
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    let spinRecord = await PlayerSpin.findOne({ player_id });
    if (spinRecord) {
      return res.status(200).json({
        success: true,
        message: "Player already registered for spin",
        spin: spinRecord,
      });
    }

    spinRecord = await PlayerSpin.create({
      player_id: player._id,
      player_name: player.name,
      has_spun: false,
    });

    return res.status(201).json({
      success: true,
      message: "Player registered for spin",
      spin: spinRecord,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// POST /api/spin/play
module.exports.play = async (req, res) => {
  try {
    const { player_id } = req.body;

    const player = await Player.findById(player_id);
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    const spinRecord = await PlayerSpin.findOne({ player_id });
    if (!spinRecord) {
      return res.status(404).json({
        error: "Player not registered for spin. Call /api/spin/register first.",
      });
    }

    if (spinRecord.has_spun) {
      const segment = await SpinSegment.findById(spinRecord.segment_id).select("-__v");
      return res.status(200).json({
        success: true,
        message: "Player has already spun",
        already_spun: true,
        spin: spinRecord,
        segment,
      });
    }

    const eligibleSegments = await SpinSegment.find({
      is_active: true,
      is_winnable: true,
      quantity: { $gt: 0 },
    });

    if (eligibleSegments.length === 0) {
      return res.status(400).json({ error: "No prizes available at this time" });
    }

    const selected = eligibleSegments[Math.floor(Math.random() * eligibleSegments.length)];

    // Atomically decrement quantity to guard against race conditions
    const segment = await SpinSegment.findOneAndUpdate(
      { _id: selected._id, quantity: { $gt: 0 } },
      { $inc: { quantity: -1 } },
      { new: true }
    );

    if (!segment) {
      return res.status(409).json({ error: "Prize just ran out, please try again" });
    }

    const prizeSnapshot = {
      text: segment.text,
      fillStyle: segment.fillStyle,
      strokeStyle: segment.strokeStyle,
      textFillStyle: segment.textFillStyle,
      gift_number: segment.gift_number,
    };

    spinRecord.has_spun = true;
    spinRecord.spun_at = new Date();
    spinRecord.segment_id = segment._id;
    spinRecord.prize_name = segment.text;
    spinRecord.prize_snapshot = prizeSnapshot;
    await spinRecord.save();

    return res.status(200).json({
      success: true,
      message: "Spin successful",
      already_spun: false,
      spin: spinRecord,
      segment,
      prize_snapshot: prizeSnapshot,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/spin/player/:playerId/result
module.exports.playerResult = async (req, res) => {
  try {
    const { playerId } = req.params;

    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    const spinRecord = await PlayerSpin.findOne({ player_id: playerId }).populate(
      "segment_id",
      "-__v"
    );
    if (!spinRecord) {
      return res.status(404).json({ error: "No spin record found for this player" });
    }

    return res.status(200).json({ success: true, spin: spinRecord });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
