const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const Hr = require('../models/Hr');

const JWT_SECRET = process.env.JWT_SECRET || 'yourSecretKey';

router.post('/', async (req, res) => {
  const { email, password, userType } = req.body;

  try {
    let user;
    let role;

    if (userType === 'hr') {
      user = await Hr.findOne({ email });
      role = 'hr';
    } else if (userType === 'employee') {
      user = await Employee.findOne({ email });
      role = 'employee';
    } else {
      return res.status(400).json({ message: 'Invalid user type' });
    }

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    let isMatch;
    if (role === 'employee') {
      isMatch = password === user.password;
    } else {
      isMatch = await bcrypt.compare(password, user.password);
    }
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role }, JWT_SECRET, { expiresIn: '1d' });

    const responseData = {
      token,
      role,
      name: user.name,
      email: user.email
    };

    res.json(responseData);
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

module.exports = router;
