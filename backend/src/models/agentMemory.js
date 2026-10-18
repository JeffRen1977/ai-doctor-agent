const mongoose = require('mongoose');

const agentMemorySchema = new mongoose.Schema({
  userId:      { type: String, required: true, index: true },
  type:        { type: String, enum: ['conclusion', 'preference', 'summary', 'feedback'], required: true },
  content:     { type: String, required: true },
  embedding:   { type: [Number], default: [] },
  importance:  { type: Number, default: 0.5, min: 0, max: 1 },
  accessCount: { type: Number, default: 0 },
  sourceSessionId: { type: String },
  metadata:    { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

agentMemorySchema.index({ userId: 1, type: 1, updatedAt: -1 });

module.exports = mongoose.model('AgentMemory', agentMemorySchema);
