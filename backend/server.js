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

console.log('--- Production System Initializing ---');
console.log('Target Port:', PORT);

// Resilient Production Startup
const startServer = async () => {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Database connection established.');

        // In production, avoid 'alter: true' as it can hang or cause data loss.
        // We sync without mutators for high availability.
        if (process.env.NODE_ENV !== 'production') {
            await sequelize.sync({ alter: true });
            console.log('✅ Development schema synced (alter: true)');
        } else {
            // Logically we should use migrations, but for rapid recovery:
            await sequelize.sync(); 
            console.log('✅ Production schema check complete (no-alter)');
        }

        await seedUsers();
        await seedPermissions();

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`
            =========================================
            🚀 SERVER READY: http://0.0.0.0:${PORT}
            HEALTH CHECK: /health
            VERSION: 2026-03-11-0315-RESILIENT
            =========================================
            `);
        });
    } catch (err) {
        console.error('❌ CRITICAL SYSTEM CRASH ON STARTUP:');
        console.error(err);
        // Do not exit if it's just a sync error, but log it.
        // However, for Railway, exiting 1 will trigger a restart.
        process.exit(1);
    }
};

startServer();
