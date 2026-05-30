const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const spinSegmentSchema = new Schema(
  {
    text: {
      type: String,
      required: [true, "Text is required"],
      trim: true,
    },
    fillStyle: {
      type: String,
      required: [true, "fillStyle is required"],
    },
    strokeStyle: {
      type: String,
      default: "#ffffff",
    },
    textFillStyle: {
      type: String,
      default: "#ffffff",
    },
    gift_number: {
      type: Number,
      default: 0,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_winnable: {
      type: Boolean,
      default: true,
    },
    sort_order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const SpinSegment = mongoose.model("SpinSegment", spinSegmentSchema);
module.exports = SpinSegment;
