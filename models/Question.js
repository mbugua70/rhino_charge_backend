const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const questionSchema = new Schema(
  {
    level: {
      type: Number,
      required: [true, "Level is required"],
      enum: [1, 2, 3, 4],
    },
    gameType: {
      type: String,
      required: [true, "Game type is required"],
      enum: ["trivia", "timed_trivia", "word_puzzle", "final_challenge"],
    },
    questionText: {
      type: String,
      trim: true,
    },
    options: {
      type: [String],
      default: [],
    },
    correctAnswer: {
      type: String,
      required: [true, "Correct answer is required"],
      trim: true,
    },
    scrambledWord: {
      type: String,
      trim: true,
    },
    hint: {
      type: String,
      trim: true,
    },
    points: {
      type: Number,
      default: 10,
    },
    timeLimitSeconds: {
      type: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);
module.exports = Question;
