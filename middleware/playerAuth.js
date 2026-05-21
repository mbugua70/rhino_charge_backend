const jwt = require("jsonwebtoken");
const Player = require("../models/Player");

const playerAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: "Authorization token required" });
  }

  const token = authorization.split(" ")[1];

  try {
    const { player_id } = jwt.verify(token, process.env.JWT_SECRET);
    req.player = await Player.findById(player_id).select("-__v");
    if (!req.player) {
      return res.status(401).json({ error: "Player not found" });
    }
    next();
  } catch (err) {
    res.status(401).json({ error: "Request is not authorized" });
  }
};

module.exports = playerAuth;
