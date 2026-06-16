# neuropathwaysafespace.org
Early identification and lifelong support tracker

A unified digital ecosystem designed to transform early identification, reduce crisis, and create connected support pathways for children, young people, and adults.

Early identification and lifelong support tracker.

## Project layout

- `backend/`: Express API with middleware and sample data.
- `frontend/`: Static dashboard that consumes the API.

## Backend

```bash
cd backend
npm install
npm run dev
```

The API will run on `http://localhost:4000` and exposes:

- `GET /health`
- `GET /api/pathways`
- `GET /api/checkins`
- `POST /api/checkins`

## Frontend

Serve the `frontend/` directory with any static server. For example:

```bash
cd frontend
python -m http.server 8080
```

Then open `http://localhost:8080` in your browser. Ensure the backend is running so the dashboard can fetch data.
