const bcrypt = require('bcryptjs');
const { User } = require('./models');

const seedUsers = async () => {
    try {
        const count = await User.count();
        if (count === 0) {
            console.log('Seeding initial users...');
            const defaultPasswordHash = await bcrypt.hash('password123', 10);
            const superAdminPasswordHash = await bcrypt.hash('Mdi@1992', 10);
            
            await User.bulkCreate([
                { name: 'Abhishek Dargan', username: 'abhishekdargan', password: superAdminPasswordHash, role: 'Super Admin' },
                { name: 'Sanil Dargan', username: 'sanil', password: defaultPasswordHash, role: 'Admin' },
                { name: 'Anil K. Dargan', username: 'anilkdargan', password: defaultPasswordHash, role: 'Admin' },
            ]);
            console.log('Users seeded successfully!');
        }
    } catch (error) {
        console.error('Failed to seed users:', error);
    }
};

module.exports = seedUsers;
