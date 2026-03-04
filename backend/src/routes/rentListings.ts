import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET all rent listings with filters and pagination
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { community, status, agentId, propertyType, page, limit } = req.query;

    const where: Record<string, unknown> = {};
    if (community) where.community = { contains: community as string, mode: 'insensitive' };
    if (status) where.status = status as string;
    if (agentId) where.agentId = agentId as string;
    if (propertyType) where.propertyType = propertyType as string;

    const pageNum = parseInt(page as string) || 1;
    const pageSize = parseInt(limit as string) || 25;
    const skip = (pageNum - 1) * pageSize;

    const [data, total] = await Promise.all([
      prisma.rentListing.findMany({
        where,
        include: { area: true, agent: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.rentListing.count({ where }),
    ]);

    res.json({
      data,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rent listings' });
  }
});

// GET rent listing by id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const listing = await prisma.rentListing.findUnique({
      where: { id: req.params.id },
      include: { area: true, agent: true },
    });
    if (!listing) {
      res.status(404).json({ error: 'Rent listing not found' });
      return;
    }
    res.json(listing);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rent listing' });
  }
});

// POST create rent listing
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      propertyType, completionStatus, listingId, areaId, community,
      building, floor, unitNo, locationLat, locationLng, address,
      occupancy, availabilityDate, bedrooms, bathrooms, parking,
      furniture, publicUnitNo, privateUnitNo, sourceOfListing,
      rentalPrice, rentalFrequency, cheques, serviceCharge,
      titleEn, titleAr, titleCn, descriptionEn, descriptionAr, descriptionCn,
      amenities, mediaUrls, documentUrls, portals, status, agentId, ownerId, tags,
    } = req.body;

    const listing = await prisma.rentListing.create({
      data: {
        propertyType, completionStatus, listingId, areaId, community,
        building, floor, unitNo, locationLat, locationLng, address,
        occupancy,
        availabilityDate: availabilityDate ? new Date(availabilityDate) : null,
        bedrooms, bathrooms, parking, furniture, publicUnitNo, privateUnitNo,
        sourceOfListing, rentalPrice, rentalFrequency, cheques, serviceCharge,
        titleEn, titleAr, titleCn, descriptionEn, descriptionAr, descriptionCn,
        amenities: amenities || [], mediaUrls: mediaUrls || [],
        documentUrls: documentUrls || [], portals, status, agentId, ownerId,
        tags: tags || [],
      },
      include: { area: true, agent: true },
    });
    res.status(201).json(listing);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create rent listing' });
  }
});

// PUT update rent listing
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      propertyType, completionStatus, listingId, areaId, community,
      building, floor, unitNo, locationLat, locationLng, address,
      occupancy, availabilityDate, bedrooms, bathrooms, parking,
      furniture, publicUnitNo, privateUnitNo, sourceOfListing,
      rentalPrice, rentalFrequency, cheques, serviceCharge,
      titleEn, titleAr, titleCn, descriptionEn, descriptionAr, descriptionCn,
      amenities, mediaUrls, documentUrls, portals, status, agentId, ownerId, tags,
    } = req.body;

    const data: Record<string, unknown> = {};
    if (propertyType !== undefined) data.propertyType = propertyType;
    if (completionStatus !== undefined) data.completionStatus = completionStatus;
    if (listingId !== undefined) data.listingId = listingId;
    if (areaId !== undefined) data.areaId = areaId;
    if (community !== undefined) data.community = community;
    if (building !== undefined) data.building = building;
    if (floor !== undefined) data.floor = floor;
    if (unitNo !== undefined) data.unitNo = unitNo;
    if (locationLat !== undefined) data.locationLat = locationLat;
    if (locationLng !== undefined) data.locationLng = locationLng;
    if (address !== undefined) data.address = address;
    if (occupancy !== undefined) data.occupancy = occupancy;
    if (availabilityDate !== undefined) data.availabilityDate = availabilityDate ? new Date(availabilityDate) : null;
    if (bedrooms !== undefined) data.bedrooms = bedrooms;
    if (bathrooms !== undefined) data.bathrooms = bathrooms;
    if (parking !== undefined) data.parking = parking;
    if (furniture !== undefined) data.furniture = furniture;
    if (publicUnitNo !== undefined) data.publicUnitNo = publicUnitNo;
    if (privateUnitNo !== undefined) data.privateUnitNo = privateUnitNo;
    if (sourceOfListing !== undefined) data.sourceOfListing = sourceOfListing;
    if (rentalPrice !== undefined) data.rentalPrice = rentalPrice;
    if (rentalFrequency !== undefined) data.rentalFrequency = rentalFrequency;
    if (cheques !== undefined) data.cheques = cheques;
    if (serviceCharge !== undefined) data.serviceCharge = serviceCharge;
    if (titleEn !== undefined) data.titleEn = titleEn;
    if (titleAr !== undefined) data.titleAr = titleAr;
    if (titleCn !== undefined) data.titleCn = titleCn;
    if (descriptionEn !== undefined) data.descriptionEn = descriptionEn;
    if (descriptionAr !== undefined) data.descriptionAr = descriptionAr;
    if (descriptionCn !== undefined) data.descriptionCn = descriptionCn;
    if (amenities !== undefined) data.amenities = amenities;
    if (mediaUrls !== undefined) data.mediaUrls = mediaUrls;
    if (documentUrls !== undefined) data.documentUrls = documentUrls;
    if (portals !== undefined) data.portals = portals;
    if (status !== undefined) data.status = status;
    if (agentId !== undefined) data.agentId = agentId;
    if (ownerId !== undefined) data.ownerId = ownerId;
    if (tags !== undefined) data.tags = tags;

    const listing = await prisma.rentListing.update({
      where: { id: req.params.id },
      data,
      include: { area: true, agent: true },
    });
    res.json(listing);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update rent listing' });
  }
});

// DELETE rent listing
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.rentListing.delete({ where: { id: req.params.id } });
    res.json({ message: 'Rent listing deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete rent listing' });
  }
});

export default router;
