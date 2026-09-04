# Frontend (React + Vite)

## Local Development

```bash
cd frontend
npm install
npm run dev
```

Development setup:
- Frontend runs on `http://localhost:5173`
- Backend API expected at `http://localhost:4101/api` (see `vite.config.js` proxy)

## Production Build

```bash
npm run build
```

Builds to `dist/` directory and is served by the Express backend at https://natuleaf.site
