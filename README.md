# Yuno

Yuno is a web app (React + Node.js) that turns your Telegram groups into a personal LMS-style platform — streaming videos and documents directly from Telegram in real time, with no permanent local downloads, as if it were a teaching platform.

## Structure

```
yuno/
├── client/   # Frontend (React + Vite + Tailwind)
├── server/   # Backend (Node.js + Express + GramJS)
└── docs/     # Project specification and details
```

## Prerequisites

- Node.js 20+
- Telegram API credentials (`api_id` and `api_hash`) from https://my.telegram.org

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure the server:

   ```bash
   cp server/.env.example server/.env
   ```

   Fill in `API_ID`, `API_HASH`, and other variables in `.env`.

## Development

```bash
# Backend and frontend together
npm run dev

# Or separately
npm run dev:server
npm run dev:client
```

See [docs/details.md](./docs/details.md) for the full specification.
