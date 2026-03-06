const { Customer, Area, Package } = require('../models');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll({
      include: [
        { model: Area, as: 'assigned_area' },
        { model: Package, as: 'package' }
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
        { model: Package, as: 'package' }
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
    const { 
      name, mobile, house_no, locality, city, pincode, username, email,
      area_id, installation_date, status, service_type, 
      cable_package_id, internet_package_id, discount 
    } = req.body;
    
    // Function to generate a random customer ID
    const generateId = () => `MD-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;

    if (service_type === 'Both') {
      // Create two records
      const cableCustomer = await Customer.create({
        customer_id: generateId(),
        username, name, mobile, email, house_no, locality, city, pincode,
        area_id, installation_date, status,
        service_type: 'Cable',
        package_id: cable_package_id,
        next_billing_date: installation_date ? new Date(new Date(installation_date).setMonth(new Date(installation_date).getMonth() + 1)) : null,
        discount: parseFloat(discount) / 2 || 0 
      });

      const internetCustomer = await Customer.create({
        customer_id: generateId(),
        username, name, mobile, email, house_no, locality, city, pincode,
        area_id, installation_date, status,
        service_type: 'Internet',
        package_id: internet_package_id,
        next_billing_date: installation_date ? new Date(new Date(installation_date).setMonth(new Date(installation_date).getMonth() + 1)) : null,
        discount: parseFloat(discount) / 2 || 0
      });

      return res.status(201).json({ cable: cableCustomer, internet: internetCustomer });
    }

    // Single record creation
    const customer = await Customer.create({
      customer_id: generateId(),
      name, username, mobile, email, house_no, locality, city, pincode,
      area_id, installation_date, status,
      service_type,
      package_id: service_type === 'Cable' ? cable_package_id : internet_package_id,
      next_billing_date: installation_date ? new Date(new Date(installation_date).setMonth(new Date(installation_date).getMonth() + 1)) : null,
      discount: discount || 0
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: error.message || 'Server error' });
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
    const planAliases = ['plan', 'package', 'service', 'subscription', 'cable_package', 'internet_package', 'internet_plan'];
    const dateAliases = ['installation_date', 'date', 'joined', 'created_at', 'installation', 'install_date'];
    const houseAliases = ['house', 'house no', 'flat', 'house_no', 'flat_no', 'door_no', 'address1'];
    const localityAliases = ['locality', 'area', 'street', 'neighborhood', 'address2', 'location', 'residence'];
    const cityAliases = ['city', 'town', 'district', 'location_city'];
    const pincodeAliases = ['pincode', 'pin', 'zip', 'zipcode', 'area_code', 'postal'];
    const usernameAliases = ['username', 'account', 'login', 'user_id', 'cid'];
    const emailAliases = ['email', 'mail', 'email_address'];

    // Function to generate a random customer ID
    const generateId = () => `MD-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;

    // Prepare data with flexible matching
    const validCustomers = customersArray.map(c => {
      const name = findValue(c, nameAliases);
      const username = findValue(c, usernameAliases);
      const phoneRaw = findValue(c, phoneAliases);
      const email = findValue(c, emailAliases);
      const house_no = findValue(c, houseAliases);
      const locality = findValue(c, localityAliases);
      const city = findValue(c, cityAliases) || 'Kanpur';
      const pincode = findValue(c, pincodeAliases);
      const plan = findValue(c, planAliases) || '';
      const installation_date = findValue(c, dateAliases);
      const discount = findValue(c, ['discount', 'off', 'rebate']) || 0;
      const status = findValue(c, ['status', 'state', 'condition']) || 'Active';

      // Clean phone number: remove non-digits
      const phone = phoneRaw ? String(phoneRaw).replace(/\D/g, '') : null;

      return {
        customer_id: generateId(),
        username: username ? String(username).trim() : null,
        name: name ? String(name).trim() : null,
        mobile: phone && phone.length >= 10 ? phone.slice(-10) : (phone || '0000000000'), 
        email: email ? String(email).trim() : null,
        house_no: house_no ? String(house_no).trim() : '-',
        locality: locality ? String(locality).trim() : 'Bulk Import',
        city: city ? String(city).trim() : 'Kanpur',
        pincode: pincode ? String(pincode).trim() : null,
        installation_date: installation_date ? new Date(installation_date) : new Date(),
        next_billing_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        status: status ? String(status).trim() : 'Active',
        service_type: 'Cable', // Default for import
        discount: parseFloat(discount) || 0
      };
    }).filter(c => c.name && c.mobile);

    if (validCustomers.length === 0) {
      return res.status(400).json({ 
        message: 'No valid customers found in the uploaded file.',
        details: 'Ensure your file has headers like Name, Phone. The system found 0 rows with valid data.'
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
