const { Customer, Payment, Package } = require('../models');
const { Op } = require('sequelize');
const { logActivity } = require('../middleware/logMiddleware');

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
      if (d.getFullYear() === 1970) return null;
      return d;
    };

    for (const customer of customers) {
      let baseDate = parseDate(customer.installation_date);
      if (!baseDate) {
        const createdAt = new Date(customer.createdAt);
        const staggerDays = parseInt(customer.id.replace(/-/g, '').slice(-2), 16) % 28;
        baseDate = new Date(createdAt);
        baseDate.setDate(1 + staggerDays);
      }

      // Initial next billing date 
      let nextBillingDate = new Date(baseDate);

      const payments = await Payment.findAll({
        where: { customer_id: customer.id, status: 'Completed' }
      });

      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const pkgPrice = customer.package ? parseFloat(customer.package.price) : 0;
      const discount = parseFloat(customer.discount) || 0;
      const monthlyRate = Math.max(0, pkgPrice - discount);

      let currentBalance = totalPaid;
      
      if (monthlyRate > 0) {
        // --- Floor/Modulo Logic ---
        const monthsCovered = Math.floor(totalPaid / monthlyRate);
        const remainingBalance = totalPaid % monthlyRate;
        
        if (monthsCovered > 0) {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + monthsCovered);
        }
        currentBalance = remainingBalance;
      }

      await customer.update({
        installation_date: baseDate,
        next_billing_date: nextBillingDate,
        balance: currentBalance.toFixed(2)
      });

      updatedCount++;
    }

    // Log admin action
    await logActivity(req.user.id, 'SYNC_BILLING_DATES', null, 'Admin', { count: updatedCount }, req.ip);

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
    
    // Log admin action
    await logActivity(req.user.id, 'SYNC_PERMISSIONS', null, 'Admin', {}, req.ip);

    res.json({ message: 'Permissions successfully synchronized and repaired.' });
  } catch (error) {
    console.error('Seed Error:', error);
    res.status(500).json({ message: 'Server error during permission synchronization.' });
  }
};

const getActivityLogs = async (req, res) => {
  try {
    const { ActivityLog, User } = require('../models');
    const logs = await ActivityLog.findAll({
      include: [{ model: User, as: 'user', attributes: ['name', 'role'] }],
      order: [['createdAt', 'DESC']],
      limit: 200 // Limit for performance
    });
    res.json(logs);
  } catch (error) {
    console.error('Fetch Logs Error:', error);
    res.status(500).json({ message: 'Server error fetching activity logs.' });
  }
};

module.exports = {
  syncBillingDates,
  syncPermissions,
  getActivityLogs
};
