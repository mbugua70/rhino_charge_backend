const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const levelAttemptSchema = new Schema(
  {
    playerId: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    level: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4],
    },
    gameType: {
      type: String,
      required: true,
      enum: ["trivia", "timed_trivia", "word_puzzle", "final_challenge"],
    },
    status: {
      type: String,
      enum: ["started", "completed"],
      default: "started",
    },
    score: {
      type: Number,
      default: 0,
    },
    maxScore: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

levelAttemptSchema.index({ playerId: 1, level: 1 }, { unique: true });

const LevelAttempt = mongoose.model("LevelAttempt", levelAttemptSchema);
module.exports = LevelAttempt;
