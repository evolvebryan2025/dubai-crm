import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET all projects with filters
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, areaId, developerId, status, agentId } = req.query;

    const where: Record<string, unknown> = {};
    if (name) where.name = { contains: name as string, mode: 'insensitive' };
    if (areaId) where.areaId = areaId as string;
    if (developerId) where.developerId = developerId as string;
    if (status) where.status = status as string;
    if (agentId) where.agentId = agentId as string;

    const projects = await prisma.project.findMany({
      where,
      include: { area: true, developer: true, agent: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET project by id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { area: true, developer: true, agent: true },
    });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST create project
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name, areaId, developerId, locationLat, locationLng, address,
      propertyType, completionStatus, listingId, bedrooms, bathrooms,
      parking, furniture, publicUnitNo, privateUnitNo, occupancy,
      availabilityDate, sourceOfListing, price, serviceCharge, acCharge,
      titleEn, titleAr, titleCn, descriptionEn, descriptionAr, descriptionCn,
      amenities, mediaUrls, documentUrls, floorPlanUrls, paymentPlan,
      portals, status, agentId, tags,
    } = req.body;

    const project = await prisma.project.create({
      data: {
        name, areaId, developerId, locationLat, locationLng, address,
        propertyType, completionStatus, listingId, bedrooms, bathrooms,
        parking, furniture, publicUnitNo, privateUnitNo, occupancy,
        availabilityDate: availabilityDate ? new Date(availabilityDate) : null,
        sourceOfListing, price, serviceCharge, acCharge,
        titleEn, titleAr, titleCn, descriptionEn, descriptionAr, descriptionCn,
        amenities: amenities || [], mediaUrls: mediaUrls || [],
        documentUrls: documentUrls || [], floorPlanUrls: floorPlanUrls || [],
        paymentPlan, portals, status, agentId, tags: tags || [],
      },
      include: { area: true, developer: true, agent: true },
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT update project
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name, areaId, developerId, locationLat, locationLng, address,
      propertyType, completionStatus, listingId, bedrooms, bathrooms,
      parking, furniture, publicUnitNo, privateUnitNo, occupancy,
      availabilityDate, sourceOfListing, price, serviceCharge, acCharge,
      titleEn, titleAr, titleCn, descriptionEn, descriptionAr, descriptionCn,
      amenities, mediaUrls, documentUrls, floorPlanUrls, paymentPlan,
      portals, status, agentId, tags,
    } = req.body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (areaId !== undefined) data.areaId = areaId;
    if (developerId !== undefined) data.developerId = developerId;
    if (locationLat !== undefined) data.locationLat = locationLat;
    if (locationLng !== undefined) data.locationLng = locationLng;
    if (address !== undefined) data.address = address;
    if (propertyType !== undefined) data.propertyType = propertyType;
    if (completionStatus !== undefined) data.completionStatus = completionStatus;
    if (listingId !== undefined) data.listingId = listingId;
    if (bedrooms !== undefined) data.bedrooms = bedrooms;
    if (bathrooms !== undefined) data.bathrooms = bathrooms;
    if (parking !== undefined) data.parking = parking;
    if (furniture !== undefined) data.furniture = furniture;
    if (publicUnitNo !== undefined) data.publicUnitNo = publicUnitNo;
    if (privateUnitNo !== undefined) data.privateUnitNo = privateUnitNo;
    if (occupancy !== undefined) data.occupancy = occupancy;
    if (availabilityDate !== undefined) data.availabilityDate = availabilityDate ? new Date(availabilityDate) : null;
    if (sourceOfListing !== undefined) data.sourceOfListing = sourceOfListing;
    if (price !== undefined) data.price = price;
    if (serviceCharge !== undefined) data.serviceCharge = serviceCharge;
    if (acCharge !== undefined) data.acCharge = acCharge;
    if (titleEn !== undefined) data.titleEn = titleEn;
    if (titleAr !== undefined) data.titleAr = titleAr;
    if (titleCn !== undefined) data.titleCn = titleCn;
    if (descriptionEn !== undefined) data.descriptionEn = descriptionEn;
    if (descriptionAr !== undefined) data.descriptionAr = descriptionAr;
    if (descriptionCn !== undefined) data.descriptionCn = descriptionCn;
    if (amenities !== undefined) data.amenities = amenities;
    if (mediaUrls !== undefined) data.mediaUrls = mediaUrls;
    if (documentUrls !== undefined) data.documentUrls = documentUrls;
    if (floorPlanUrls !== undefined) data.floorPlanUrls = floorPlanUrls;
    if (paymentPlan !== undefined) data.paymentPlan = paymentPlan;
    if (portals !== undefined) data.portals = portals;
    if (status !== undefined) data.status = status;
    if (agentId !== undefined) data.agentId = agentId;
    if (tags !== undefined) data.tags = tags;

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data,
      include: { area: true, developer: true, agent: true },
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE project
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
