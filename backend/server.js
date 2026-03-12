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
const adminRoutes = require('./routes/adminRoutes');
const seedUsers = require('./seed');
const seedPermissions = require('./seedPermissions');

const app = express();

console.log('M.D. Cable Networks API - Deployment Version: 2026-03-13-LOGINFIX');

// CORS Configuration - More permissive for APK/Mobile compatibility
const corsOptions = {
  origin: true, // Allow all origins for better mobile app support
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('(.*)', cors(corsOptions)); // Handle all preflight requests with valid wildcard syntax
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
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('M.D. Cable Networks API is running');
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'UP', 
        version: '2026-03-13-LOGINFIX-STABLE',
        timestamp: new Date().toISOString()
    });
});

/**
 * Safe Schema Fix: Ensures 'username' column exists in Users table
 */
const fixSchema = async () => {
    try {
        console.log('--- Checking database schema (Case-Insensitive) ---');
        
        // Find if any version of 'users' table exists
        const [tables] = await sequelize.query("SHOW TABLES");
        const allTables = tables.map(t => Object.values(t)[0].toLowerCase());
        const tableName = allTables.includes('users') ? (tables.find(t => Object.values(t)[0].toLowerCase() === 'users') ? Object.values(tables.find(t => Object.values(t)[0].toLowerCase() === 'users'))[0] : 'Users') : 'Users';
        
        console.log(`Targeting table: ${tableName}`);

        // Check columns in the detected table
        const [columns] = await sequelize.query(`SHOW COLUMNS FROM \`${tableName}\``);
        const columnNames = columns.map(c => c.Field.toLowerCase());
        
        if (!columnNames.includes('username')) {
            console.log(`--- "username" column not found in ${tableName}. Adding it... ---`);
            await sequelize.query(`ALTER TABLE \`${tableName}\` ADD COLUMN username VARCHAR(255) UNIQUE AFTER name`);
            console.log('✅ "username" column added successfully.');
        } else {
            console.log(`✅ "username" column already exists in ${tableName}.`);
        }
    } catch (err) {
        if (err.message.includes('Duplicate column name')) {
            console.log('✅ "username" column already exists (detected during ALTER).');
        } else {
            console.warn('⚠️ Schema fix warning:', err.message);
        }
    }
};

console.log('--- Production System Initializing ---');
console.log('Target Port:', PORT);

// Resilient Production Startup
const startServer = async () => {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Database connection established.');

        // Run safe schema fixes before sync
        await fixSchema();

        // In production, sync but avoid 'alter: true' for high availability
        if (process.env.NODE_ENV !== 'production') {
            await sequelize.sync({ alter: true });
        } else {
            await sequelize.sync(); 
        }

        await seedUsers();
        await seedPermissions();

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 SERVER READY ON PORT ${PORT}`);
        });
    } catch (err) {
        console.error('❌ CRITICAL STARTUP ERROR:', err);
        process.exit(1);
    }
};

startServer();
