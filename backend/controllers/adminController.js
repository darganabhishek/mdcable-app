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

    const parseDate = (val) => {
      if (!val) return null;
      const d = new Date(val);
      if (isNaN(d.getTime())) return null;
      // If date is 1970 (likely corrupted from serial import), treat as null to fallback to createdAt
      if (d.getFullYear() === 1970) return null;
      return d;
    };

    for (const customer of customers) {
      // 1. Reset billing date based on installation_date or createdAt
      let baseDate = parseDate(customer.installation_date) || new Date(customer.createdAt);
      let nextBillingDate = new Date(new Date(baseDate).setMonth(new Date(baseDate).getMonth() + 1));

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

        // Catch-up logic: If nextBillingDate is still more than 2 months in the past (likely stale migration data) 
        // and no payments were found, we might want to bring it closer to today.
        // But the user said "according to past payments", so we respect totalPaid.
        // However, if installation was 2024 and totalPaid is 0, they are overdue from Feb 2024.
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
