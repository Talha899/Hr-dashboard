const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Hr = require('../models/Hr');

router.post('/', async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    const existingHr = await Hr.findOne({ email });
    if (existingHr) return res.status(400).json({ message: 'HR already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const hr = new Hr({ name, email, password: hashedPassword, phone });

    await hr.save();
    res.status(201).json({ message: 'HR registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
});

module.exports = router;
