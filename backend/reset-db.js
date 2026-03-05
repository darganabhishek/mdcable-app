const sequelize = require('./config/database');
const User = require('./models/User');
const Customer = require('./models/Customer');
const Payment = require('./models/Payment');
const Renewal = require('./models/Renewal');
const seedUsers = require('./seed');

const reset = async () => {
    try {
        await sequelize.sync({ force: true });
        console.log('Database synced with force: true');
        await seedUsers();
        process.exit(0);
    } catch (error) {
        console.error('Error resetting DB:', error);
        process.exit(1);
    }
};

reset();
