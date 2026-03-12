const { Payment, Renewal, Customer, User, Package, Area, sequelize } = require('../models');
const { Op } = require('sequelize');

// @desc    Get collection reports
// @route   GET /api/reports/collections
// @access  Private (Admin, Super Admin)
const getCollectionReport = async (req, res) => {
  try {
    const { startDate, endDate, collectorId } = req.query;
    let whereCondition = {};

    if (startDate && endDate) {
      whereCondition.payment_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    if (collectorId) {
      whereCondition.collected_by = collectorId;
    }

    const payments = await Payment.findAll({
      where: whereCondition,
      include: [
        { model: Customer, as: 'customer', attributes: ['name', 'mobile', 'customer_id'] },
        { model: User, as: 'collector', attributes: ['name'] }
      ],
      order: [['payment_date', 'DESC']]
    });

    const totalCollected = await Payment.sum('amount', { where: whereCondition });

    res.json({
      totalCollected: totalCollected || 0,
      count: payments.length,
      payments
    });
  } catch (error) {
    console.error('Error generating collection report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get renewal reports
// @route   GET /api/reports/renewals
// @access  Private (Admin, Super Admin)
const getRenewalReport = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    let whereCondition = {};

    if (startDate && endDate) {
      whereCondition.new_expiry = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    if (status) {
      whereCondition.status = status;
    }

    const renewals = await Renewal.findAll({
      where: whereCondition,
      include: [
        { model: Customer, as: 'customer', attributes: ['name', 'mobile', 'customer_id'] }
      ],
      order: [['new_expiry', 'ASC']]
    });

    res.json({
      count: renewals.length,
      renewals
    });
  } catch (error) {
    console.error('Error generating renewal report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get comprehensive dashboard stats
// @route   GET /api/reports/dashboard
// @access  Private (Admin, Super Admin)
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Parallel execution of all data blocks
    const [
        monthlySum,
        yearlySum,
        totalRevSum,
        counts,
        renewalsData,
        totalDueSum,
        areaDistRaw,
        trendPayments,
        trendCustomers,
        serviceMixRaw,
        topPackagesRaw,
        projectedRaw,
        areaAnalyticsRaw,
        recentCustomers,
        recentPayments,
        dailyDuesRaw,
        revPerAreaRaw,
        atRiskCount
    ] = await Promise.all([
        // 1. Collections Metrics
        Payment.sum('amount', { where: { payment_date: { [Op.gte]: startOfMonth } } }).catch(() => 0),
        Payment.sum('amount', { where: { payment_date: { [Op.gte]: startOfYear } } }).catch(() => 0),
        Payment.sum('amount').catch(() => 0),
        
        // 2. Counts
        Promise.all([
            Customer.count(),
            Customer.count({ where: { status: 'Active' } }),
            Customer.count({ where: { status: 'Inactive' } }),
            Customer.count({ where: { status: 'Suspended' } })
        ]).catch(() => [0, 0, 0, 0]),

        // 3. Renewals Due
        Customer.findAll({
            where: {
                status: { [Op.ne]: 'Inactive' },
                next_billing_date: { [Op.lte]: today }
            },
            include: [{ model: Package, as: 'package', attributes: ['name', 'price'], required: false }],
            attributes: ['id', 'customer_id', 'name', 'mobile', 'balance', 'next_billing_date']
        }).catch(() => []),

        // 4. Balances
        Customer.sum('balance', { where: { balance: { [Op.gt]: 0 } } }).catch(() => 0),

        // 5. Area Distribution
        Customer.findAll({
            attributes: [
                [sequelize.col('assigned_area.name'), 'area_name'],
                [sequelize.fn('COUNT', sequelize.col('Customer.id')), 'count']
            ],
            include: [{ model: Area, as: 'assigned_area', attributes: [] }],
            group: ['assigned_area.name'],
            raw: true
        }).catch(() => []),

        // 6. Trends - Payments
        Payment.findAll({
            attributes: [
                [sequelize.fn('MONTH', sequelize.col('payment_date')), 'month'],
                [sequelize.fn('YEAR', sequelize.col('payment_date')), 'year'],
                [sequelize.fn('SUM', sequelize.col('amount')), 'total']
            ],
            where: { payment_date: { [Op.gte]: sixMonthsAgo } },
            group: [sequelize.fn('YEAR', sequelize.col('payment_date')), sequelize.fn('MONTH', sequelize.col('payment_date'))],
            raw: true
        }).catch(() => []),

        // 7. Trends - Customer Growth
        Customer.findAll({
            attributes: [
                [sequelize.fn('MONTH', sequelize.col('createdAt')), 'month'],
                [sequelize.fn('YEAR', sequelize.col('createdAt')), 'year'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: { createdAt: { [Op.gte]: sixMonthsAgo } },
            group: [sequelize.fn('YEAR', sequelize.col('createdAt')), sequelize.fn('MONTH', sequelize.col('createdAt'))],
            raw: true
        }).catch(() => []),

        // 8. Service Mix
        Payment.findAll({
            attributes: [
                [sequelize.col('customer.service_type'), 'type'],
                [sequelize.fn('SUM', sequelize.col('amount')), 'value']
            ],
            include: [{ model: Customer, as: 'customer', attributes: [], required: true }],
            where: { payment_date: { [Op.gte]: startOfMonth } },
            group: [sequelize.col('customer.service_type')],
            raw: true
        }).catch(() => []),

        // 9. Top Packages
        Customer.findAll({
            attributes: [
                [sequelize.col('package.name'), 'name'],
                [sequelize.fn('COUNT', sequelize.col('Customer.id')), 'value']
            ],
            include: [{ model: Package, as: 'package', attributes: [], required: true }],
            where: { status: 'Active' },
            group: ['package.name'],
            order: [[sequelize.fn('COUNT', sequelize.col('Customer.id')), 'DESC']],
            limit: 5,
            raw: true
        }).catch(() => []),

        // 10. Projected (Simplified to price sum)
        Customer.findAll({
            where: { status: 'Active' },
            include: [{ model: Package, as: 'package', attributes: ['price'] }],
            attributes: ['discount']
        }).catch(() => []),

        // 11. Area Analytics
        Customer.findAll({
            attributes: [
                [sequelize.col('assigned_area.name'), 'area_name'],
                [sequelize.fn('COUNT', sequelize.col('Customer.id')), 'count']
            ],
            include: [{ model: Area, as: 'assigned_area', attributes: [] }],
            group: ['assigned_area.name'],
            raw: true
        }).catch(() => []),

        // 12. Recent Activity
        Customer.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [{ model: Package, as: 'package', attributes: ['name'] }],
            attributes: ['id', 'customer_id', 'name', 'status', 'createdAt']
        }).catch(() => []),

        Payment.findAll({
            limit: 5,
            order: [['payment_date', 'DESC'], ['createdAt', 'DESC']],
            include: [{ model: Customer, as: 'customer', attributes: ['name', 'customer_id'] }],
            attributes: ['id', 'amount', 'payment_date', 'payment_method']
        }).catch(() => []),

        // 13. Daily Dues Range
        Customer.findAll({
            where: {
                status: { [Op.ne]: 'Inactive' },
                next_billing_date: { [Op.between]: [today, sevenDaysFromNow] }
            },
            include: [{ model: Package, as: 'package', attributes: ['price'] }],
            attributes: ['next_billing_date', 'discount']
        }).catch(() => []),

        // 14. Revenue Per Area
        Payment.findAll({
            attributes: [
                [sequelize.col('customer->assigned_area.name'), 'area_name'],
                [sequelize.fn('SUM', sequelize.col('amount')), 'revenue']
            ],
            include: [{
                model: Customer, as: 'customer', attributes: [],
                include: [{ model: Area, as: 'assigned_area', attributes: [] }]
            }],
            where: { payment_date: { [Op.gte]: startOfMonth } },
            group: ['customer->assigned_area.name'],
            raw: true
        }).catch(() => []),

        // 15. Churn Analysis (At-Risk)
        Customer.count({
            where: {
                status: { [Op.ne]: 'Inactive' },
                next_billing_date: { [Op.lt]: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) }
            }
        }).catch(() => 0)
    ]);

    // --- Data Processing (In-Memory) ---

    // Trend Processing
    const monthlyData = [];
    const growthData = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        const mName = d.toLocaleString('default', { month: 'short' });

        const pMatch = trendPayments.find(p => parseInt(p.month) === m && parseInt(p.year) === y);
        const cMatch = trendCustomers.find(c => parseInt(c.month) === m && parseInt(c.year) === y);

        monthlyData.push({ month: mName, uv: parseFloat(pMatch?.total || 0) });
        growthData.push({ month: mName, customers: parseInt(cMatch?.count || 0) });
    }

    // Daily Dues Processing
    const dailyDues = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dStr = d.toISOString().split('T')[0];

        const match = dailyDuesRaw.filter(c => {
            const billDate = new Date(c.next_billing_date);
            billDate.setHours(0,0,0,0);
            return billDate.getTime() === d.getTime();
        });

        const sum = match.reduce((acc, c) => acc + (parseFloat(c.package?.price || 0) - parseFloat(c.discount || 0)), 0);
        dailyDues.push({
            date: d.toLocaleDateString('default', { weekday: 'short', day: 'numeric', month: 'short' }),
            amount: Math.max(0, sum)
        });
    }

    // Projected Revenue Reduction
    const projectedRevenue = projectedRaw.reduce((acc, cust) => {
        return acc + Math.max(0, parseFloat(cust.package?.price || 0) - parseFloat(cust.discount || 0));
    }, 0);

    const churnRate = counts[0] > 0 ? ((atRiskCount / counts[0]) * 100).toFixed(1) : 0;

    // Final Object Construction
    const response = {
        monthlyCollection: parseFloat(monthlySum || 0),
        yearlyCollection: parseFloat(yearlySum || 0),
        totalRevenue: parseFloat(totalRevSum || 0),
        totalCustomers: counts[0],
        activeUsers: counts[1],
        inactiveUsers: counts[2],
        suspendedUsers: counts[3],
        renewalsDue: renewalsData.length,
        renewalsDueList: renewalsData,
        totalPaymentDue: parseFloat(totalDueSum || 0),
        projectedRevenue,
        churnRate,
        atRiskCount,
        areaAnalytics: areaAnalyticsRaw.map(item => ({ 
            name: item.area_name || item['assigned_area.name'] || 'Unassigned', 
            value: parseInt(item.count || item.value || 0) 
        })),
        areaDistribution: areaDistRaw.map(item => ({ 
            name: item.area_name || item['assigned_area.name'] || 'Unassigned', 
            value: parseInt(item.count || item.value || 0) 
        })),
        recentCustomers,
        recentPayments,
        monthlyData,
        growthData,
        dailyDues,
        revenuePerArea: revPerAreaRaw.map(item => ({ 
            name: item.area_name || item['customer.assigned_area.name'] || 'Unassigned', 
            value: parseFloat(item.revenue || item.value || 0) 
        })).sort((a,b) => b.value - a.value),
        serviceMix: serviceMixRaw.map(s => ({ 
            name: s.type || s['customer.service_type'] || 'Standard', 
            value: parseFloat(s.value || 0) 
        })),
        topPackages: topPackagesRaw.map(p => ({ 
            name: p.name || p['package.name'] || 'N/A', 
            value: parseInt(p.value || 0) 
        }))
    };

    console.log('DEBUG: Dashboard data processed successfully');
    res.json(response);

  } catch (error) {
    console.error('CRITICAL: Dashboard Stats Logic Error:', error);
    res.status(500).json({ 
        message: 'Dashboard engine failure: ' + error.message,
        stack: error.stack 
    });
  }
};

// @desc    Get upcoming renewals (due in next 15 days)
// @route   GET /api/reports/upcoming-renewals
// @access  Private (Admin, Super Admin)
const getUpcomingRenewals = async (req, res) => {
  try {
    const today = new Date();
    const next15Days = new Date(today);
    next15Days.setDate(today.getDate() + 15);

    const customers = await Customer.findAll({
      where: {
        status: 'Active',
        next_billing_date: {
          [Op.lte]: next15Days
        }
      },
      include: [
        { model: Package, as: 'package', required: false }
      ],
      order: [['next_billing_date', 'ASC']]
    });

    res.json(customers);
  } catch (error) {
    console.error('Error fetching upcoming renewals:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get collection leaderboard (by staff)
// @route   GET /api/reports/staff-collections
// @access  Private (Admin, Super Admin)
const getStaffCollectionLeaderboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const stats = await Payment.findAll({
      attributes: [
        [sequelize.col('collector.name'), 'staff_name'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN payment_date >= '" + today.toISOString().split('T')[0] + "' THEN amount ELSE 0 END")), 'today'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN payment_date >= '" + startOfMonth.toISOString().split('T')[0] + "' THEN amount ELSE 0 END")), 'monthly'],
        [sequelize.fn('COUNT', sequelize.col('Payment.id')), 'total_count']
      ],
      include: [{ model: User, as: 'collector', attributes: [] }],
      group: ['collector.id', 'collector.name'],
      order: [[sequelize.literal('monthly'), 'DESC']],
      raw: true
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching collection leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get churn analysis (at-risk customers)
// @route   GET /api/reports/churn-analysis
// @access  Private (Admin, Super Admin)
const getChurnAnalysis = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // At-risk: Active or Suspended but billing date passed by 30+ days
    const atRiskCustomers = await Customer.findAll({
      where: {
        status: { [Op.ne]: 'Inactive' },
        next_billing_date: { [Op.lt]: thirtyDaysAgo }
      },
      include: [{ model: Package, as: 'package', attributes: ['name', 'price'] }],
      order: [['next_billing_date', 'ASC']]
    });

    const totalCustomers = await Customer.count();
    const churnRate = totalCustomers > 0 ? ((atRiskCustomers.length / totalCustomers) * 100).toFixed(1) : 0;

    res.json({
      churnRate,
      atRiskCount: atRiskCustomers.length,
      customers: atRiskCustomers
    });
  } catch (error) {
    console.error('Error in churn analysis:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCollectionReport,
  getRenewalReport,
  getDashboardStats,
  getUpcomingRenewals,
  getStaffCollectionLeaderboard,
  getChurnAnalysis
};
