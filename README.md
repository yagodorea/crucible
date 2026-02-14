# Crucible - D&D Character Creator

A monorepo application with a Vite React frontend and MongoDB-based Express backend for creating D&D 5e characters.

## 🚀 Deployment

The frontend deploys automatically to GitHub Pages on push to `main`. See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

## Project Structure

```
crucible/
├── apps/
│   ├── frontend/          # Vite React application
│   └── backend/           # Express + MongoDB API
└── package.json           # Root package.json with workspaces
```

## Prerequisites

- Node.js >= 18.0.0
- MongoDB (local or remote instance)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Backend Environment

Create a `.env` file in `apps/backend/`:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit the `.env` file with your MongoDB connection string.

### 3. Run Applications

**Run both frontend and backend:**
```bash
npm run dev
```

**Run frontend only:**
```bash
npm run dev:frontend
```

**Run backend only:**
```bash
npm run dev:backend
```

### 4. Build Applications

```bash
npm run build
```

## Default Ports

- Frontend: http://localhost:5173
- Backend: http://localhost:5001

## Features

### Character Creation Flow
1. **Choose a Class** - Select from 12 D&D classes with complexity indicators
2. **Choose a Background** - Pick your character's background story
3. **Choose a Species** - Select your character's race/species
4. **Determine Ability Scores** - Set STR, DEX, CON, INT, WIS, CHA
5. **Choose Alignment** - Select your moral compass (Lawful/Neutral/Chaotic + Good/Neutral/Evil)
6. **Fill in Details** - Add name, appearance, lore, and languages

### Data
- All D&D data (classes, races, backgrounds, etc.) loaded from JSON files in `apps/backend/data/`
- Based on official D&D 2024 rules (XPHB)
- Characters saved to MongoDB with unique, memorable IDs

## API Endpoints

### D&D Data
- `GET /api/data/classes` - Get all available classes
- `GET /api/data/races` - Get all available species/races
- `GET /api/data/backgrounds` - Get all available backgrounds

### Characters
- `GET /api/characters` - Get all characters
- `GET /api/characters/:id` - Get character by ID
- `POST /api/characters` - Create a new character
- `PUT /api/characters/:id` - Update a character
- `DELETE /api/characters/:id` - Delete a character

## Technologies

### Frontend
- React 19 with TypeScript
- Vite
- Axios for API calls
- Multi-step form UI
- Responsive design

### Backend
- TypeScript (strict mode)
- Express.js
- MongoDB with Mongoose
- Node.js ES Modules
- CORS enabled
- tsx for development with hot reload
- Nanoid for short, memorable character IDs

## Project Structure

```
crucible/
├── apps/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── CharacterCreation/  # All character creation UI
│   │   │   ├── services/
│   │   │   │   └── api.ts              # API client
│   │   │   ├── types/
│   │   │   │   └── character.ts        # TypeScript types
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   └── tsconfig.json
│   └── backend/
│       ├── data/                        # D&D JSON data files
│       │   ├── class/
│       │   ├── races.json
│       │   ├── backgrounds.json
│       │   └── book/
│       ├── src/
│       │   ├── config/
│       │   │   └── database.ts
│       │   ├── controllers/
│       │   │   ├── characterController.ts
│       │   │   └── dataController.ts
│       │   ├── models/
│       │   │   ├── Character.ts
│       │   │   └── User.ts
│       │   ├── routes/
│       │   │   ├── characterRoutes.ts
│       │   │   └── dataRoutes.ts
│       │   ├── services/
│       │   │   └── dataService.ts      # Loads D&D JSON data
│       │   └── index.ts
│       └── tsconfig.json
└── package.json
