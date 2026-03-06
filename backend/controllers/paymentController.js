const { Payment, Customer, User, Package } = require('../models');

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [
        { model: Customer, as: 'customer', attributes: ['name', 'mobile', 'customer_id'] },
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

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['name', 'mobile', 'customer_id'] },
        { model: User, as: 'collector', attributes: ['name'] }
      ]
    });
    if (!payment) return res.status(404).json({ message: 'Transaction not found' });
    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createPayment = async (req, res) => {
  try {
    const { customer_id, amount, payment_date, status, remarks } = req.body;
    
    // Generate Unique Transaction ID: TXN-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(16).slice(2, 6).toUpperCase();
    const transactionId = `TXN-${dateStr}-${randomHex}`;

    const customer = await Customer.findByPk(customer_id, {
      include: [{ model: Package, as: 'package' }]
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const payment = await Payment.create({
      customer_id,
      amount,
      payment_date,
      status,
      remarks,
      transaction_id: transactionId,
      collected_by: req.user.id
    });

    if (status === 'Completed') {
      const numericAmount = parseFloat(amount);
      const pkgPrice = customer.package ? parseFloat(customer.package.price) : 0;
      const discount = parseFloat(customer.discount) || 0;
      const monthlyRate = Math.max(0, pkgPrice - discount);

      // 1. Update financial balance
      customer.balance = (parseFloat(customer.balance || 0) - numericAmount).toFixed(2);

      // 2. Extend billing date
      if (monthlyRate > 0) {
        const currentNextBilling = customer.next_billing_date ? new Date(customer.next_billing_date) : new Date();
        const monthsPaid = Math.floor(numericAmount / monthlyRate);
        
        if (monthsPaid > 0) {
          currentNextBilling.setMonth(currentNextBilling.getMonth() + monthsPaid);
          customer.next_billing_date = currentNextBilling;
        }
      }
      
      await customer.save();
    }

    res.status(201).json(payment);
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private
const updatePayment = async (req, res) => {
  try {
    const { amount, status, remarks, payment_date } = req.body;
    const payment = await Payment.findByPk(req.params.id);

    if (!payment) return res.status(404).json({ message: 'Transaction not found' });

    const customer = await Customer.findByPk(payment.customer_id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    // Handle Balance Re-calculation if amount or status changed
    if (payment.status === 'Completed') {
      // Reverse previous payment impact
      customer.balance = (parseFloat(customer.balance) + parseFloat(payment.amount)).toFixed(2);
    }

    // Apply new payment impact
    if (status === 'Completed') {
      customer.balance = (parseFloat(customer.balance) - parseFloat(amount)).toFixed(2);
    }

    await customer.save();
    
    await payment.update({
      amount,
      status,
      remarks,
      payment_date
    });

    res.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete payment
// @route   DELETE /api/payments/:id
// @access  Private (Super Admin)
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Transaction not found' });

    const customer = await Customer.findByPk(payment.customer_id);
    if (customer && payment.status === 'Completed') {
      // Reverse impact on balance
      customer.balance = (parseFloat(customer.balance) + parseFloat(payment.amount)).toFixed(2);
      await customer.save();
    }

    await payment.destroy();
    res.json({ message: 'Transaction removed and balance adjusted' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment
};
