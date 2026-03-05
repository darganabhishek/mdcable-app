const { Payment, Customer, User } = require('../models');

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [
        { model: Customer, as: 'customer', attributes: ['name', 'phone'] },
        { model: User, as: 'collector', attributes: ['name'] }
      ],
      order: [['payment_date', 'DESC']]
    });
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Record a payment
// @route   POST /api/payments
// @access  Private
const createPayment = async (req, res) => {
  try {
    const { customer_id, amount, payment_date, status, remarks } = req.body;
    
    // Validate customer
    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const payment = await Payment.create({
      customer_id,
      amount,
      payment_date,
      status,
      remarks,
      collected_by: req.user.id
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPayments,
  createPayment
};
