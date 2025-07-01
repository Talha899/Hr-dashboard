const express = require('express');
const router = express.Router();
const Employee = require('../../models/Employee');

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.dept) filter.dept = req.query.dept;
    if (req.query.status) filter.status = req.query.status;

    const employees = await Employee.find(filter);
    res.json(employees);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;