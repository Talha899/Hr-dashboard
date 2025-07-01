const express = require('express');
const router = express.Router();
const Employee = require('../../models/Employee');

// List all holidays of an employee filtered by year (default: current year)
router.get('/', async (req, res) => {
  try {
    const { employeeId, year } = req.query;
    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required.' });
    }

    // Default to current year if not provided
    const filterYear = year ? parseInt(year, 10) : new Date().getFullYear();

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    // Filter holidays by year
    const holidays = employee.holidays.filter(h => {
      const holidayYear = new Date(h.date).getFullYear();
      return holidayYear === filterYear;
    });

    res.json({ holidays, year: filterYear });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
