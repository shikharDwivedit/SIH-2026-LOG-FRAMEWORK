# SIH Universal Log Normalization Framework

This project is a Node.js backend for ingesting, normalizing, storing, and replaying security-event logs from multiple sources, with a Vite-based frontend dashboard.

## Prerequisites

- Node.js 18+ recommended
- npm
- Docker and Docker Compose (optional, for containerized run)

## 1) Install dependencies

From the project root:

```bash
npm install
```

## 2) Run the backend API

The backend starts from the main application entry point:

```bash
npm run dev
```

This runs the server with nodemon and starts:

- API on `http://localhost:8000`
- Syslog UDP listener on `0.0.0.0:55140` by default

You can also run the server without auto-reload:

```bash
npm start
```

### Optional environment variables

The app reads values from environment variables (via `.env` if present):

```bash
PORT=8000
SYSLOG_UDP_PORT=55140
SYSLOG_UDP_HOST=0.0.0.0
NODE_ENV=development
```

## 3) Run the frontend dashboard

In a second terminal, start the Vite frontend:

```bash
npm run frontend
```

This serves the frontend at:

- `http://localhost:5173`

The frontend is configured to proxy API calls to the backend at `http://localhost:8000`.

## 4) Run the full stack together

Open two terminals:

Terminal 1:
```bash
npm run dev
```

Terminal 2:
```bash
npm run frontend
```

## 5) Build the frontend for production

```bash
npm run build
```

This creates a production build under the `frontend/dist` directory.

## 6) Run with Docker

If you want to run the app in Docker:

```bash
docker-compose up --build
```

This exposes:

- Backend: `http://localhost:8000`
- Syslog UDP: `localhost:55140`

To stop it:

```bash
docker-compose down
```

## 7) Run tests

```bash
npm test
```

## 8) Seed sample logs

```bash
npm run seed
```

## Useful routes

- Health check: `http://localhost:8000/api/v1/healthcheck`
- Events: `http://localhost:8000/api/v1/events`
- Parsers: `http://localhost:8000/api/v1/parsers`
- Sources: `http://localhost:8000/api/v1/sources`
- Output: `http://localhost:8000/api/v1/output`

## Notes

- The backend serves static frontend assets when built, and falls back to the legacy public dashboard if no frontend build is present.
- If you are running the app locally, keep the backend terminal and frontend terminal open at the same time.
