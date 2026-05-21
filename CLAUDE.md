# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start development server (with auto-reload via nodemon)
npm run dev

# Install dependencies
npm install
```

No test framework is configured (`npm test` exits with an error).

## Environment

Requires a `.env` file with:
- `MONGODB_STRING` — MongoDB connection URI
- `PORT` — server port
- `SECRET_STRING` — JWT signing secret
- `FIREBASE_BUCKET` — Firebase Storage bucket name
- `FIREBASE_SERVICE_ACCOUNT` — Firebase service account JSON (stringified). If absent, falls back to a local `colgateform-firebase-adminsdk-fbsvc-b2728c29f0.json` file in the project root.

## Architecture

Express.js REST API backend for a Colgate-branded quiz/trivia game with a photo-submission contest feature. Connects to MongoDB via Mongoose; the HTTP server starts only after a successful DB connection.

**Request flow:** `server.js` → `routes/` → `controllers/` → `models/`

Firebase Storage (`config/firebase.js`) is used exclusively by `formController.js` to upload contestant photos.

### API Routes

| Prefix | File | Purpose |
|---|---|---|
| `/api/questions` | `routes/questionRoutes.js` | Quiz questions |
| `/api/players` | `routes/user.js` | Player registration & scores |
| `/api/colors/` | `routes/colorsAnswer.js` | Color answer options |
| `/api/submissions` | `routes/formRoutes.js` | Contest form submissions with photo upload |
| `/api/admin` | `routes/adminRoutes.js` | Admin registration & login |
| `/api/reports` | `routes/reportsRoutes.js` | Paginated submission reports (auth-protected) |

### Authentication

There are **two separate JWT auth flows** sharing the same `SECRET_STRING`:

- **Player tokens** — issued by `POST /api/players/signup`, attached to `Player` documents (no middleware protection on player routes).
- **Admin tokens** — issued by `POST /api/admin/login`, attached to `Admin` documents. The `requireAuth` middleware (`middleware/requireAuth.js`) validates these tokens and attaches `req.admin`. Currently only `GET /api/reports` enforces this middleware.

### Key Design Notes

- **`/api/questions`** (`GET /`) returns 10 random questions via `$sample` aggregation from the `sample_one_trivia` collection.
- **`/api/players`** (`POST /signup`) registers a player with `name` and `score`, returns a JWT. `PATCH /signup/:id` updates a player record. `GET /all` returns all players sorted by creation date.
- **`/api/colors`** (`GET /`) fetches all documents from the `colors_answer` collection.
- **`/api/submissions`** (`POST /`) accepts `multipart/form-data` with fields `name`, `phone`, `box_location`, `guess_name`, `region`, and a `photo` file. The photo is uploaded to Firebase Storage (made public), and the resulting URL is stored in MongoDB. Phone numbers are unique — duplicate submissions return 409.
- **`/api/submissions/dashboard`** (`GET /`) returns submission counts grouped by region.
- **`/api/submissions/all`** and **`/api/submissions/region/:region`** support `start_date`, `end_date`, `page`, and `limit` query params (limit capped at 2000).
- **`/api/admin/register`** and **`/api/admin/login`** manage admin accounts; passwords are bcrypt-hashed via a pre-save hook on the `Admin` model.
- **CORS** allows all origins (`*`) with GET, POST, PATCH, DELETE, PUT methods and `Content-Type`/`Authorization` headers.

### MongoDB Collections

- `sample_one_trivia` — quiz questions (`text`, `answers[]`, `correct_answer` index)
- `Player` — player records (`name`, `score`, `questionscore[]`)
- `colors_answer` — color answer sets (`colors_answers[]`)
- `FormSubmission` — contest entries (`name`, `phone` unique, `box_location`, `guess_name`, `region`, `photo_url`, timestamps)
- `Admin` — admin accounts (`username` unique, bcrypt `password`, timestamps)
