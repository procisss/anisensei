import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

// Get all characters
router.get('/', async (req, res) => {
  try {
    const characters = await prisma.character.findMany();
    res.json(characters);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

// Get character by ID
router.get('/:id', async (req, res) => {
  try {
    const character = await prisma.character.findUnique({
      where: { id: req.params.id },
      include: { anime: true }
    });
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    res.json(character);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch character' });
  }
});

// Create new character
router.post('/', async (req, res) => {
  try {
    const newCharacter = await prisma.character.create({
      data: req.body
    });
    res.status(201).json(newCharacter);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create character' });
  }
});

export default router;
