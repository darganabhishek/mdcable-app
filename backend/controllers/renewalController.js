const { Renewal, Customer } = require('../models');

// @desc    Get all renewals
// @route   GET /api/renewals
// @access  Private
const getRenewals = async (req, res) => {
  try {
    const renewals = await Renewal.findAll({
      include: [
        { model: Customer, as: 'customer', attributes: ['name', 'phone', 'plan'] }
      ],
      order: [['new_expiry', 'DESC']]
    });
    res.json(renewals);
  } catch (error) {
    console.error('Error fetching renewals:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Record a renewal
// @route   POST /api/renewals
// @access  Private
const createRenewal = async (req, res) => {
  try {
    const { customer_id, previous_expiry, new_expiry, status } = req.body;
    
    // Validate customer
    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const renewal = await Renewal.create({
      customer_id,
      previous_expiry,
      new_expiry,
      status
    });

    res.status(201).json(renewal);
  } catch (error) {
    console.error('Error recording renewal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getRenewals,
  createRenewal
};
