const { Customer, Payment, Package } = require('../models');
const { Op } = require('sequelize');

// @desc    Sync all billing dates based on installation date and payment history
// @route   POST /api/admin/sync-billing
// @access  Private (Super Admin)
const syncBillingDates = async (req, res) => {
  try {
    const customers = await Customer.findAll({
      include: [{ model: Package, as: 'package' }]
    });

    let updatedCount = 0;

    for (const customer of customers) {
      // 1. Reset billing date to installation_date + 1 month
      let baseDate = customer.installation_date ? new Date(customer.installation_date) : new Date(customer.createdAt);
      let nextBillingDate = new Date(baseDate.setMonth(baseDate.getMonth() + 1));

      // 2. Calculate impact of all completed payments
      const payments = await Payment.findAll({
        where: {
          customer_id: customer.id,
          status: 'Completed'
        }
      });

      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const pkgPrice = customer.package ? parseFloat(customer.package.price) : 0;
      const discount = parseFloat(customer.discount) || 0;
      const monthlyRate = Math.max(0, pkgPrice - discount);

      let currentBalance = totalPaid;
      
      if (monthlyRate > 0) {
        // Simple logic: Each full monthlyRate in totalPaid advances the billing date
        while (currentBalance >= monthlyRate) {
          currentBalance -= monthlyRate;
          nextBillingDate = new Date(nextBillingDate.setMonth(nextBillingDate.getMonth() + 1));
        }
      }

      // 3. Update customer record
      await customer.update({
        next_billing_date: nextBillingDate,
        balance: currentBalance.toFixed(2)
      });

      updatedCount++;
    }

    res.json({ message: `Successfully synchronized ${updatedCount} customers.`, count: updatedCount });
  } catch (error) {
    console.error('Sync Error:', error);
    res.status(500).json({ message: 'Server error during billing synchronization: ' + error.message });
  }
};

module.exports = {
  syncBillingDates
};
