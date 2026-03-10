const { Customer, Area, Package } = require('../models');

// Helper to sanitize UUIDs (convert empty strings to null)
const sanitizeUUID = (id) => {
  if (!id || id === '' || id === 'null' || id === 'undefined') return null;
  // Basic UUID format check (8-4-4-4-12)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id) ? id : null;
};

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
      name, mobile, house_no, locality, username, email,
      area_id, installation_date, status, service_type, 
      cable_package_id, internet_package_id, discount 
    } = req.body;
    const city    = req.body.city    || 'Delhi';
    const pincode = req.body.pincode || '110023';

    const sanitizedEmail = (email && email.trim()) ? email.trim() : null;
    const sanitizedUsername = (username && username.trim()) ? username.trim() : null;
    
    // Function to generate a random customer ID
    const generateId = () => `MD-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;

    if (service_type === 'Both') {
      // Create two records
      const cableCustomer = await Customer.create({
        customer_id: generateId(),
        username: sanitizedUsername, 
        name, mobile, 
        email: sanitizedEmail, 
        house_no, locality, city, pincode,
        area_id: sanitizeUUID(area_id), 
        installation_date, status,
        service_type: 'Cable',
        package_id: sanitizeUUID(cable_package_id),
        next_billing_date: installation_date ? new Date(new Date(installation_date).setMonth(new Date(installation_date).getMonth() + 1)) : null,
        discount: parseFloat(discount) / 2 || 0 
      });

      const internetCustomer = await Customer.create({
        customer_id: generateId(),
        username: sanitizedUsername, 
        name, mobile, 
        email: sanitizedEmail, 
        house_no, locality, city, pincode,
        area_id: sanitizeUUID(area_id), 
        installation_date, status,
        service_type: 'Internet',
        package_id: sanitizeUUID(internet_package_id),
        next_billing_date: installation_date ? new Date(new Date(installation_date).setMonth(new Date(installation_date).getMonth() + 1)) : null,
        discount: parseFloat(discount) / 2 || 0
      });

      return res.status(201).json({ cable: cableCustomer, internet: internetCustomer });
    }

    // Single record creation
    const customer = await Customer.create({
      customer_id: generateId(),
      name, 
      username: sanitizedUsername, 
      mobile, 
      email: sanitizedEmail, 
      house_no, locality, city, pincode,
      area_id: sanitizeUUID(area_id), 
      installation_date, status,
      service_type,
      package_id: sanitizeUUID(service_type === 'Cable' ? cable_package_id : internet_package_id),
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

    // Removed old findValue
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
    const serviceTypeAliases = ['service type', 'service_type', 'service', 'type', 'connection'];
    const areaAliases = ['area', 'subgroup', 'target area', 'zone', 'region'];

    const existingAreas = await Area.findAll();
    const existingPackages = await Package.findAll();
    
    // Preparation: Map existing lookups
    const areaMap = {};
    existingAreas.forEach(a => areaMap[a.name.toLowerCase().trim()] = a.id);
    const packageMap = {};
    existingPackages.forEach(p => packageMap[p.name.toLowerCase().trim()] = p.id);

    // Helpers
    const generateId = () => `MD-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
    const normalizeStr = str => String(str).toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Flexible matching immune to formatting variations (e.g., "Service Type" vs "Service  Type_")
    const findValue = (obj, aliases) => {
      const normalizedAliases = aliases.map(normalizeStr);
      const key = Object.keys(obj).find(k => normalizedAliases.includes(normalizeStr(k)));
      return key ? obj[key] : null;
    };

    // Clean data wrapper immune to literal strings like "Null" passed by some CSV encoders
    const cleanString = (val) => {
        if (val === null || val === undefined) return null;
        const s = String(val).trim();
        if (s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined' || s === '') return null;
        return s;
    };

    // Process rows
    const validCustomers = customersArray.map(c => {
      const name = findValue(c, nameAliases);
      const username = findValue(c, usernameAliases);
      const phoneRaw = findValue(c, phoneAliases);
      const email = findValue(c, emailAliases);
      const house_no = findValue(c, houseAliases);
      const locality = findValue(c, localityAliases);
      const city = findValue(c, cityAliases);
      const pincode = findValue(c, pincodeAliases);
      const installation_date = findValue(c, dateAliases);
      const discount = findValue(c, ['discount', 'off', 'rebate']);
      const status = findValue(c, ['status', 'state', 'condition']);
      
      const serviceTypeRaw = findValue(c, serviceTypeAliases);
      const service_type = (serviceTypeRaw && String(serviceTypeRaw).toLowerCase().includes('internet')) ? 'Internet' : 'Cable';

      const areaRaw = findValue(c, areaAliases);
      const area_id = (areaRaw && areaMap[String(areaRaw).toLowerCase().trim()]) ? areaMap[String(areaRaw).toLowerCase().trim()] : null;

      const packageRaw = findValue(c, planAliases);
      const package_id = (packageRaw && packageMap[String(packageRaw).toLowerCase().trim()]) ? packageMap[String(packageRaw).toLowerCase().trim()] : null;

      // Clean phone number: remove non-digits
      const phone = phoneRaw ? String(phoneRaw).replace(/\D/g, '') : null;

      return {
        customer_id: generateId(),
        username: cleanString(username),
        name: cleanString(name),
        mobile: phone ? (phone.length >= 10 ? phone.slice(-10) : phone.padStart(10, '0')) : null, 
        email: cleanString(email),
        house_no: cleanString(house_no),
        locality: cleanString(locality),
        city: cleanString(city) || 'Delhi',
        pincode: cleanString(pincode) || '110023',
        area_id: area_id,
        package_id: package_id,
        installation_date: installation_date ? new Date(installation_date) : new Date(),
        next_billing_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        status: cleanString(status) || 'Active',
        service_type: service_type,
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

    const updateData = { ...req.body };
    // Sanitize UUID fields if they exist in the payload
    if (updateData.area_id !== undefined) updateData.area_id = sanitizeUUID(updateData.area_id);
    if (updateData.package_id !== undefined) updateData.package_id = sanitizeUUID(updateData.package_id);

    await customer.update(updateData);
    
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

// @desc    Bulk Delete customers
// @route   POST /api/customers/bulk-delete
// @access  Private (Super Admin)
const bulkDeleteCustomers = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of customer IDs.' });
    }

    const { Op } = require('sequelize');
    const deletedCount = await Customer.destroy({
      where: {
        id: {
          [Op.in]: ids
        }
      }
    });

    res.json({ message: `Successfully deleted ${deletedCount} customers`, count: deletedCount });
  } catch (error) {
    console.error('Error bulk deleting customers:', error);
    res.status(500).json({ message: 'Server error during bulk delete' });
  }
};

// @desc    Get customers with renewals due (billing date past OR no advance credit)
// @route   GET /api/customers/renewals-due
// @access  Private
const getRenewalsDue = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const customers = await Customer.findAll({
      where: {
        status: { [Op.ne]: 'Inactive' },
        next_billing_date: { [Op.lte]: today }
      },
      include: [
        { model: Area, as: 'assigned_area', attributes: ['name'] },
        { model: Package, as: 'package', attributes: ['name', 'price'] }
      ],
      order: [['next_billing_date', 'ASC']]
    });

    // Annotate each record with amount_due
    const annotated = customers.map(c => {
      const raw = c.toJSON();
      const pkgPrice = parseFloat(raw.package?.price || 0);
      const discount = parseFloat(raw.discount || 0);
      const monthlyRate = Math.max(0, pkgPrice - discount);
      const balance = parseFloat(raw.balance || 0);
      // amount_due = what they still need to pay for this cycle
      raw.amount_due = Math.max(0, monthlyRate - balance);
      return raw;
    });

    res.json(annotated);
  } catch (error) {
    console.error('Error fetching renewals due:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  createBulkCustomers,
  updateCustomer,
  deleteCustomer,
  bulkDeleteCustomers,
  getRenewalsDue
};
