import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET all owners with filters
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, agentId } = req.query;

    const where: Record<string, unknown> = {};
    if (name) where.name = { contains: name as string, mode: 'insensitive' };
    if (phone) where.phone = { contains: phone as string };
    if (agentId) where.agentId = agentId as string;

    const owners = await prisma.owner.findMany({
      where,
      include: { agent: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(owners);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch owners' });
  }
});

// GET owner by id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const owner = await prisma.owner.findUnique({
      where: { id: req.params.id },
      include: { agent: true },
    });
    if (!owner) {
      res.status(404).json({ error: 'Owner not found' });
      return;
    }
    res.json(owner);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch owner' });
  }
});

// POST create owner
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name, email, phone, phoneSecondary, countryCode, sourceOfOwner,
      nationality, gender, birthdate, spokenLanguages, agentId, status,
    } = req.body;

    const owner = await prisma.owner.create({
      data: {
        name, email, phone, phoneSecondary, countryCode, sourceOfOwner,
        nationality, gender,
        birthdate: birthdate ? new Date(birthdate) : null,
        spokenLanguages: spokenLanguages || [],
        agentId, status,
      },
      include: { agent: true },
    });
    res.status(201).json(owner);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create owner' });
  }
});

// PUT update owner
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name, email, phone, phoneSecondary, countryCode, sourceOfOwner,
      nationality, gender, birthdate, spokenLanguages, agentId, status,
    } = req.body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (phoneSecondary !== undefined) data.phoneSecondary = phoneSecondary;
    if (countryCode !== undefined) data.countryCode = countryCode;
    if (sourceOfOwner !== undefined) data.sourceOfOwner = sourceOfOwner;
    if (nationality !== undefined) data.nationality = nationality;
    if (gender !== undefined) data.gender = gender;
    if (birthdate !== undefined) data.birthdate = birthdate ? new Date(birthdate) : null;
    if (spokenLanguages !== undefined) data.spokenLanguages = spokenLanguages;
    if (agentId !== undefined) data.agentId = agentId;
    if (status !== undefined) data.status = status;

    const owner = await prisma.owner.update({
      where: { id: req.params.id },
      data,
      include: { agent: true },
    });
    res.json(owner);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update owner' });
  }
});

// DELETE owner
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.owner.delete({ where: { id: req.params.id } });
    res.json({ message: 'Owner deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete owner' });
  }
});

export default router;
