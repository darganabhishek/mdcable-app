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

const createPayment = async (req, res) => {
  try {
    const { customer_id, amount, payment_date, status, remarks } = req.body;
    
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
      collected_by: req.user.id
    });

    if (status === 'Completed') {
      const numericAmount = parseFloat(amount);
      const pkgPrice = customer.package ? parseFloat(customer.package.price) : 0;
      const discount = parseFloat(customer.discount) || 0;
      const monthlyRate = Math.max(0, pkgPrice - discount);

      // 1. Update financial balance (positive = owed, negative = credit)
      customer.balance = (parseFloat(customer.balance || 0) - numericAmount).toFixed(2);

      // 2. Extend billing date if payment covers one or more months
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

module.exports = {
  getPayments,
  createPayment
};
