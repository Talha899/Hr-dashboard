const express = require('express');
const router = express.Router();
const Employee = require('../../models/Employee');

router.post('/delete', async (req, res) => {
  try {
    const { employeeId, date } = req.body;
    if (!employeeId || !date) {
      return res.status(400).json({ error: 'employeeId and date are required.' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const beforeCount = employee.holidays.length;
    employee.holidays = employee.holidays.filter(
      h => new Date(h.date).toISOString().slice(0,10) !== new Date(date).toISOString().slice(0,10)
    );
    if (employee.holidays.length === beforeCount) {
      return res.status(404).json({ error: 'Holiday not found for the given date.' });
    }

    await employee.save();
    res.json({ message: 'Holiday deleted successfully.', holidays: employee.holidays });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
