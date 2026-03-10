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
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // 1. Collections Metrics
    const monthlySum = await Payment.sum('amount', {
      where: { payment_date: { [Op.gte]: startOfMonth } }
    });
    const monthlyCollection = parseFloat(monthlySum || 0);

    const yearlySum = await Payment.sum('amount', {
      where: { payment_date: { [Op.gte]: startOfYear } }
    });
    const yearlyCollection = parseFloat(yearlySum || 0);

    const totalRevSum = await Payment.sum('amount');
    const totalRevenue = parseFloat(totalRevSum || 0);

    // 2. Customer Performance & Status
    const totalCustomers = await Customer.count();
    const activeUsers = await Customer.count({ where: { status: 'Active' } });
    const inactiveUsers = await Customer.count({ where: { status: 'Inactive' } });
    const suspendedUsers = await Customer.count({ where: { status: 'Suspended' } });
    
    // Renewals Due: Active or Suspended customers whose billing date has passed or is today
    let renewalsDue = 0;
    let renewalsDueList = [];
    try {
        const dueCustomers = await Customer.findAll({
          where: {
            status: { [Op.ne]: 'Inactive' },
            next_billing_date: { [Op.lte]: today }
          },
          include: [{ model: Package, as: 'package', attributes: ['name', 'price'] }],
          attributes: ['id', 'customer_id', 'name', 'mobile', 'balance', 'next_billing_date']
        });
        renewalsDue = dueCustomers.length;
        renewalsDueList = dueCustomers;
    } catch (renewError) {
        console.warn('Warning: renewalsDue query failed. Using 0. Error:', renewError.message);
    }

    // 3. Payment Due (Customer Balances)
    const totalDueSum = await Customer.sum('balance', {
      where: { balance: { [Op.gt]: 0 } }
    });
    const totalPaymentDue = parseFloat(totalDueSum || 0);

    // 3. Area-wise Users Distribution
    let areaDistribution = [];
    try {
        const areaUsersRaw = await Customer.findAll({
          attributes: [
            [sequelize.col('assigned_area.name'), 'area_name'],
            [sequelize.fn('COUNT', sequelize.col('Customer.id')), 'count']
          ],
          include: [{
            model: Area,
            as: 'assigned_area',
            attributes: []
          }],
          group: ['assigned_area.name'], // Simplified group
          raw: true
        });
        
        areaDistribution = areaUsersRaw.map(item => ({
            name: item.area_name || 'Unassigned',
            value: parseInt(item.count)
        })).sort((a,b) => b.value - a.value);
    } catch (areaError) {
        console.warn('Warning: areaDistribution query failed. Returning empty array. Error:', areaError.message);
    }

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
    let serviceMixRaw = [];
    try {
        serviceMixRaw = await Payment.findAll({
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
    } catch (smError) {
        console.warn('Warning: serviceMix query failed. Returning empty array. Error:', smError.message);
    }

    // 6. Top 5 Performing Packages
    let topPackages = [];
    try {
        topPackages = await Customer.findAll({
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
            group: ['package.name'], // Simplified group
            order: [[sequelize.fn('COUNT', sequelize.col('Customer.id')), 'DESC']],
            limit: 5,
            raw: true
        });
    } catch (tpError) {
        console.warn('Warning: topPackages query failed. Returning empty array. Error:', tpError.message);
    }

    // 7. Revenue Projection (Expected revenue for next 30 days)
    let projectedRevenue = 0;
    try {
        const activeCustomers = await Customer.findAll({
            where: { status: 'Active' },
            include: [{ model: Package, as: 'package' }]
        });
        
        projectedRevenue = activeCustomers.reduce((acc, cust) => {
            const pkgPrice = cust.package ? parseFloat(cust.package.price) : 0;
            const discount = parseFloat(cust.discount) || 0;
            return acc + Math.max(0, pkgPrice - discount);
        }, 0);
    } catch (prError) {
        console.warn('Warning: projectedRevenue query failed. Using 0. Error:', prError.message);
    }

    // 8. Daily Collection Dues (Next 7 days)
    const dailyDues = [];
    try {
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            const dateString = date.toISOString().split('T')[0];

            const customersDue = await Customer.findAll({
                where: {
                    status: { [Op.ne]: 'Inactive' },
                    next_billing_date: dateString
                },
                include: [{ model: Package, as: 'package' }]
            });

            const amountDue = customersDue.reduce((acc, cust) => {
                const pkgPrice = cust.package ? parseFloat(cust.package.price) : 0;
                const discount = parseFloat(cust.discount) || 0;
                return acc + Math.max(0, pkgPrice - discount);
            }, 0);

            dailyDues.push({
                date: date.toLocaleDateString('default', { weekday: 'short', day: 'numeric', month: 'short' }),
                amount: amountDue
            });
        }
    } catch (dueError) {
        console.warn('Warning: dailyDues calculation failed:', dueError.message);
    }

    // 9. Revenue per Area (based on payments this month)
    let revenuePerArea = [];
    try {
        const revPerAreaRaw = await Payment.findAll({
            attributes: [
                [sequelize.col('customer->assigned_area.name'), 'area_name'],
                [sequelize.fn('SUM', sequelize.col('amount')), 'revenue']
            ],
            include: [{
                model: Customer,
                as: 'customer',
                attributes: [],
                include: [{
                    model: Area,
                    as: 'assigned_area',
                    attributes: []
                }]
            }],
            where: { payment_date: { [Op.gte]: startOfMonth } },
            group: ['customer->assigned_area.name'],
            raw: true
        });
        revenuePerArea = revPerAreaRaw.map(item => ({
            name: item.area_name || 'Unassigned',
            value: parseFloat(item.revenue || 0)
        })).sort((a,b) => b.value - a.value);
    } catch (revAreaError) {
        console.warn('Warning: revenuePerArea query failed:', revAreaError.message);
    }

    res.json({
      monthlyCollection,
      yearlyCollection,
      totalRevenue,
      totalCustomers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      renewalsDue,
      renewalsDueList,
      totalPaymentDue,
      projectedRevenue,
      areaDistribution,
      monthlyData,
      growthData,
      dailyDues,
      revenuePerArea,
      serviceMix: serviceMixRaw.map(s => ({ name: s.type || 'Standard', value: parseFloat(s.value || 0) })),
      topPackages: (topPackages || []).map(p => ({ name: p.name || 'N/A', value: parseInt(p.value || 0) }))
    });

  } catch (error) {
    console.error('CRITICAL: Dashboard Stats Failure:', error);
    res.status(500).json({ 
        message: 'Dashboard data engine error: ' + error.message,
        details: 'This is likely a schema sync issue. Try restarting the server or running a database sync.'
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
