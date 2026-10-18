const mongoose = require('mongoose');

const patientProfileSchema = new mongoose.Schema({
  userId:      { type: String, required: true, unique: true, index: true },
  conditions:  { type: [String], default: [] },
  allergies:   { type: [String], default: [] },
  contraindications: { type: [String], default: [] },
  goals:       { type: [String], default: [] },
  concerns:    { type: [String], default: [] },
  preferences: { type: mongoose.Schema.Types.Mixed, default: {} },
  lastUpdatedBy: { type: String, enum: ['agent', 'user', 'system'], default: 'agent' },
  metadata:    { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('PatientProfile', patientProfileSchema);
