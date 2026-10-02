import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const DIST_DIR = path.join(__dirname, 'dist');

// Health check endpoint for Cloud Run
app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Middleware for parsing JSON
app.use(express.json());

// Serve static assets from dist
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));

  // SPA fallback for all remaining routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
} else {
  console.warn('Warning: dist directory not found. Please run "npm run build" first.');
  app.get('*', (_req, res) => {
    res.status(200).send('TripWithCar application is starting up...');
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`TripWithCar production server listening on 0.0.0.0:${PORT}`);
});
