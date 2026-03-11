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
      // 1. Establish a base installation date
      let baseDate = parseDate(customer.installation_date);
      
      if (!baseDate) {
        // Fallback: If installation date is missing, use createdAt
        // To avoid "Same for all" when bulk imported, we use the ID to "stagger" the base day
        const createdAt = new Date(customer.createdAt);
        const staggerDays = parseInt(customer.id.replace(/-/g, '').slice(-2), 16) % 28;
        baseDate = new Date(createdAt);
        baseDate.setDate(1 + staggerDays); // Distribute across the month (1-28)
      }

      // Initial next billing date is the same day of the following month
      let nextBillingDate = new Date(baseDate);
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      // 2. Calculate impact of all completed payments
      const payments = await Payment.findAll({
        where: { customer_id: customer.id, status: 'Completed' }
      });

      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const pkgPrice = customer.package ? parseFloat(customer.package.price) : 0;
      const discount = parseFloat(customer.discount) || 0;
      const monthlyRate = Math.max(0, pkgPrice - discount);

      let currentBalance = totalPaid;
      
      if (monthlyRate > 0) {
        // Advance the billing date for every full month of credit
        while (currentBalance >= monthlyRate) {
          currentBalance -= monthlyRate;
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        }
      }

      // 3. Update customer record
      await customer.update({
        installation_date: baseDate,
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

const syncPermissions = async (req, res) => {
  try {
    const seedPermissions = require('../seedPermissions');
    await seedPermissions();
    res.json({ message: 'Permissions successfully synchronized and repaired.' });
  } catch (error) {
    console.error('Seed Error:', error);
    res.status(500).json({ message: 'Server error during permission synchronization.' });
  }
};

module.exports = {
  syncBillingDates,
  syncPermissions
};
