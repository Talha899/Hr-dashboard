const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/hr/signup', require('./routes/hrSignup'));
app.use('/api/login', require('./routes/Login'));
// Employees routes
app.use('/api/createEmployee', require('./routes/employees/createEmployee'));
app.use('/api/listEmployees', require('./routes/employees/listEmployees'));
app.use('/api/updateEmployee', require('./routes/employees/updateEmployee'));
app.use('/api/deleteemployee', require('./routes/employees/deleteemployee'));
//Holidays routes

app.use('/api/addholidays', require('./routes/employees/addholidays'));
app.use('/api/listholidays', require('./routes/employees/listholidays'));
app.use('/api/deleteholidays', require('./routes/employees/deleteholidays'));


app.use('/api/payroll', require('./routes/payroll'));

app.use('/api/get-raise', require('./routes/employees/get-raise'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));
