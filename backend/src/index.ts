import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AniSensei API is running' });
});

// Import and use routes
import animeRoutes from './routes/anime';
import characterRoutes from './routes/characters';
import aiRoutes from './routes/ai';
import watchlistRoutes from './routes/watchlist';

app.use('/api/anime', animeRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/watchlist', watchlistRoutes);

// Only listen locally, Vercel handles this in production
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
