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
  safetyRulesHash: { type: String },
  metadata:      { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

skillConfigSchema.pre('save', async function guardSafetyRules() {
  if (!this.isNew || !this.parentVersion || !this.safetyRulesHash) return;
  const parent = await this.constructor.findOne({
    skill: this.skill, version: this.parentVersion,
  });
  if (parent?.safetyRulesHash && parent.safetyRulesHash !== this.safetyRulesHash) {
    throw new Error(
      `Safety rules mutation blocked: hash ${this.safetyRulesHash} differs from parent ${parent.safetyRulesHash}`,
    );
  }
});

skillConfigSchema.index({ skill: 1, version: 1 }, { unique: true });

module.exports = mongoose.model('SkillConfig', skillConfigSchema);
