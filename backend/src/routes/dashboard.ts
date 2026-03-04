import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/stats', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [transactions, sellListings, rentListings, leads] = await Promise.all([
      prisma.transaction.count(),
      prisma.sellListing.count(),
      prisma.rentListing.count(),
      prisma.lead.count(),
    ]);

    res.json({
      transactions,
      listings: sellListings + rentListings,
      leads,
      viewings: Math.floor(leads * 0.3),
      contacts: Math.floor(leads * 1.5),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

router.get('/lead-charts', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [buyActive, buyPool, buyDeal, rentActive, rentPool, rentDeal] = await Promise.all([
      prisma.lead.count({ where: { leadType: 'Buy', status: 'Active' } }),
      prisma.lead.count({ where: { leadType: 'Buy', status: 'Pool' } }),
      prisma.lead.count({ where: { leadType: 'Buy', status: 'Deal' } }),
      prisma.lead.count({ where: { leadType: 'Rent', status: 'Active' } }),
      prisma.lead.count({ where: { leadType: 'Rent', status: 'Pool' } }),
      prisma.lead.count({ where: { leadType: 'Rent', status: 'Deal' } }),
    ]);

    const [sellActive, sellInactive, sellSold, rentListActive, rentListInactive, rentListRented] = await Promise.all([
      prisma.sellListing.count({ where: { status: 'Active' } }),
      prisma.sellListing.count({ where: { status: 'Inactive' } }),
      prisma.sellListing.count({ where: { status: 'Sold' } }),
      prisma.rentListing.count({ where: { status: 'Active' } }),
      prisma.rentListing.count({ where: { status: 'Inactive' } }),
      prisma.rentListing.count({ where: { status: 'Rented' } }),
    ]);

    res.json([
      { title: 'Buy Leads', total: buyActive + buyPool + buyDeal, active: buyActive, pool: buyPool, deal: buyDeal },
      { title: 'Rent Leads', total: rentActive + rentPool + rentDeal, active: rentActive, pool: rentPool, deal: rentDeal },
      { title: 'Sell Listings', total: sellActive + sellInactive + sellSold, active: sellActive, pool: sellInactive, deal: sellSold },
      { title: 'Rent Listings', total: rentListActive + rentListInactive + rentListRented, active: rentListActive, pool: rentListInactive, deal: rentListRented },
    ]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lead charts' });
  }
});

router.get('/agent-performance', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const agents = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, profileImage: true },
    });

    const performance = await Promise.all(
      agents.map(async (agent: { id: string; name: string; profileImage: string | null }, index: number) => {
        const deals = await prisma.transaction.count({
          where: { agentId: agent.id, approvalStatus: 'Approved' },
        });
        return { id: agent.id, name: agent.name, avatar: agent.profileImage, deals, rank: index + 1 };
      })
    );

    performance.sort((a, b) => b.deals - a.deals);
    performance.forEach((p, i) => { p.rank = i + 1; });

    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent performance' });
  }
});

export default router;
