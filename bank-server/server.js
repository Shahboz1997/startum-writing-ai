/**
 * Standalone Express REST API (optional). Same data as Next.js: ../data/*.json
 *
 * From repo root: cd bank-server && npm install && npm start
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import topicsRouter from './routes/topics.js';
import templatesRouter from './routes/templates.js';
import bankRouter from './routes/bank.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json({ limit: '64kb' }));

app.use('/api/topics', topicsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/bank', bankRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = Number(process.env.PORT) || 4001;
app.listen(PORT, () => {
  console.log(`IELTS Writing bank API listening on http://127.0.0.1:${PORT}`);
});
