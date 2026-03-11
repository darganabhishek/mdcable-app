const { Customer } = require('./backend/models');
const sequelize = require('./backend/config/database');

async function check() {
  try {
    const customers = await Customer.findAll({ limit: 10 });
    console.log("Customer Data Snapshot:");
    customers.forEach(c => {
      console.log(`ID: ${c.customer_id}, Name: ${c.name}, Installed: ${c.installation_date}, Next: ${c.next_billing_date}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
