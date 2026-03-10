const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const renewalRoutes = require('./routes/renewalRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const packageRoutes = require('./routes/packageRoutes');
const areaRoutes = require('./routes/areaRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const seedUsers = require('./seed');
const seedPermissions = require('./seedPermissions');

const app = express();

console.log('M.D. Cable Networks API - Deployment Version: 2026-03-11-0310');

// CORS Configuration
const corsOptions = {
  origin: ['https://mdcable-app.vercel.app', 'http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes will be mounted here
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/renewals', renewalRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/permissions', permissionRoutes);

const PORT = process.env.PORT || 5000;

app.get('/health', (req, res) => {
    res.json({ 
        status: 'UP', 
        version: '2026-03-11-0310-RECOVERY',
        timestamp: new Date().toISOString()
    });
});

console.log('Attempting to sync database...');

// Sync database
sequelize.authenticate()
    .then(() => {
        console.log('Database connection stable.');
        return sequelize.sync({ alter: true });
    })
    .then(async () => {
        console.log('Database schema synchronized.');
        await seedUsers();
        await seedPermissions();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server fully operational on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ CRITICAL ENGINE FAILURE:', err);
        process.exit(1); // Force container restart on failure
    });
