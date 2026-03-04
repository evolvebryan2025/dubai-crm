import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Roles
  const adminRole = await prisma.role.create({
    data: { title: 'Admin', permissions: { all: true } },
  });
  const managerRole = await prisma.role.create({
    data: { title: 'Manager', permissions: { leads: true, listings: true, transactions: true, approval: true, kpi: true } },
  });
  const agentRole = await prisma.role.create({
    data: { title: 'Agent', permissions: { leads: true, listings: true, transactions: true } },
  });

  // Teams
  const teamA = await prisma.team.create({ data: { name: 'Sales Team A' } });
  const teamB = await prisma.team.create({ data: { name: 'Sales Team B' } });
  const leasingTeam = await prisma.team.create({ data: { name: 'Leasing Team' } });

  // Users
  const password = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@realcrm.com', password, phone: '+971501234567', roleId: adminRole.id, teamId: teamA.id, nationality: 'UAE', gender: 'Male' },
  });
  const ahmed = await prisma.user.create({
    data: { name: 'Ahmed Hassan', email: 'ahmed@realcrm.com', password, phone: '+971502345678', roleId: managerRole.id, teamId: teamA.id, nationality: 'UAE', gender: 'Male' },
  });
  const sarah = await prisma.user.create({
    data: { name: 'Sarah Chen', email: 'sarah@realcrm.com', password, phone: '+971503456789', roleId: agentRole.id, teamId: teamA.id, nationality: 'Chinese', gender: 'Female' },
  });
  const mohammed = await prisma.user.create({
    data: { name: 'Mohammed Al Rashid', email: 'mohammed@realcrm.com', password, phone: '+971504567890', roleId: agentRole.id, teamId: teamB.id, nationality: 'UAE', gender: 'Male' },
  });
  const elena = await prisma.user.create({
    data: { name: 'Elena Petrova', email: 'elena@realcrm.com', password, phone: '+971505678901', roleId: agentRole.id, teamId: leasingTeam.id, nationality: 'Russian', gender: 'Female' },
  });

  // Update team leaders
  await prisma.team.update({ where: { id: teamA.id }, data: { leaderId: ahmed.id } });
  await prisma.team.update({ where: { id: teamB.id }, data: { leaderId: mohammed.id } });
  await prisma.team.update({ where: { id: leasingTeam.id }, data: { leaderId: elena.id } });

  // Areas
  const areas = await Promise.all([
    prisma.area.create({ data: { name: 'Dubai Marina', city: 'Dubai', propertyTypes: ['Apartment', 'Penthouse'] } }),
    prisma.area.create({ data: { name: 'Downtown Dubai', city: 'Dubai', propertyTypes: ['Apartment', 'Penthouse', 'Villa'] } }),
    prisma.area.create({ data: { name: 'Palm Jumeirah', city: 'Dubai', propertyTypes: ['Villa', 'Apartment', 'Penthouse'] } }),
    prisma.area.create({ data: { name: 'Business Bay', city: 'Dubai', propertyTypes: ['Apartment', 'Office'] } }),
    prisma.area.create({ data: { name: 'JBR', city: 'Dubai', propertyTypes: ['Apartment'] } }),
    prisma.area.create({ data: { name: 'Dubai Hills', city: 'Dubai', propertyTypes: ['Villa', 'Townhouse', 'Apartment'] } }),
  ]);

  // Developers
  const developers = await Promise.all([
    prisma.developer.create({ data: { name: 'Emaar Properties', propertyTypes: ['Apartment', 'Villa', 'Penthouse'] } }),
    prisma.developer.create({ data: { name: 'DAMAC Properties', propertyTypes: ['Apartment', 'Villa'] } }),
    prisma.developer.create({ data: { name: 'Sobha Realty', propertyTypes: ['Villa', 'Apartment'] } }),
    prisma.developer.create({ data: { name: 'Binghatti', propertyTypes: ['Apartment'] } }),
    prisma.developer.create({ data: { name: 'Aldar Properties', propertyTypes: ['Apartment', 'Villa', 'Townhouse'] } }),
    prisma.developer.create({ data: { name: 'Ellington Properties', propertyTypes: ['Apartment', 'Villa'] } }),
    prisma.developer.create({ data: { name: 'Meraas', propertyTypes: ['Apartment', 'Villa', 'Retail'] } }),
    prisma.developer.create({ data: { name: 'Nshama', propertyTypes: ['Apartment', 'Townhouse'] } }),
  ]);

  // Projects
  await prisma.project.createMany({
    data: [
      { name: 'Marina Heights Tower', areaId: areas[0].id, developerId: developers[0].id, address: 'Dubai Marina, Dubai', propertyType: 'Apartment', completionStatus: 'Under Construction', listingId: 'P-2024-001', bedrooms: 2, bathrooms: 3, parking: 1, amenities: ['Pool', 'Gym', 'Concierge'], status: 'Active', agentId: ahmed.id, tags: ['Default tag'] },
      { name: 'Palm Villas', areaId: areas[2].id, developerId: developers[1].id, address: 'Palm Jumeirah, Dubai', propertyType: 'Villa', completionStatus: 'Off Plan', listingId: 'P-2024-002', bedrooms: 5, bathrooms: 6, parking: 3, amenities: ['Private Beach', 'Pool', 'Garden'], status: 'Active', agentId: sarah.id, tags: ['Premium'] },
      { name: 'Downtown Residences', areaId: areas[1].id, developerId: developers[0].id, address: 'Downtown Dubai, Dubai', propertyType: 'Apartment', completionStatus: 'Ready', listingId: 'P-2024-003', bedrooms: 3, bathrooms: 4, parking: 2, amenities: ['Pool', 'Gym', 'Spa', 'Concierge'], status: 'Active', agentId: mohammed.id, tags: ['Default tag'] },
    ],
  });

  // Leads
  await prisma.lead.createMany({
    data: [
      { leadType: 'Buy', name: 'Khalid Al Maktoum', phone: '+971551234567', email: 'khalid@email.com', agentId: ahmed.id, preferredLocation: ['Dubai Marina', 'Downtown Dubai'], budget: 2500000, preferredRooms: '2BR', preferredSize: '1200-1500 sqft', preferredPropertyType: 'Apartment', projectType: 'Ready', buyerType: 'End User', paymentMethod: 'Cash', nationality: 'UAE', formName: 'Website Form', sourceOfLead: 'Website', status: 'Active', tags: ['Default tag'], keywords: 'sea view, high floor' },
      { leadType: 'Buy', name: 'Li Wei', phone: '+8613912345678', agentId: sarah.id, preferredLocation: ['Palm Jumeirah'], budget: 5000000, preferredRooms: '3BR', preferredPropertyType: 'Villa', buyerType: 'Investor', paymentMethod: 'Mortgage', nationality: 'Chinese', sourceOfLead: 'Property Finder', status: 'Active', tags: ['Default tag', 'VIP'] },
      { leadType: 'Buy', name: 'Ivan Petrov', phone: '+79261234567', agentId: mohammed.id, preferredLocation: ['Business Bay', 'JBR'], budget: 1800000, preferredRooms: '1BR', preferredPropertyType: 'Apartment', buyerType: 'Investor', nationality: 'Russian', sourceOfLead: 'Bayut', status: 'Pool', tags: ['Default tag'] },
      { leadType: 'Buy', name: 'Emma Thompson', phone: '+447912345678', agentId: ahmed.id, preferredLocation: ['Dubai Hills'], budget: 3500000, preferredRooms: '4BR', preferredPropertyType: 'Villa', buyerType: 'End User', nationality: 'British', sourceOfLead: 'Dubizzle', status: 'Deal', tags: ['Default tag'] },
      { leadType: 'Rent', name: 'Fatima Al Zahrani', phone: '+966551234567', agentId: elena.id, preferredLocation: ['Dubai Marina', 'JBR'], budget: 120000, preferredRooms: '2BR', preferredPropertyType: 'Apartment', nationality: 'Saudi', sourceOfLead: 'Walk-in', status: 'Active', tags: ['Default tag'] },
      { leadType: 'Rent', name: 'David Kim', phone: '+821012345678', agentId: sarah.id, preferredLocation: ['Downtown Dubai'], budget: 200000, preferredRooms: '3BR', preferredPropertyType: 'Apartment', nationality: 'Korean', sourceOfLead: 'Referral', status: 'Active', tags: ['Default tag'] },
    ],
  });

  // Sell Listings
  await prisma.sellListing.createMany({
    data: [
      { propertyType: 'Apartment', completionStatus: 'Ready', listingId: 'SL-2024-001', community: 'Dubai Marina', building: 'Marina Heights', floor: '25', unitNo: '2501', address: 'Dubai Marina, Dubai', bedrooms: 2, bathrooms: 3, parking: 1, furniture: 'Unfurnished', sourceOfListing: 'Direct Owner', price: 2800000, serviceCharge: 15000, mortgage: 'Yes', acCharge: 5000, titleEn: 'Stunning 2BR in Marina Heights', amenities: ['Pool', 'Gym', 'Parking'], status: 'Active', agentId: ahmed.id, tags: ['Default tag'] },
      { propertyType: 'Villa', completionStatus: 'Ready', listingId: 'SL-2024-002', community: 'Palm Jumeirah', building: 'Garden Homes', unitNo: 'V12', address: 'Palm Jumeirah, Dubai', bedrooms: 5, bathrooms: 6, parking: 3, furniture: 'Furnished', sourceOfListing: 'Referral', price: 15000000, serviceCharge: 45000, mortgage: 'No', titleEn: 'Luxurious 5BR Garden Home', amenities: ['Private Pool', 'Garden', 'Beach Access'], status: 'Active', agentId: sarah.id, tags: ['Default tag', 'Premium'] },
      { propertyType: 'Apartment', completionStatus: 'Off Plan', listingId: 'SL-2024-003', community: 'Business Bay', building: 'Bay Tower', floor: '40', unitNo: '4010', address: 'Business Bay, Dubai', bedrooms: 1, bathrooms: 2, parking: 1, sourceOfListing: 'Website', price: 1500000, serviceCharge: 8000, mortgage: 'Yes', titleEn: 'Modern 1BR in Bay Tower', amenities: ['Pool', 'Gym'], status: 'Active', agentId: mohammed.id, tags: ['Default tag'] },
    ],
  });

  // Rent Listings
  await prisma.rentListing.createMany({
    data: [
      { propertyType: 'Apartment', completionStatus: 'Ready', listingId: 'RL-2024-001', community: 'Dubai Marina', building: 'Marina Gate', floor: '15', unitNo: '1502', address: 'Dubai Marina, Dubai', bedrooms: 2, bathrooms: 2, parking: 1, furniture: 'Furnished', sourceOfListing: 'Direct Owner', rentalPrice: 140000, rentalFrequency: 'Yearly', cheques: 4, serviceCharge: 12000, titleEn: 'Furnished 2BR in Marina Gate', amenities: ['Pool', 'Gym', 'Parking'], status: 'Active', agentId: elena.id, tags: ['Default tag'] },
      { propertyType: 'Villa', completionStatus: 'Ready', listingId: 'RL-2024-002', community: 'Dubai Hills', building: 'Maple', unitNo: 'V8', address: 'Dubai Hills, Dubai', bedrooms: 4, bathrooms: 4, parking: 2, furniture: 'Unfurnished', rentalPrice: 280000, rentalFrequency: 'Yearly', cheques: 2, titleEn: 'Spacious 4BR Maple Villa', amenities: ['Garden', 'Gym', 'Pool'], status: 'Active', agentId: mohammed.id, tags: ['Default tag'] },
    ],
  });

  // Owners
  await prisma.owner.createMany({
    data: [
      { name: 'Sheikh Abdullah', email: 'abdullah@email.com', phone: '+971551234567', countryCode: '+971', sourceOfOwner: 'Direct', nationality: 'UAE', gender: 'Male', spokenLanguages: ['Arabic', 'English'], agentId: ahmed.id },
      { name: 'Mrs. Chen Wei', email: 'chen@email.com', phone: '+8613912345678', countryCode: '+86', sourceOfOwner: 'Referral', nationality: 'Chinese', gender: 'Female', spokenLanguages: ['Chinese', 'English'], agentId: sarah.id },
    ],
  });

  // Workflows
  await prisma.workflow.createMany({
    data: [
      { name: 'Transaction', steps: [{ id: 's1', name: 'Submit', type: 'start', next_step_id: 's2' }, { id: 's2', name: 'Manager Review', type: 'approval', next_step_id: 's3' }, { id: 's3', name: 'Finance Review', type: 'approval', next_step_id: 's4' }, { id: 's4', name: 'Complete', type: 'end' }] },
      { name: 'Commission', steps: [{ id: 's1', name: 'Submit', type: 'start', next_step_id: 's2' }, { id: 's2', name: 'Approval', type: 'approval', next_step_id: 's3' }, { id: 's3', name: 'Complete', type: 'end' }] },
      { name: 'Portals', steps: [{ id: 's1', name: 'Submit', type: 'start', next_step_id: 's2' }, { id: 's2', name: 'Review', type: 'approval', next_step_id: 's3' }, { id: 's3', name: 'Published', type: 'end' }] },
      { name: 'Listings Status', steps: [{ id: 's1', name: 'Request', type: 'start', next_step_id: 's2' }, { id: 's2', name: 'Approve', type: 'approval', next_step_id: 's3' }, { id: 's3', name: 'Done', type: 'end' }] },
      { name: 'Listings Update', steps: [{ id: 's1', name: 'Submit', type: 'start', next_step_id: 's2' }, { id: 's2', name: 'Review', type: 'approval', next_step_id: 's3' }, { id: 's3', name: 'Updated', type: 'end' }] },
    ],
  });

  // Company Profile
  await prisma.companyProfile.create({
    data: {
      companyName: 'RealCRM Properties LLC',
      pfToken: 'pf_abc123',
      pfSecretToken: 'pfs_xyz789',
      bayutToken: 'bay_def456',
      bayutWhatsappApiKey: 'bwa_111',
      dubizzleWhatsappApiKey: 'dwa_222',
      tradeLicenseNumber: 'TL-2024-12345',
      brokerOrn: 'ORN-12345',
      assignedUsers: [admin.id, ahmed.id, sarah.id],
    },
  });

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
