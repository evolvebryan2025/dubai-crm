import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET all areas with filters
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, city, propertyType } = req.query;

    const where: Record<string, unknown> = {};
    if (name) where.name = { contains: name as string, mode: 'insensitive' };
    if (city) where.city = { contains: city as string, mode: 'insensitive' };
    if (propertyType) where.propertyTypes = { has: propertyType as string };

    const areas = await prisma.area.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(areas);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch areas' });
  }
});

// GET area by id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const area = await prisma.area.findUnique({
      where: { id: req.params.id },
      include: { projects: true, sellListings: true, rentListings: true },
    });
    if (!area) {
      res.status(404).json({ error: 'Area not found' });
      return;
    }
    res.json(area);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch area' });
  }
});

// POST create area
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, city, propertyTypes, imageUrl } = req.body;
    const area = await prisma.area.create({
      data: { name, city, propertyTypes: propertyTypes || [], imageUrl },
    });
    res.status(201).json(area);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create area' });
  }
});

// PUT update area
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, city, propertyTypes, imageUrl } = req.body;
    const area = await prisma.area.update({
      where: { id: req.params.id },
      data: { name, city, propertyTypes, imageUrl },
    });
    res.json(area);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update area' });
  }
});

// DELETE area
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.area.delete({ where: { id: req.params.id } });
    res.json({ message: 'Area deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete area' });
  }
});

export default router;
