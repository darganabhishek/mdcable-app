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

app.use(cors());
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

app.get('/', (req, res) => {
    res.send('M.D. Cable Networks API is running');
});

// Sync database
const isDev = process.env.NODE_ENV !== 'production';
sequelize.sync({ alter: isDev }).then(async () => {
    console.log('Database synced');
    await seedUsers();
    await seedPermissions();
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT} at 0.0.0.0`));
}).catch(err => {
    console.error('Database connection failed:', err);
});
