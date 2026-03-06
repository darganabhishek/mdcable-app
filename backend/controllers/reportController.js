const { Payment, Renewal, Customer, User, Package, sequelize } = require('../models');
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
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // 1. Collections Metrics
    const monthlyCollection = await Payment.sum('amount', {
      where: { payment_date: { [Op.gte]: startOfMonth } }
    });

    const yearlyCollection = await Payment.sum('amount', {
      where: { payment_date: { [Op.gte]: startOfYear } }
    });

    // 2. Payment Due (Customer Balances)
    const totalPaymentDue = await Customer.sum('balance', {
      where: { balance: { [Op.gt]: 0 } }
    });

    // 3. Area-wise Users Distribution
    const areaUsersRaw = await Customer.findAll({
      attributes: ['area', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['area'],
      raw: true
    });
    
    // Format for charts: Ensure null areas are grouped under "Unassigned"
    const areaDistribution = areaUsersRaw.map(item => ({
        name: item.area || 'Unassigned',
        value: parseInt(item.count)
    })).sort((a,b) => b.value - a.value);

    // 4. Monthly Collection Graph Data (Last 6 Months)
    const monthlyData = [];
    const growthData = [];
    for (let i = 5; i >= 0; i--) {
        const start = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const end = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
        
        // Revenue trend
        const sum = await Payment.sum('amount', {
            where: { payment_date: { [Op.between]: [start, end] } }
        });

        // New customer growth trend
        const count = await Customer.count({
            where: { createdAt: { [Op.between]: [start, end] } }
        });

        const monthName = start.toLocaleString('default', { month: 'short' });
        monthlyData.push({ month: monthName, uv: sum || 0 });
        growthData.push({ month: monthName, customers: count || 0 });
    }

    // 5. Service Mix (Revenue per service type)
    // We get this by joining Payment with Customer and grouping by service_type
    const serviceMixRaw = await Payment.findAll({
        attributes: [
            [sequelize.col('customer.service_type'), 'type'],
            [sequelize.fn('SUM', sequelize.col('amount')), 'value']
        ],
        include: [{ 
            model: Customer, 
            as: 'customer', 
            attributes: [], 
            required: true 
        }],
        where: { payment_date: { [Op.gte]: startOfMonth } },
        group: [sequelize.col('customer.service_type')],
        raw: true
    });

    // 6. Top 5 Performing Packages
    const topPackages = await Customer.findAll({
        attributes: [
            [sequelize.col('package.name'), 'name'],
            [sequelize.fn('COUNT', sequelize.col('Customer.id')), 'value']
        ],
        include: [{
            model: Package,
            as: 'package',
            attributes: [],
            required: true
        }],
        where: { status: 'Active' },
        group: [sequelize.col('package.name')],
        order: [[sequelize.fn('COUNT', sequelize.col('Customer.id')), 'DESC']],
        limit: 5,
        raw: true
    });

    // 7. Revenue Projection (Expected revenue for next 30 days)
    // Formula: Sum(Monthly Price - Discount) for all Active customers
    const activeCustomers = await Customer.findAll({
        where: { status: 'Active' },
        include: [{ model: Package, as: 'package' }]
    });

    const projectedRevenue = activeCustomers.reduce((acc, cust) => {
        const pkgPrice = cust.package ? parseFloat(cust.package.price) : 0;
        const discount = parseFloat(cust.discount) || 0;
        return acc + Math.max(0, pkgPrice - discount);
    }, 0);

    res.json({
      monthlyCollection: monthlyCollection || 0,
      yearlyCollection: yearlyCollection || 0,
      totalPaymentDue: totalPaymentDue || 0,
      projectedRevenue: projectedRevenue || 0,
      areaDistribution,
      monthlyData,
      growthData,
      serviceMix: serviceMixRaw.map(s => ({ name: s.type, value: parseFloat(s.value) })),
      topPackages: topPackages.map(p => ({ name: p.name, value: parseInt(p.value) }))
    });

  } catch (error) {
    console.error('Error generating dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
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
        { model: Package, as: 'package' }
      ],
      order: [['next_billing_date', 'ASC']]
    });

    res.json(customers);
  } catch (error) {
    console.error('Error fetching upcoming renewals:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCollectionReport,
  getRenewalReport,
  getDashboardStats,
  getUpcomingRenewals
};
