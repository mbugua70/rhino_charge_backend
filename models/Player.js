const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const playerSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      unique: true,
      trim: true,
      index: true,
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    currentLevel: {
      type: Number,
      default: 1,
    },
    completedLevels: {
      type: [Number],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    player_code: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
  },
  { timestamps: true }
);

const generateCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

playerSchema.pre("save", async function (next) {
  if (this.player_code) return next();
  let code;
  let exists = true;
  while (exists) {
    code = generateCode();
    exists = await this.constructor.exists({ player_code: code });
  }
  this.player_code = code;
  next();
});

const Player = mongoose.model("Player", playerSchema);
module.exports = Player;
