const mongoose = require('mongoose');

const skillConfigSchema = new mongoose.Schema({
  skill:         { type: String, required: true, index: true },
  version:       { type: String, required: true, match: /^\d+\.\d+\.\d+(-\w+)?$/ },
  parentVersion: { type: String },
  status:        { type: String, enum: ['active', 'candidate', 'archived', 'rolled_back'], default: 'candidate' },
  systemPrompt:  { type: String },
  changes:       { type: [String], default: [] },
  evaluationScore: { type: Number },
  activatedAt:   { type: Date },
  metadata:      { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

skillConfigSchema.index({ skill: 1, version: 1 }, { unique: true });

module.exports = mongoose.model('SkillConfig', skillConfigSchema);
