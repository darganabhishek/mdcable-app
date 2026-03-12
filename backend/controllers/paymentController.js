const { Payment, Customer, User, Package } = require('../models');
const { logActivity } = require('../middleware/logMiddleware');

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

      // 1. Calculate Total Payment (New + Existing Balance)
      const previousBalance = parseFloat(customer.balance || 0);
      const totalAvailable = numericAmount + previousBalance;

      if (monthlyRate > 0) {
        // 2. MonthsCovered = floor(TotalPayment / MonthlyPackagePrice)
        const monthsCovered = Math.floor(totalAvailable / monthlyRate);
        
        // 3. RemainingBalance = TotalPayment % MonthlyPackagePrice
        const remainingBalance = totalAvailable % monthlyRate;

        // 4. NextRenewalDate = CurrentNextRenewalDate + MonthsCovered months
        // If current date is in the past, use today as base? Or use existing renewal date?
        // Requirement says: "Use the current NextRenewalDate as the base billing date."
        let baseDate = customer.next_billing_date ? new Date(customer.next_billing_date) : new Date();
        
        // Ensure we don't start from an expired date if they are paying now? 
        // Actually, if they are paying for 1 month but were expired for 2 months, 
        // the logic typically adds to the "due" date.
        
        if (monthsCovered > 0) {
          baseDate.setMonth(baseDate.getMonth() + monthsCovered);
        }
        
        customer.next_billing_date = baseDate;
        customer.balance = remainingBalance.toFixed(2);
      } else {
        // If no package price, just add to balance
        customer.balance = totalAvailable.toFixed(2);
      }

      // Update status if they paid enough to be active
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(customer.next_billing_date) >= today && customer.status === 'Expired') {
        customer.status = 'Active';
      }

      await customer.save();
    }

    // Log Payment
    await logActivity(req.user.id, 'RECORD_PAYMENT', payment.id, 'Payment', { amount: payment.amount, transaction_id: payment.transaction_id, customer_id: customer.customer_id }, req.ip);

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

    const customer = await Customer.findByPk(payment.customer_id, {
      include: [{ model: Package, as: 'package' }]
    });

    if (customer && payment.status === 'Completed') {
      // 1. First, remove the payment from the database so it's not counted in the sync
      await payment.destroy();

      // 2. Perform a robust recalculat-and-sync for this customer (Logic mirrored from adminController)
      const payments = await Payment.findAll({
        where: { customer_id: customer.id, status: 'Completed' }
      });

      let baseDate = customer.installation_date ? new Date(customer.installation_date) : new Date(customer.createdAt);
      if (new Date(baseDate).getFullYear() === 1970) baseDate = new Date(customer.createdAt);
      
      let nextBillingDate = new Date(new Date(baseDate).setMonth(new Date(baseDate).getMonth() + 1));
      
      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const pkgPrice = customer.package ? parseFloat(customer.package.price) : 0;
      const discount = parseFloat(customer.discount) || 0;
      const monthlyRate = Math.max(0, pkgPrice - discount);

      let currentBalance = totalPaid;
      if (monthlyRate > 0) {
        while (currentBalance >= monthlyRate) {
          currentBalance -= monthlyRate;
          nextBillingDate = new Date(nextBillingDate.setMonth(nextBillingDate.getMonth() + 1));
        }
      }

      await customer.update({
        next_billing_date: nextBillingDate,
        balance: currentBalance.toFixed(2)
      });

      return res.json({ message: 'Transaction removed and customer cycle reverted' });
    }

    await payment.destroy();
    // Log Delete
    await logActivity(req.user.id, 'DELETE_PAYMENT', payment.id, 'Payment', { amount: payment.amount, transaction_id: payment.transaction_id }, req.ip);
    res.json({ message: 'Transaction removed' });
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
