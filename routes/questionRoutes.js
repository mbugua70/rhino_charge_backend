const { Router } = require("express");
const questionController = require("../controllers/questionController");
const validateRequest = require("../middleware/validateRequest");
const {
  createQuestionSchema,
  updateQuestionSchema,
  questionIdSchema,
} = require("../schemas/question.schema");

const router = Router();

router.post("/", validateRequest(createQuestionSchema), questionController.createQuestion);
router.get("/", questionController.getAllQuestions);
router.get("/:id", validateRequest(questionIdSchema), questionController.getQuestion);
router.patch("/:id", validateRequest(updateQuestionSchema), questionController.updateQuestion);
router.delete("/:id", validateRequest(questionIdSchema), questionController.deleteQuestion);

module.exports = router;
