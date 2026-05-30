const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const playerSpinSchema = new Schema(
  {
    player_id: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: [true, "player_id is required"],
      unique: true,
    },
    player_name: {
      type: String,
      required: [true, "player_name is required"],
    },
    has_spun: {
      type: Boolean,
      default: false,
    },
    spun_at: {
      type: Date,
      default: null,
    },
    segment_id: {
      type: Schema.Types.ObjectId,
      ref: "SpinSegment",
      default: null,
    },
    prize_name: {
      type: String,
      default: null,
    },
    prize_snapshot: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

const PlayerSpin = mongoose.model("PlayerSpin", playerSpinSchema);
module.exports = PlayerSpin;
