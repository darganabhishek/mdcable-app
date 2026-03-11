const { Customer, Payment, Package } = require('./backend/models');

async function check() {
  try {
    const customers = await Customer.findAll({
      include: [{ model: Package, as: 'package' }],
      limit: 10
    });

    console.log('--- Sample Customer Data ---');
    for (const c of customers) {
      const p = await Payment.count({ where: { customer_id: c.id, status: 'Completed' } });
      console.log(`Name: ${c.name}`);
      console.log(`  Package: ${c.package?.name || 'NONE'} (Price: ${c.package?.price || 0})`);
      console.log(`  Discount: ${c.discount}`);
      console.log(`  Installation: ${c.installation_date}`);
      console.log(`  Next Billing: ${c.next_billing_date}`);
      console.log(`  Completed Payments: ${p}`);
      console.log('---');
    }

    const nullPackages = await Customer.count({ where: { package_id: null } });
    console.log(`\nCustomers with NULL package: ${nullPackages}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
