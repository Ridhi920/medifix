# Medifix

A production-ready starter with:
- **Backend**: FastAPI (Python)
- **Web**: React + Vite (TypeScript)
- **Mobile**: React Native via Expo (TypeScript)

## Architecture overview
- `backend/` – API service, health check, tests
- `web/` – React web app
- `mobile/` – Expo React Native app
- `docs/ROADMAP.md` – Product roadmap + phase plan

## Quick start
### Backend
1. Create a virtual environment and install dependencies.
2. Start the API server.

### Web
1. Install Node dependencies.
2. Start the Vite dev server.

### Mobile
1. Install Node dependencies.
2. Run Expo and open on device or emulator.

## Health endpoint
The backend exposes `GET /health` returning `{ "status": "ok" }`.