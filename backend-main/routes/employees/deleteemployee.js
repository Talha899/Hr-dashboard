const express = require('express');
const router = express.Router();
const Employee = require('../../models/Employee');

router.delete('/:id', async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
    if (!deletedEmployee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }
    res.json({ message: 'Employee deleted successfully.', employee: deletedEmployee });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;