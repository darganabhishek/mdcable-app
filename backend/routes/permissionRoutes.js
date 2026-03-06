const express = require('express');
const router = express.Router();
const { RolePermission } = require('../models');
const { authorize } = require('../middleware/auth');

// Get all permissions for all roles
router.get('/', authorize('Super Admin'), async (req, res) => {
  try {
    const permissions = await RolePermission.findAll({
      order: [['role', 'ASC'], ['permission', 'ASC']]
    });
    res.json(permissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a permission
router.put('/:id', authorize('Super Admin'), async (req, res) => {
  try {
    const { enabled } = req.body;
    const permission = await RolePermission.findByPk(req.params.id);
    
    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    permission.enabled = enabled;
    await permission.save();

    res.json(permission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Bulk update permissions for a role
router.post('/bulk', authorize('Super Admin'), async (req, res) => {
  try {
    const { role, permissions } = req.body; // permissions: { [name]: enabled }
    
    for (const [name, enabled] of Object.entries(permissions)) {
      await RolePermission.update(
        { enabled },
        { where: { role, permission: name } }
      );
    }

    res.json({ message: 'Permissions updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
