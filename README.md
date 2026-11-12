# Savor — Recipe & Pantry Manager

A dual-database mini project for discovering recipes, tracking pantry stock and expiry dates, saving favorites, leaving ratings, and logging flexible cooking sessions. Implements the SQL **and** NoSQL components of the DBMS Level 3 guide.

## Stack and scope

- **Frontend:** Next.js App Router, React, TypeScript, responsive CSS
- **SQL Database (mandatory):** PostgreSQL — accounts, ingredients, recipes, pantry lots, favorites, reviews, constraints, indexes, view, trigger, stored function, full-text search, transactional stock deduction
- **NoSQL Database:** MongoDB — flexible `cooking_logs` documents (notes, substitutions, cook ratings, time taken, tags, ingredients used). Demonstrates document model, indexes, and aggregation pipelines
- Registration/sign-in, student/admin roles, recipe filtering, and “I made it” which both updates SQL pantry stock and writes a MongoDB cooking session
- Environment variables for all database credentials (nothing hard-coded)

## Why SQL + NoSQL?

| Data | Store | Justification |
|------|--------|----------------|
| Users, recipes, ingredient catalogue, pantry quantities, favorites, reviews | PostgreSQL | Strong relational integrity, foreign keys, transactions for atomic stock deduction, joins for “makeable” recipes |
| Cooking session history (variable notes, substitutions, optional ratings, tags) | MongoDB | Schema-flexible documents; fields differ per cook; natural fit for append-only activity logs and aggregation analytics |

## Run locally

Requirements: Node.js 20.9+, Docker Desktop (or local PostgreSQL 15+ and MongoDB 6+).

1. Install packages:

   ```bash
   npm install
   ```

2. Start PostgreSQL **and** MongoDB:

   ```bash
   docker compose up -d
   ```

3. Copy `.env.example` to `.env.local`. Set a random `APP_SECRET` (≥ 32 characters).

   ```bash
   cp .env.example .env.local
   ```

4. Create SQL tables + seed, then Mongo indexes + sample logs:

   ```bash
   npm run db:setup
   npm run db:seed
   npm run mongo:setup
   npm run mongo:seed
   ```

5. Run the app:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000

Demo accounts (local only):

- Student: `student.demo@example.test` / `Student123!`
- Admin: `admin.demo@example.test` / `Admin123!`

## Demo walkthrough (NoSQL focus)

1. Sign in as student. Browse Discover, filter by pantry, cook a recipe (“I made it”). Optionally enter a note when prompted — it is stored as a MongoDB document.
2. Open the **History** tab. View cooking session logs, top recipes (aggregation), cuisine breakdown, and summary stats — all from MongoDB.
3. Show indexes and aggregation examples in code / Mongo shell if needed.
4. For SQL portion: ER diagram, schema, view, trigger, stored function, transactional cook, as before.

## API routes (additions)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/cooking-logs` | GET, POST | List / create flexible cooking session documents (MongoDB) |
| `/api/cooking-logs/stats` | GET | Aggregation pipelines: top recipes, cuisine counts, averages |
| `/api/recipes/:id/cook` | POST | SQL stock deduction **+** MongoDB cooking log (optional body: notes, ratingOfCook, etc.) |

## NoSQL data model (`cooking_logs`)

```js
{
  userId: Number,           // links to SQL users.user_id
  recipeId: Number,         // links to SQL recipes.recipe_id
  recipeTitle: String,      // denormalized
  cuisine: String,
  cookedAt: Date,
  notes: String?,
  substitutions: [{ original, used }]?,
  ratingOfCook: Number?,    // 1–5
  timeTakenMinutes: Number?,
  servings: Number?,
  success: Boolean,
  ingredientsUsed: [{ name, quantity, unit }]?,
  tags: [String]?,
  metadata: Object?
}
```

**Indexes:** `{ userId: 1, cookedAt: -1 }`, `{ recipeId: 1 }`, `{ cuisine: 1 }`, text index on `notes` + `recipeTitle` + `tags`.

**Advanced NoSQL features demonstrated:** document model, secondary indexes, text search index, multiple aggregation pipelines (`$group`, `$sort`, `$project`, `$avg`, `$sum`, `$match`).

## Data integrity and security

- Passwords hashed with bcrypt; credentials only via environment variables.
- Sessions: signed HTTP-only cookies.
- Parameterized SQL; role and ownership checks on the server.
- MongoDB writes are best-effort after successful SQL commit (cook still succeeds if Mongo is temporarily unavailable).

## Files of interest

- `db/schema.sql` — PostgreSQL DDL + advanced SQL features
- `lib/mongo.ts` — MongoDB client, collection, indexes
- `app/api/cooking-logs/` — NoSQL API
- `app/api/recipes/[id]/cook/route.ts` — dual-write on cook
- `scripts/setup-mongo.mjs`, `scripts/seed-mongo.mjs`
- `docs/PROJECT_REPORT.md` — full documentation including NoSQL section

## Checks

```bash
npm test
npm run lint
npm run build
```
