# Savor — Recipe & Pantry Manager

A SQL-backed mini project for discovering recipes, tracking pantry stock and expiry dates, saving favorites, and leaving ratings. This implements the SQL and web-interface components of the supplied DBMS guide. The guide's NoSQL/vector database component is intentionally excluded per project scope.

## Stack and scope

- Next.js App Router, React, TypeScript, responsive CSS
- PostgreSQL with parameterized SQL through `pg`
- Seven relational tables, constraints, indexes, a reporting view, trigger, stored function, and full-text search
- Registration/sign-in, student/admin roles, recipes, ingredients, pantry, favorites, reviews, recipe filtering, and transactional stock consumption
- No MongoDB, document database, or vector database component is included.

## Run locally

Requirements: Node.js 20.9+ and Docker Desktop (or a local PostgreSQL 15+ server).

1. Install packages:

   ```powershell
   npm install
   ```

2. Start PostgreSQL using Docker Compose:

   ```powershell
   docker compose up -d db
   ```

   Or create a PostgreSQL database named `recipe_pantry` and adjust `DATABASE_URL`.

3. Copy `.env.example` to `.env.local`. Set a random `APP_SECRET` with at least 32 characters. The example database URL is for the local Compose service only.

   ```powershell
   Copy-Item .env.example .env.local
   ```

4. Create the tables and seed demo records:

   ```powershell
   npm run db:setup
   npm run db:seed
   ```

5. Run the app at http://localhost:3000:

   ```powershell
   npm run dev
   ```

Demo accounts (local demonstration only):

- Student: `student.demo@example.test` / `Student123!`
- Admin: `admin.demo@example.test` / `Admin123!`

The seed utility stores bcrypt hashes. Do not use these demo credentials in deployment.

## Demo walkthrough

1. Sign in as the student and show Discover, recipe cards, ratings, search, and the “In my pantry” filter.
2. Open My pantry, show quantities and expiry dates, add an ingredient, and remove an item.
3. Return to Discover. Show pantry matches; select “I made it” to deduct ingredients. The operation is transactional and uses earliest-expiring lots first. Try an unavailable recipe to show the insufficient-stock response.
4. Favorite a recipe and switch to Favorites. Leave a rating and comment.
5. Create a recipe with multiple ingredient quantities to demonstrate the recipe_ingredients junction table.
6. Sign in as admin. The admin role can add catalog ingredients through `POST /api/ingredients`; a student cannot.
7. For the SQL portion, show `db/schema.sql`, run query examples from the report, and explain the ER-to-relational mapping and constraints.

## API routes

| Route | Methods | Purpose |
|---|---|---|
| `/api/auth/register`, `/login`, `/logout`, `/me` | POST / GET | Account lifecycle and current session |
| `/api/recipes` | GET, POST | Search/filter recipes and create a recipe |
| `/api/recipes/:id` | GET, PUT, DELETE | Read/manage a recipe; owner/admin checks |
| `/api/recipes/:id/reviews` | POST | Create or update the current user's review |
| `/api/recipes/:id/cook` | POST | Deduct stock atomically across unexpired lots |
| `/api/pantry`, `/api/pantry/:id` | GET, POST, PATCH, DELETE | User-owned inventory and expiry data |
| `/api/favorites`, `/api/favorites/:recipeId` | GET, POST | Saved recipes and favorite toggle |
| `/api/ingredients` | GET, POST | Admin-only catalog creation |

## Data integrity and security

- Passwords are hashed with bcrypt; passwords and session tokens are never returned by APIs.
- Sessions use a signed, seven-day, HTTP-only, SameSite cookie. `APP_SECRET` must be at least 32 characters.
- Writes use server-side validation and parameterized SQL. Role and resource ownership checks run on the server.
- Foreign keys and check constraints enforce references, ratings, quantities, and roles.
- Recipe cooking runs in a database transaction and rolls back if stock is insufficient.
- Same-origin checks guard state-changing requests. Production cookies use the Secure flag.
- Keep `.env.local` private. Configure TLS for PostgreSQL and HTTPS when deployed.

## Checks

`npm test` runs schema/seed integrity checks. `npm run lint` and `npm run build` check the frontend. Database integration checks require a running PostgreSQL service.

## Files

- `db/schema.sql` — relational DDL, indexes, view, trigger, stored function, and SQL examples
- `db/seed.sql` — repeatable demonstration data
- `docs/PROJECT_REPORT.md` — project specification, ERD, schema, data dictionary, architecture, queries, test plan, and demo notes
- `tests/validation.test.mjs` — schema integrity checks

The demo seed contains three recipes and nine ingredient catalogue entries. Run `npm run db:seed` again to add or refresh the demo records without deleting unrelated user data.
