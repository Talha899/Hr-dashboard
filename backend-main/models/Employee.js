const mongoose = require('mongoose');

const raiseSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, uppercase: true }, // e.g., 'USD'
}, { _id: false });

const holidaySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  kind: { type: String, enum: ['paid', 'unpaid', 'sick'], required: true },
}, { _id: false });

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  dept: { type: String, required: true },
  title: { type: String, required: true },
  status: { type: String, enum: ['active', 'resigned'], required: true },
  hourlyRate: {
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true }
  },
  hireDate: { type: Date, required: true, default: Date.now },
  raises: [raiseSchema],
  holidays: [holidaySchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Employee', employeeSchema);
