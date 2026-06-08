import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

// Helper: find or auto-create a default user
async function getOrCreateUser() {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: { username: 'default', email: 'user@anisensei.app' }
    });
  }
  return user;
}

// GET /api/watchlist - Get all watchlist items for the default user
router.get('/', async (req, res) => {
  try {
    const user = await getOrCreateUser();

    const watchlist = await prisma.watchlist.findMany({
      where: { userId: user.id },
      include: { anime: true },
      orderBy: { id: 'desc' }
    });
    res.json(watchlist);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/watchlist - Add an anime to watchlist
// Body: { malId, title, genre, description, rating, episodes, imageUrl, status? }
router.post('/', async (req, res) => {
  try {
    const user = await getOrCreateUser();

    const { animeId, malId, title, genre, description, rating, episodes, imageUrl, status } = req.body;

    let finalAnimeId = animeId;

    // If no local animeId provided, create/find anime from MAL data
    if (!finalAnimeId && malId) {
      let existingAnime = await prisma.anime.findFirst({ where: { title: title } });
      if (existingAnime) {
        finalAnimeId = existingAnime.id;
      } else {
        const newAnime = await prisma.anime.create({
          data: {
            title: title || 'Unknown',
            genre: genre || 'Unknown',
            description: description || '',
            rating: rating || null,
            episodes: episodes || null,
            imageUrl: imageUrl || null
          }
        });
        finalAnimeId = newAnime.id;
      }
    }

    if (!finalAnimeId) return res.status(400).json({ error: 'animeId or malId+title required' });

    // Check if already in watchlist
    const existing = await prisma.watchlist.findFirst({
      where: { userId: user.id, animeId: finalAnimeId }
    });
    if (existing) {
      return res.status(409).json({ error: 'Already in watchlist', watchlist: existing });
    }

    const watchlistItem = await prisma.watchlist.create({
      data: {
        userId: user.id,
        animeId: finalAnimeId,
        status: status || 'plan_to_watch',
        progress: 0
      },
      include: { anime: true }
    });
    res.status(201).json(watchlistItem);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/watchlist/:id - Remove from watchlist
router.delete('/:id', async (req, res) => {
  try {
    await prisma.watchlist.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/watchlist/:id - Update watchlist item status/progress
router.patch('/:id', async (req, res) => {
  try {
    const { status, progress } = req.body;
    const updated = await prisma.watchlist.update({
      where: { id: req.params.id },
      data: { ...(status && { status }), ...(progress !== undefined && { progress }) },
      include: { anime: true }
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
