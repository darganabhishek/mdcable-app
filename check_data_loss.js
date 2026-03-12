const { Customer, Package, Area } = require('./backend/models');

async function checkData() {
  try {
    const total = await Customer.count();
    const withInclude = await Customer.count({
      include: [
        { model: Area, as: 'assigned_area', required: true },
        { model: Package, as: 'package', required: true }
      ]
    });
    const withPackage = await Customer.count({
      include: [{ model: Package, as: 'package', required: true }]
    });
    const withArea = await Customer.count({
      include: [{ model: Area, as: 'assigned_area', required: true }]
    });

    console.log("Total Customers:", total);
    console.log("Customers with BOTH Area & Package (required: true):", withInclude);
    console.log("Customers with Package:", withPackage);
    console.log("Customers with Area:", withArea);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkData();
