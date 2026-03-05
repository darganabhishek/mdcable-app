const Package = require('../models/Package');

const getPackages = async (req, res) => {
  try {
    const pkgs = await Package.findAll({ order: [['createdAt', 'DESC']] });
    res.json(pkgs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getPackageById = async (req, res) => {
  try {
    const pkg = await Package.findByPk(req.params.id);
    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }
    res.json(pkg);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createPackage = async (req, res) => {
  try {
    const { name, service_type, price, description, status } = req.body;
    
    const pkg = await Package.create({
      name,
      service_type,
      price,
      description,
      status
    });
    
    res.status(201).json(pkg);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating package' });
  }
};

const updatePackage = async (req, res) => {
  try {
    const pkg = await Package.findByPk(req.params.id);
    
    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }

    const { name, service_type, price, description, status } = req.body;
    
    await pkg.update({
      name,
      service_type,
      price,
      description,
      status
    });

    res.json(pkg);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating package' });
  }
};

const deletePackage = async (req, res) => {
  try {
    const pkg = await Package.findByPk(req.params.id);
    
    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }

    await pkg.destroy();
    res.json({ message: 'Package removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting package' });
  }
};

module.exports = {
  getPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage
};
