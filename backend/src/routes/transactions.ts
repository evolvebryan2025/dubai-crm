import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET all transactions with filters
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { purpose, approvalStatus, agentId } = req.query;

    const where: Record<string, unknown> = {};
    if (purpose) where.purpose = purpose as string;
    if (approvalStatus) where.approvalStatus = approvalStatus as string;
    if (agentId) where.agentId = agentId as string;

    const transactions = await prisma.transaction.findMany({
      where,
      include: { agent: true, lead: true, developer: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// GET transaction by id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: { agent: true, lead: true, developer: true },
    });
    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// POST create transaction
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      purpose, dealDate, agentId, leadId, developerId, propertyType,
      unitNumber, picture, projectName, propertyAddress, dealPrice,
      bedrooms, commissionTotalPercentage, commissionTotalAmount,
      vat, commissionAgents, commissionStatus, approvalStatus,
      documents,
    } = req.body;

    const transaction = await prisma.transaction.create({
      data: {
        purpose,
        dealDate: new Date(dealDate),
        agentId, leadId, developerId, propertyType, unitNumber,
        picture, projectName, propertyAddress, dealPrice, bedrooms,
        commissionTotalPercentage, commissionTotalAmount, vat,
        commissionAgents, commissionStatus, approvalStatus,
        documents: documents || [],
      },
      include: { agent: true, lead: true, developer: true },
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// PUT update transaction
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      purpose, dealDate, agentId, leadId, developerId, propertyType,
      unitNumber, picture, projectName, propertyAddress, dealPrice,
      bedrooms, commissionTotalPercentage, commissionTotalAmount,
      vat, commissionAgents, commissionStatus, approvalStatus,
      documents,
    } = req.body;

    const data: Record<string, unknown> = {};
    if (purpose !== undefined) data.purpose = purpose;
    if (dealDate !== undefined) data.dealDate = new Date(dealDate);
    if (agentId !== undefined) data.agentId = agentId;
    if (leadId !== undefined) data.leadId = leadId;
    if (developerId !== undefined) data.developerId = developerId;
    if (propertyType !== undefined) data.propertyType = propertyType;
    if (unitNumber !== undefined) data.unitNumber = unitNumber;
    if (picture !== undefined) data.picture = picture;
    if (projectName !== undefined) data.projectName = projectName;
    if (propertyAddress !== undefined) data.propertyAddress = propertyAddress;
    if (dealPrice !== undefined) data.dealPrice = dealPrice;
    if (bedrooms !== undefined) data.bedrooms = bedrooms;
    if (commissionTotalPercentage !== undefined) data.commissionTotalPercentage = commissionTotalPercentage;
    if (commissionTotalAmount !== undefined) data.commissionTotalAmount = commissionTotalAmount;
    if (vat !== undefined) data.vat = vat;
    if (commissionAgents !== undefined) data.commissionAgents = commissionAgents;
    if (commissionStatus !== undefined) data.commissionStatus = commissionStatus;
    if (approvalStatus !== undefined) data.approvalStatus = approvalStatus;
    if (documents !== undefined) data.documents = documents;

    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data,
      include: { agent: true, lead: true, developer: true },
    });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// PATCH approve transaction
router.patch('/:id/approve', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data: { approvalStatus: 'Approved' },
      include: { agent: true, lead: true, developer: true },
    });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve transaction' });
  }
});

// PATCH reject transaction
router.patch('/:id/reject', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data: { approvalStatus: 'Rejected' },
      include: { agent: true, lead: true, developer: true },
    });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject transaction' });
  }
});

// DELETE transaction
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.transaction.delete({ where: { id: req.params.id } });
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

export default router;
