const express = require('express');
const router = express.Router();
const Employee = require('../../models/Employee');

router.post('/', async (req, res) => {
  try {
    // Check if employee with the same email already exists
    const existingEmployee = await Employee.findOne({ email: req.body.email });
    if (existingEmployee) {
      return res.status(409).json({ error: 'Employee with this email already exists.' });
    }

    // Store hourlyRate as an object with amount and currency
    const { hourlyRate, ...rest } = req.body;
    let employeeData = { ...rest };

    if (hourlyRate && typeof hourlyRate === 'object') {
      employeeData.hourlyRate = {
        amount: hourlyRate.amount,
        currency: hourlyRate.currency ? hourlyRate.currency.toUpperCase() : 'USD'
      };
    } else {
      return res.status(400).json({ error: 'hourlyRate must be provided as an object with amount and currency.' });
    }

    const employee = new Employee(employeeData);
    await employee.save();
    res.status(201).json(employee);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;