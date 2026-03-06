const { Customer, Area, Package } = require('../models');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll({
      include: [
        { model: Area, as: 'assigned_area' },
        { model: Package, as: 'cable_package' },
        { model: Package, as: 'internet_package' }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      include: [
        { model: Area, as: 'assigned_area' },
        { model: Package, as: 'cable_package' },
        { model: Package, as: 'internet_package' }
      ]
    });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new customer
// @route   POST /api/customers
// @access  Private (Admin, Area Manager)
const createCustomer = async (req, res) => {
  try {
    const { name, phone, address, plan, area_id, installation_date, status, service_type, cable_package_id, internet_package_id } = req.body;
    
    const customer = await Customer.create({
      name,
      phone,
      address,
      plan,
      area_id,
      installation_date,
      status,
      service_type,
      cable_package_id,
      internet_package_id
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create multiple customers
// @route   POST /api/customers/bulk
// @access  Private
const createBulkCustomers = async (req, res) => {
  try {
    const customersArray = req.body;
    
    if (!Array.isArray(customersArray) || customersArray.length === 0) {
      return res.status(400).json({ message: 'Invalid data format. Expected a non-empty array.' });
    }

    // Helper to find a value by searching for multiple possible key aliases
    const findValue = (obj, aliases) => {
      // Create a lowercase map of keys for easier matching
      const lowerCaseObj = {};
      Object.keys(obj).forEach(key => {
        lowerCaseObj[key.toLowerCase().trim()] = obj[key];
      });

      for (const alias of aliases) {
        const lowerAlias = alias.toLowerCase();
        if (lowerCaseObj[lowerAlias] !== undefined && lowerCaseObj[lowerAlias] !== null) {
          return lowerCaseObj[lowerAlias];
        }
      }
      return null;
    };

    const nameAliases = ['name', 'full name', 'customer name', 'customer', 'first name', 'naam'];
    const phoneAliases = ['phone', 'mobile', 'contact', 'phone number', 'mobile number', 'contact number', 'phone_number', 'mobile_no'];
    const addressAliases = ['address', 'location', 'residence', 'residential address', 'house', 'house no', 'flat', 'street'];
    const planAliases = ['plan', 'package', 'service', 'subscription'];
    const dateAliases = ['installation_date', 'date', 'joined', 'created_at', 'installation'];

    // Prepare data with flexible matching
    const validCustomers = customersArray.map(c => {
      const name = findValue(c, nameAliases);
      const phoneRaw = findValue(c, phoneAliases);
      const address = findValue(c, addressAliases);
      const plan = findValue(c, planAliases) || '';
      const installation_date = findValue(c, dateAliases);
      const status = c.status || 'Active';

      // Clean phone number: remove non-digits
      const phone = phoneRaw ? String(phoneRaw).replace(/\D/g, '') : null;

      return {
        name: name ? String(name).trim() : null,
        phone: phone && phone.length >= 10 ? phone.slice(-10) : phone, // Take last 10 digits if longer
        address: address ? String(address).trim() : null,
        plan: String(plan).trim(),
        installation_date: installation_date ? new Date(installation_date) : new Date(),
        status: String(status).trim()
      };
    }).filter(c => c.name && c.phone && c.address);

    if (validCustomers.length === 0) {
      return res.status(400).json({ 
        message: 'No valid customers found in the uploaded file.',
        details: 'Ensure your file has headers like Name, Phone, and Address. The system found 0 rows with all three fields populated.'
      });
    }

    const createdCustomers = await Customer.bulkCreate(validCustomers);
    res.status(201).json({ message: `Successfully imported ${createdCustomers.length} customers.`, count: createdCustomers.length });
  } catch (error) {
    console.error('Bulk insert error:', error);
    res.status(500).json({ message: 'Server error during bulk import' });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await customer.update(req.body);
    
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private (Super Admin)
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await customer.destroy();
    
    res.json({ message: 'Customer removed' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  createBulkCustomers,
  updateCustomer,
  deleteCustomer
};
