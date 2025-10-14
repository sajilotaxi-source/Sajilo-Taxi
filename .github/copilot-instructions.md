# Copilot Instructions for AI Agents

## Project Overview
- **Sajilo Taxi** is a full-stack web application for taxi booking, with a React frontend (Vite) and a Node.js/Express backend.
- The frontend is in TypeScript/React, using Vite for development and build. The backend entry is `server.mjs` (currently a placeholder).
- The app integrates with the Gemini API (set `GEMINI_API_KEY` in `.env.local`).

## Key Files & Structure
- `App.tsx`: Main React app, contains UI logic, icons, and booking logic. Uses `react-leaflet` for maps.
- `components/`: UI components (some may be placeholders).
- `services/geminiService.ts`: Intended for Gemini API integration (currently empty).
- `server.mjs`: Express backend entry point (currently empty).
- `vite.config.ts`: Vite config, exposes `GEMINI_API_KEY` to frontend.
- `package.json`: Backend dependencies and scripts.

## Developer Workflows
- **Install dependencies:** `npm install`
- **Run frontend (Vite):** `npm run dev`
- **Run backend:** `npm start` (runs `server.mjs`)
- **Set API key:** Add `GEMINI_API_KEY` to `.env.local` (not committed).

## Patterns & Conventions
- **Icons:** Defined as React components in `App.tsx` for reuse.
- **State:** Uses React hooks (`useState`, `useReducer`, etc.) for state management.
- **Map:** Uses `react-leaflet` for map display and route visualization.
- **Environment Variables:** Use Vite's `define` to expose `GEMINI_API_KEY` as `process.env.GEMINI_API_KEY` in frontend code.
- **Aliases:** `@` is aliased to project root in imports.

## Integration Points
- **Gemini API:** All Gemini API calls should be implemented in `services/geminiService.ts`.
- **Backend:** Extend `server.mjs` for backend logic (Express, CORS, body-parser enabled).

## Examples
- To add a new API call, implement it in `geminiService.ts` and call from React components.
- To add a new UI feature, create a component in `components/` and import it in `App.tsx`.

## Tips
- Many files are placeholders; check for empty files before extending.
- Use the Vite dev server for hot-reloading frontend changes.
- Keep API keys and secrets out of version control.

---
For more, see `README.md` and `vite.config.ts` for build and environment details.
