import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET all developers with filters
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, propertyType } = req.query;

    const where: Record<string, unknown> = {};
    if (name) where.name = { contains: name as string, mode: 'insensitive' };
    if (propertyType) where.propertyTypes = { has: propertyType as string };

    const developers = await prisma.developer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(developers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch developers' });
  }
});

// GET developer by id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const developer = await prisma.developer.findUnique({
      where: { id: req.params.id },
      include: { projects: true, transactions: true },
    });
    if (!developer) {
      res.status(404).json({ error: 'Developer not found' });
      return;
    }
    res.json(developer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch developer' });
  }
});

// POST create developer
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, logoUrl, propertyTypes } = req.body;
    const developer = await prisma.developer.create({
      data: { name, logoUrl, propertyTypes: propertyTypes || [] },
    });
    res.status(201).json(developer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create developer' });
  }
});

// PUT update developer
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, logoUrl, propertyTypes } = req.body;
    const developer = await prisma.developer.update({
      where: { id: req.params.id },
      data: { name, logoUrl, propertyTypes },
    });
    res.json(developer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update developer' });
  }
});

// DELETE developer
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.developer.delete({ where: { id: req.params.id } });
    res.json({ message: 'Developer deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete developer' });
  }
});

export default router;
