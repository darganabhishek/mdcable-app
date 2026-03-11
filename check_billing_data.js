const { Customer } = require('./backend/models');
const { Sequelize } = require('sequelize');

async function check() {
  try {
    const stats = await Customer.findAll({
      attributes: [
        'next_billing_date',
        [Sequelize.fn('count', Sequelize.col('id')), 'count']
      ],
      group: ['next_billing_date'],
      order: [[Sequelize.col('count'), 'DESC']]
    });

    console.log('--- Billing Date Distribution ---');
    stats.forEach(s => {
      console.log(`${s.next_billing_date}: ${s.get('count')} customers`);
    });

    const installStats = await Customer.findAll({
        attributes: [
          'installation_date',
          [Sequelize.fn('count', Sequelize.col('id')), 'count']
        ],
        group: ['installation_date'],
        order: [[Sequelize.col('count'), 'DESC']],
        limit: 5
      });
      console.log('\n--- Installation Date Distribution (Top 5) ---');
      installStats.forEach(s => {
        console.log(`${s.installation_date}: ${s.get('count')} customers`);
      });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
