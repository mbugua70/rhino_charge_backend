const jwt = require("jsonwebtoken");
const Player = require("../models/Player");
const Question = require("../models/Question");
const LevelAttempt = require("../models/LevelAttempt");
const QuestionAttempt = require("../models/QuestionAttempt");

const GAME_TYPES = {
  1: "trivia",
  2: "timed_trivia",
  3: "word_puzzle",
  4: "final_challenge",
};

const LEVEL_PREREQUISITES = { 1: null, 2: 1, 3: 2, 4: 3 };

const QUESTIONS_PER_LEVEL = 2;

const createToken = (player_id) =>
  jwt.sign({ player_id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const toPlainQuestion = (question) => {
  const doc = question.toObject ? question.toObject() : { ...question };
  delete doc.__v;
  return doc;
};

const findPlayerByName = (name) =>
  Player.findOne({ name: { $regex: `^${name.trim()}$`, $options: "i" } });

// POST /api/game/register
module.exports.register = async (req, res) => {
  try {
    const { name } = req.body;

    let player = await findPlayerByName(name);
    let isNew = !player;

    if (!player) {
      try {
        player = await Player.create({ name: name.trim() });
      } catch (err) {
        if (err.code === 11000) {
          // Race condition: another request created this player just now
          player = await findPlayerByName(name);
          isNew = false;
        } else {
          throw err;
        }
      }
    }

    const token = createToken(player._id);

    return res.status(isNew ? 201 : 200).json({
      success: true,
      message: isNew ? "Player registered successfully" : "Welcome back",
      token,
      player: {
        _id: player._id,
        name: player.name,
        isActive: player.isActive,
      },
      progress: {
        currentLevel: player.currentLevel,
        completedLevels: player.completedLevels,
        totalScore: player.totalScore,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/game/me
module.exports.me = async (req, res) => {
  try {
    const { player } = req;

    const levelAttempts = await LevelAttempt.find({ playerId: player._id }).sort(
      { level: 1 }
    );

    return res.status(200).json({
      success: true,
      player: {
        _id: player._id,
        name: player.name,
        totalScore: player.totalScore,
        currentLevel: player.currentLevel,
        completedLevels: player.completedLevels,
        isActive: player.isActive,
      },
      levelAttempts,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// POST /api/game/levels/:level/start
module.exports.startLevel = async (req, res) => {
  try {
    const { player } = req;
    const level = Number(req.params.level);
    const gameType = GAME_TYPES[level];

    // Check prerequisite
    const prerequisite = LEVEL_PREREQUISITES[level];
    if (prerequisite && !player.completedLevels.includes(prerequisite)) {
      return res.status(403).json({
        error: `You must complete Level ${prerequisite} before accessing Level ${level}`,
      });
    }

    // Check if already completed
    if (player.completedLevels.includes(level)) {
      return res.status(400).json({ error: `Level ${level} is already completed` });
    }

    // Reuse existing started attempt
    const existingAttempt = await LevelAttempt.findOne({
      playerId: player._id,
      level,
    });

    if (existingAttempt) {
      const existingQuestionAttempts = await QuestionAttempt.find({
        playerId: player._id,
        levelAttemptId: existingAttempt._id,
      }).populate("questionId");

      const questions = existingQuestionAttempts.map((a) =>
        toPlainQuestion(a.questionId)
      );

      return res.status(200).json({
        success: true,
        level,
        gameType,
        attemptId: existingAttempt._id,
        questions,
      });
    }

    // Get all questionIds this player has already been assigned
    const priorAttempts = await QuestionAttempt.find({
      playerId: player._id,
    }).select("questionId");
    const excludeIds = priorAttempts.map((a) => a.questionId);

    // Sample fresh questions
    const questions = await Question.aggregate([
      {
        $match: {
          level,
          gameType,
          isActive: true,
          _id: { $nin: excludeIds },
        },
      },
      { $sample: { size: QUESTIONS_PER_LEVEL } },
    ]);

    if (questions.length === 0) {
      return res.status(400).json({
        error: "No available questions for this level. Please contact the organizer.",
      });
    }

    // Create LevelAttempt
    const levelAttempt = await LevelAttempt.create({
      playerId: player._id,
      level,
      gameType,
      status: "started",
      startedAt: new Date(),
    });

    // Pre-seed QuestionAttempt records (empty answers)
    await QuestionAttempt.insertMany(
      questions.map((q) => ({
        playerId: player._id,
        levelAttemptId: levelAttempt._id,
        questionId: q._id,
        level,
        gameType,
      }))
    );

    return res.status(200).json({
      success: true,
      level,
      gameType,
      attemptId: levelAttempt._id,
      questions: questions.map(toPlainQuestion),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// POST /api/game/levels/:level/submit
module.exports.submitLevel = async (req, res) => {
  try {
    const { player } = req;
    const level = Number(req.params.level);
    const { score, answers } = req.body;

    const levelAttempt = await LevelAttempt.findOne({
      playerId: player._id,
      level,
    });

    if (!levelAttempt) {
      return res.status(400).json({ error: "Level not started" });
    }
    if (levelAttempt.status === "completed") {
      return res.status(400).json({ error: `Level ${level} is already completed` });
    }

    // Record each answer for audit trail
    if (answers && answers.length > 0) {
      const updates = answers.map((a) =>
        QuestionAttempt.findOneAndUpdate(
          {
            playerId: player._id,
            levelAttemptId: levelAttempt._id,
            questionId: a.questionId,
          },
          {
            selectedOptionKey: a.selectedOptionKey ?? null,
            selectedAnswerText: a.selectedAnswerText ?? null,
            timeTaken: a.timeTaken ?? null,
            answeredAt: new Date(),
          }
        )
      );
      await Promise.all(updates);
    }

    // Mark level as completed with frontend-provided score
    levelAttempt.status = "completed";
    levelAttempt.score = score;
    levelAttempt.completedAt = new Date();
    await levelAttempt.save();

    // Update player progress
    if (!player.completedLevels.includes(level)) {
      player.completedLevels.push(level);
    }

    const nextLevel = level < 4 ? level + 1 : null;
    if (nextLevel && player.currentLevel < nextLevel) {
      player.currentLevel = nextLevel;
    }

    // Recalculate totalScore by summing all completed LevelAttempts
    const allCompleted = await LevelAttempt.find({
      playerId: player._id,
      status: "completed",
    });
    player.totalScore = allCompleted.reduce((sum, a) => sum + a.score, 0);
    await player.save();

    return res.status(200).json({
      success: true,
      message: "Level completed successfully",
      levelScore: score,
      totalScore: player.totalScore,
      nextLevel,
      completedLevels: player.completedLevels,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/game/progress
module.exports.progress = async (req, res) => {
  try {
    const { player } = req;

    const levelAttempts = await LevelAttempt.find({ playerId: player._id }).sort(
      { level: 1 }
    );

    const unlockedLevel =
      player.completedLevels.length === 0
        ? 1
        : Math.min(Math.max(...player.completedLevels) + 1, 4);

    return res.status(200).json({
      success: true,
      currentLevel: player.currentLevel,
      completedLevels: player.completedLevels,
      totalScore: player.totalScore,
      unlockedLevel,
      levelAttempts: levelAttempts.map((a) => ({
        level: a.level,
        gameType: a.gameType,
        status: a.status,
        score: a.score,
        maxScore: a.maxScore,
        startedAt: a.startedAt,
        completedAt: a.completedAt,
      })),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/game/results
module.exports.results = async (req, res) => {
  try {
    const { player } = req;

    const levelAttempts = await LevelAttempt.find({
      playerId: player._id,
      status: "completed",
    }).sort({ level: 1 });

    const rank =
      (await Player.countDocuments({ totalScore: { $gt: player.totalScore } })) +
      1;

    return res.status(200).json({
      success: true,
      player: {
        _id: player._id,
        name: player.name,
        totalScore: player.totalScore,
        completedLevels: player.completedLevels,
      },
      rank,
      levelResults: levelAttempts.map((a) => ({
        level: a.level,
        gameType: a.gameType,
        score: a.score,
        maxScore: a.maxScore,
        completedAt: a.completedAt,
      })),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/game/leaderboard
module.exports.leaderboard = async (req, res) => {
  try {
    const { page, limit } = req.query;

    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 10, 100);
    const skip = (pageNum - 1) * limitNum;

    const [players, total] = await Promise.all([
      Player.find({ isActive: true })
        .sort({ totalScore: -1 })
        .skip(skip)
        .limit(limitNum)
        .select("name totalScore completedLevels"),
      Player.countDocuments({ isActive: true }),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      leaderboard: players.map((p, i) => ({
        rank: skip + i + 1,
        name: p.name,
        totalScore: p.totalScore,
        completedLevels: p.completedLevels,
      })),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
