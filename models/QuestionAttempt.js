const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const questionAttemptSchema = new Schema(
  {
    playerId: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    levelAttemptId: {
      type: Schema.Types.ObjectId,
      ref: "LevelAttempt",
      required: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
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
    selectedAnswer: {
      type: String,
      default: null,
    },
    submittedAnswer: {
      type: String,
      default: null,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
    scoreAwarded: {
      type: Number,
      default: 0,
    },
    timeTaken: {
      type: Number,
      default: null,
    },
    answeredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const QuestionAttempt = mongoose.model("QuestionAttempt", questionAttemptSchema);
module.exports = QuestionAttempt;
