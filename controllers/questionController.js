const Question = require("../models/Question");

// POST /api/questions
module.exports.createQuestion = async (req, res) => {
  try {
    const question = await Question.create(req.body);
    return res.status(201).json({ success: true, question });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/questions
module.exports.getAllQuestions = async (req, res) => {
  try {
    const { level, gameType, isActive } = req.query;

    const filter = {};
    if (level) filter.level = Number(level);
    if (gameType) filter.gameType = gameType;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const questions = await Question.find(filter).sort({ level: 1, createdAt: -1 });
    return res.status(200).json({ success: true, count: questions.length, questions });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/questions/:id
module.exports.getQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    return res.status(200).json({ success: true, question });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PATCH /api/questions/:id
module.exports.updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    return res.status(200).json({ success: true, question });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /api/questions/:id
module.exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    return res.status(200).json({ success: true, message: "Question deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
