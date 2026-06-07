import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

// Get all anime
router.get('/', async (req, res) => {
  try {
    const anime = await prisma.anime.findMany();
    res.json(anime);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch anime' });
  }
});

// Get anime by ID
router.get('/:id', async (req, res) => {
  try {
    const anime = await prisma.anime.findUnique({
      where: { id: req.params.id },
      include: { characters: true }
    });
    if (!anime) {
      return res.status(404).json({ error: 'Anime not found' });
    }
    res.json(anime);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch anime' });
  }
});

// Create new anime
router.post('/', async (req, res) => {
  try {
    const newAnime = await prisma.anime.create({
      data: req.body
    });
    res.status(201).json(newAnime);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create anime' });
  }
});

export default router;
