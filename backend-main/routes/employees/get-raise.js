const express = require('express');
const router = express.Router();
const Employee = require('../../models/Employee');

router.get('/', async (req, res) => {
  try {
    const { employeeId } = req.query;
    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required.' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    // Return the raises array (could be empty)
    res.json({ raises: employee.raises || [] });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
