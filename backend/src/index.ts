import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import teamRoutes from './routes/teams';
import roleRoutes from './routes/roles';
import areaRoutes from './routes/areas';
import developerRoutes from './routes/developers';
import projectRoutes from './routes/projects';
import sellListingRoutes from './routes/sellListings';
import rentListingRoutes from './routes/rentListings';
import ownerRoutes from './routes/owners';
import leadRoutes from './routes/leads';
import transactionRoutes from './routes/transactions';
import workflowRoutes from './routes/workflows';
import dashboardRoutes from './routes/dashboard';
import uploadRoutes from './routes/upload';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/developers', developerRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/sell-listings', sellListingRoutes);
app.use('/api/rent-listings', rentListingRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`RealCRM API running on port ${PORT}`);
});

export default app;
