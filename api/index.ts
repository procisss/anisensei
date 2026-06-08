import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'AniSensei API is running' });
});

// Lazy-load routes to avoid cold-start issues
import animeRoutes from '../backend/src/routes/anime';
import characterRoutes from '../backend/src/routes/characters';
import aiRoutes from '../backend/src/routes/ai';
import watchlistRoutes from '../backend/src/routes/watchlist';

app.use('/api/anime', animeRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/watchlist', watchlistRoutes);

export default app;
