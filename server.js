require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger/swagger");

// Models
require("./models/Player");
require("./models/Question");
require("./models/LevelAttempt");
require("./models/QuestionAttempt");
require("./models/AdminUser");
require("./models/SpinSegment");
require("./models/PlayerSpin");

// Routes
const gameRoutes = require("./routes/gameRoutes");
const questionRoutes = require("./routes/questionRoutes");
const authRoutes = require("./routes/authRoutes");
const spinRoutes = require("./routes/spinRoutes");
const adminSpinRoutes = require("./routes/adminSpinRoutes");

const app = express();

// CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(req.method, req.path);
  next();
});

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.get("/", (req, res) => res.json({ message: "Safaricom QR Game API" }));
app.use("/api/game", gameRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/spin", spinRoutes);
app.use("/api/admin/spin", adminSpinRoutes);

// Connect to MongoDB then start server
mongoose
  .connect(process.env.MONGODB_STRING)
  .then(async () => {
    // Drop stale phone index left over from before name became the unique key
    try {
      await mongoose.connection.collection("players").dropIndex("phone_1");
      console.log("Dropped stale phone_1 index");
    } catch (_) {
      // Index doesn't exist — nothing to do
    }

    app.listen(process.env.PORT, () => {
      console.log(`Connected to DB. Server running on port ${process.env.PORT}`);
      console.log(`Swagger docs at http://localhost:${process.env.PORT}/api-docs`);
    });
  })
  .catch((err) => console.log(err));
