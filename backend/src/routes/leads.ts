import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET all leads with filters
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { leadType, status, agentId, name, phone } = req.query;

    const where: Record<string, unknown> = {};
    if (leadType) where.leadType = leadType as string;
    if (status) where.status = status as string;
    if (agentId) where.agentId = agentId as string;
    if (name) where.name = { contains: name as string, mode: 'insensitive' };
    if (phone) where.phone = { contains: phone as string };

    const leads = await prisma.lead.findMany({
      where,
      include: { agent: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// GET lead by id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: { agent: true, transactions: true },
    });
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

// POST create lead
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      leadType, name, phone, email, agentId, preferredLocation,
      budget, preferredRooms, preferredSize, preferredPropertyType,
      projectType, buyerType, paymentMethod, nationality, formName,
      sourceOfLead, status, tags, keywords, documents, lastFollowUpAt,
    } = req.body;

    const lead = await prisma.lead.create({
      data: {
        leadType, name, phone, email, agentId,
        preferredLocation: preferredLocation || [],
        budget, preferredRooms, preferredSize, preferredPropertyType,
        projectType, buyerType, paymentMethod, nationality, formName,
        sourceOfLead, status, tags: tags || [], keywords,
        documents: documents || [],
        lastFollowUpAt: lastFollowUpAt ? new Date(lastFollowUpAt) : null,
      },
      include: { agent: true },
    });
    res.status(201).json(lead);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// PUT update lead
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      leadType, name, phone, email, agentId, preferredLocation,
      budget, preferredRooms, preferredSize, preferredPropertyType,
      projectType, buyerType, paymentMethod, nationality, formName,
      sourceOfLead, status, tags, keywords, documents, lastFollowUpAt,
    } = req.body;

    const data: Record<string, unknown> = {};
    if (leadType !== undefined) data.leadType = leadType;
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (email !== undefined) data.email = email;
    if (agentId !== undefined) data.agentId = agentId;
    if (preferredLocation !== undefined) data.preferredLocation = preferredLocation;
    if (budget !== undefined) data.budget = budget;
    if (preferredRooms !== undefined) data.preferredRooms = preferredRooms;
    if (preferredSize !== undefined) data.preferredSize = preferredSize;
    if (preferredPropertyType !== undefined) data.preferredPropertyType = preferredPropertyType;
    if (projectType !== undefined) data.projectType = projectType;
    if (buyerType !== undefined) data.buyerType = buyerType;
    if (paymentMethod !== undefined) data.paymentMethod = paymentMethod;
    if (nationality !== undefined) data.nationality = nationality;
    if (formName !== undefined) data.formName = formName;
    if (sourceOfLead !== undefined) data.sourceOfLead = sourceOfLead;
    if (status !== undefined) data.status = status;
    if (tags !== undefined) data.tags = tags;
    if (keywords !== undefined) data.keywords = keywords;
    if (documents !== undefined) data.documents = documents;
    if (lastFollowUpAt !== undefined) data.lastFollowUpAt = lastFollowUpAt ? new Date(lastFollowUpAt) : null;

    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data,
      include: { agent: true },
    });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// PATCH update lead status (Active/Pool/Deal)
router.patch('/:id/status', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;

    if (!status || !['Active', 'Pool', 'Deal'].includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be Active, Pool, or Deal.' });
      return;
    }

    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: { status },
      include: { agent: true },
    });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lead status' });
  }
});

// PATCH assign agent to lead
router.patch('/:id/assign', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { agentId } = req.body;

    if (!agentId) {
      res.status(400).json({ error: 'agentId is required' });
      return;
    }

    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: { agentId },
      include: { agent: true },
    });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign agent to lead' });
  }
});

// DELETE lead
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.lead.delete({ where: { id: req.params.id } });
    res.json({ message: 'Lead deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

export default router;
