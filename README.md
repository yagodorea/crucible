# Crucible - D&D Character Creator

A monorepo web application for creating D&D 5e characters. React + Vite frontend with an Express API backend, Supabase PostgreSQL for persistence, and preprocessed 5etools data for game content.

## Project Structure

```
crucible/
├── apps/
│   ├── frontend/           # React 19 + Vite SPA
│   └── backend/            # Express.js API
│       ├── data/           # Preprocessed D&D JSON (~880KB)
│       ├── scripts/        # Data preprocessing pipeline
│       └── src/            # Application source
└── package.json            # npm workspaces root
```

## Getting Started

### Prerequisites

- Node.js >= 20
- A Supabase project (for database + auth)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp apps/backend/.env.example apps/backend/.env
```

Set your Supabase credentials:
```
PORT=5001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

For the frontend (optional, defaults to `http://localhost:5001/api`):
```
VITE_API_URL=http://localhost:5001/api
```

### 3. Run

```bash
npm run dev:backend     # Terminal 1 - http://localhost:5001
npm run dev:frontend    # Terminal 2 - http://localhost:5173
```

### 4. Build

```bash
npm run build           # Builds both apps
```

### 5. Test

```bash
npm test                # Backend integration tests (Vitest)
```

---

## Architecture

### Overview

```
Browser ──► React SPA ──► Express API ──► Supabase (users, characters, api_keys)
                               │
                               └──► Preprocessed JSON files (D&D game data)
```

Authentication is API key-based. Keys are SHA-256 hashed and stored in Supabase. The frontend stores the key in localStorage and sends it via the `X-Api-Key` header on every request.

### Frontend (`apps/frontend/`)

| Layer | Details |
|-------|---------|
| Framework | React 19, TypeScript, Vite 7 |
| Routing | React Router DOM v7 |
| HTTP | Axios with interceptors (auto-attaches API key, handles 401) |
| State | React hooks + localStorage persistence |
| Auth | `AuthContext` stores API key, gates all routes behind login |

**Pages:**
- `/` - Home
- `/create` - Character creation wizard (5 steps)
- `/characters` - Character list
- `/characters/:id` - Character details

**Character Creation Flow:**
1. Choose a Class (filterable by source book)
2. Choose a Background
3. Choose a Species
4. Set Ability Scores
5. Fill in Details (name, alignment, languages, appearance, lore)

Each step has info modals that fetch detailed data from the API. Selections and source preferences persist to localStorage across sessions.

### Backend (`apps/backend/`)

| Layer | Details |
|-------|---------|
| Framework | Express.js, TypeScript (ES2022 modules) |
| Database | Supabase PostgreSQL via `@supabase/supabase-js` |
| Auth | API key validation middleware (SHA-256 hash lookup) |
| Testing | Vitest + Supertest integration tests |
| Dev | `tsx watch` for hot reload |

**Request lifecycle:**
```
Request → CORS → JSON parser → API key validation → Controller → Service → Response
```

**Source layout:**

```
src/
├── app.ts                    # Express app setup, middleware, routes
├── index.ts                  # Server entry point
├── config/
│   └── database.ts           # Supabase client
├── middleware/
│   └── apiKeyAuth.ts         # X-Api-Key validation
├── controllers/
│   ├── dataController.ts     # D&D data endpoints
│   ├── characterController.ts
│   └── userController.ts
├── services/
│   └── dataService.ts        # JSON file reader with in-memory cache
├── models/
│   ├── Character.ts          # DB ↔ API transforms
│   └── User.ts
├── routes/
│   ├── dataRoutes.ts
│   ├── characterRoutes.ts
│   └── userRoutes.ts
└── tests/
    └── integration/          # API integration tests
```

---

## Data Layer

### How It Works

The app serves D&D game data (classes, races, backgrounds, languages) from preprocessed JSON files. A build-time script transforms ~106MB of raw 5etools-format JSON into ~880KB of clean, normalized data.

```
Raw 5etools JSON ──► preprocess script ──► Normalized JSON ──► DataService (read + cache)
    (data/_raw/)                              (data/)              (in-memory)
```

At runtime, `DataService` is a thin read-and-cache layer (~200 lines). It reads JSON files once, caches them in memory, and serves them to the API controllers. There is no runtime parsing, markup cleaning, or data merging.

### Preprocessed Files

```
data/
├── classes.json          # Array of 13 class summaries
├── classes/
│   ├── barbarian.json    # Full class detail + subclass details
│   ├── bard.json
│   └── ... (13 files)
├── races.json            # 91 races grouped by name, with descriptions
├── backgrounds.json      # 142 backgrounds grouped by name, with descriptions
└── languages.json        # 111 deduplicated language names
```

**classes.json** - Summary list returned by `GET /api/data/classes`:
```json
[
  {
    "name": "Fighter",
    "source": "XPHB",
    "primaryAbility": "Strength or Dexterity",
    "complexity": "Low",
    "hd": { "number": 1, "faces": 10 },
    "proficiency": ["str", "con"]
  }
]
```

**classes/{name}.json** - Full detail returned by class/subclass detail endpoints:
```json
{
  "detail": {
    "name": "Fighter",
    "source": "XPHB",
    "description": "Fighters rule many battlefields...",
    "primaryAbility": "Strength or Dexterity",
    "complexity": "Low",
    "hd": { "number": 1, "faces": 10 },
    "proficiency": ["str", "con"],
    "startingProficiencies": { "armor": [...], "weapons": [...], "skills": [...] },
    "subclasses": ["Battle Master", "Champion", ...],
    "features": [{ "name": "Fighting Style", "level": 1, "entries": ["..."] }]
  },
  "subclasses": {
    "champion": {
      "name": "Champion",
      "source": "XPHB",
      "className": "Fighter",
      "description": "...",
      "features": [...]
    }
  }
}
```

**races.json** and **backgrounds.json** group entries by name with a `descriptions` array containing one object per source book (e.g., PHB vs XPHB variants of the same race). Each description includes mechanical data (abilities, proficiencies, traits) alongside flavor text.

### Preprocessing Pipeline

```bash
npm run preprocess -w backend    # Requires data/_raw/ with 5etools files
```

The pipeline (`scripts/preprocess-data.ts`) reads raw 5etools JSON from `data/_raw/` and outputs to `data/`. It:

1. **Cleans markup** - Strips `{@tag text|ref}` patterns (spell links, item refs, dice notation, etc.) via iterative regex replacement
2. **Extracts text** - Recursively walks 5etools entry trees (entries, sections, quotes, rows, inline blocks) into plain text
3. **Filters editions** - Selects `edition: "one"` (2024 rules) where available, falls back to first entry
4. **Merges fluff** - Combines mechanical data with descriptive text from separate fluff files
5. **Resolves references** - Looks up feat references by name+source, handles subtyped refs like `"magic initiate; cleric|xphb"`
6. **Normalizes shapes** - Standardizes speed formats, extracts proficiencies/languages/equipment into consistent structures
7. **Bakes in metadata** - Embeds `primaryAbility` and `complexity` ratings directly into class data

Helper modules:
- `scripts/lib/markup-cleaner.ts` - `cleanMarkup()` and `cleanMarkupDeep()` for tag stripping
- `scripts/lib/entry-extractor.ts` - `extractEntries()` and `extractFeatDescription()` for text extraction

---

## API Reference

All endpoints require the `X-Api-Key` header (except auth validation).

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/validate` | Validate an API key |

### D&D Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/data/classes` | List all classes (summary) |
| GET | `/api/data/classes/:className` | Full class detail |
| GET | `/api/data/classes/:className/subclasses/:subclassName` | Subclass detail |
| GET | `/api/data/races` | List all races (flattened by source) |
| GET | `/api/data/races/:raceName` | Full race detail (grouped descriptions) |
| GET | `/api/data/backgrounds` | List all backgrounds (flattened by source) |
| GET | `/api/data/backgrounds/:backgroundName` | Full background detail (grouped descriptions) |
| GET | `/api/data/sources` | Unique source book codes |
| GET | `/api/data/languages` | Sorted language name list |

### Characters

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/characters` | List all characters |
| GET | `/api/characters/:id` | Get character by ID |
| POST | `/api/characters` | Create character |
| PUT | `/api/characters/:id` | Update character |
| DELETE | `/api/characters/:id` | Delete character |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create user |
| GET | `/api/users/:id` | Get user by ID |

---

## Database Schema

Hosted on Supabase PostgreSQL. Schema defined in `supabase-schema.sql`.

**users** - Application users
- `id` (UUID PK), `name`, `email` (unique), `created_at`

**api_keys** - Authentication keys (SHA-256 hashed)
- `id` (UUID PK), `user_id` (FK), `key_hash` (unique), `label`, `created_at`, `last_used_at`

**characters** - Created characters
- `id` (UUID PK), `character_id` (nanoid, unique), `name`, `class`, `background`, `species`
- `level` (1-20), six ability scores (1-30 each), `alignment` (enum)
- `languages` (text[]), `appearance`, `lore`, `created_by` (FK), timestamps

---

## Deployment

Docker containerized, deployed to GCP Compute Engine via GitHub Actions.

**CI/CD pipeline** (`.github/workflows/deploy-backend.yml`):
1. Build frontend → copy dist to backend/public
2. Build Docker image (multi-stage, node:20-alpine)
3. Push to GCP Artifact Registry
4. SSH deploy to Compute Engine (port 80 → 5001)

The backend serves the frontend SPA as static files in production, with a fallback to `index.html` for client-side routing.

```bash
# Manual Docker build
docker build -t crucible -f apps/backend/Dockerfile .
docker run -p 5001:5001 --env-file apps/backend/.env crucible
```

---

## Technologies

| | Stack |
|---|---|
| Frontend | React 19, TypeScript, Vite 7, React Router 7, Axios |
| Backend | Express.js, TypeScript (ES2022), tsx |
| Database | Supabase PostgreSQL |
| Auth | API key (SHA-256 hash) |
| Testing | Vitest, Supertest |
| CI/CD | GitHub Actions, Docker, GCP Compute Engine |
| Data | Preprocessed 5etools JSON |
