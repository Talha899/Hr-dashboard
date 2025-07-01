const mongoose = require('mongoose');

const hrSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Hr', hrSchema);
