const express = require('express');
const router = express.Router();
const Employee = require('../../models/Employee');

router.patch('/:id', async (req, res) => {
  try {
    const updates = req.body;
    const updateOps = {};

    if (updates.status) updateOps.status = updates.status;
    if (updates.name) updateOps.name = updates.name;
    if (updates.dept) updateOps.dept = updates.dept;
    if (updates.title) updateOps.title = updates.title;
    if (updates.hireDate) updateOps.hireDate = updates.hireDate;

    let updateQuery = { $set: updateOps };
    if (updates.hourlyRate) {
      const rateObj = {
        date: updates.hourlyRate.date ? new Date(updates.hourlyRate.date) : new Date(),
        amount: updates.hourlyRate.amount,
        currency: updates.hourlyRate.currency
      };
      updateQuery.$set.hourlyRate = {
        amount: updates.hourlyRate.amount,
        currency: updates.hourlyRate.currency
      };
      updateQuery.$push = { raises: rateObj };
    }

    // Handle raises as a push to the array (legacy support)
    if (updates.raise) {
      if (!updateQuery.$push) updateQuery.$push = {};
      updateQuery.$push.raises = updates.raise;
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateQuery,
      { new: true }
    );

    if (!updatedEmployee) return res.status(404).send('Employee not found');
    res.json(updatedEmployee);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;