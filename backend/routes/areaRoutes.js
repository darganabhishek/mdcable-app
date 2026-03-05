const express = require('express');
const router = express.Router();
const { Area } = require('../models');

// Get all areas
router.get('/', async (req, res) => {
  try {
    const areas = await Area.findAll({
      order: [['name', 'ASC']]
    });
    res.json(areas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new area
router.get('/test', (req, res) => res.send('Area Route Working'));

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    
    const area = await Area.create({ name });
    res.status(201).json(area);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Area already exists' });
    }
    res.status(500).json({ message: err.message });
  }
});

// Delete an area
router.delete('/:id', async (req, res) => {
  try {
    const area = await Area.findByPk(req.params.id);
    if (!area) return res.status(404).json({ message: 'Area not found' });
    
    await area.destroy();
    res.json({ message: 'Area deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
