const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  stepIndex:   { type: Number, required: true },
  text:        { type: String, default: '' },
  toolCalls:   { type: [mongoose.Schema.Types.Mixed], default: [] },
  toolResults: { type: [mongoose.Schema.Types.Mixed], default: [] },
  tokenUsage:  {
    inputTokens:  { type: Number },
    outputTokens: { type: Number },
  },
}, { _id: false });

const agentTraceSchema = new mongoose.Schema({
  sessionId:   { type: String, required: true, index: true },
  userId:      { type: String, required: true, index: true },
  skill:       { type: String, required: true },
  userMessage: { type: String, required: true },
  steps:       { type: [stepSchema], default: [] },
  finalAnswer: { type: String },
  totalSteps:  { type: Number },
  totalTokens: {
    inputTokens:  { type: Number },
    outputTokens: { type: Number },
  },
  latencyMs:   { type: Number },
  userScore:   { type: Number, min: 1, max: 5 },
  metadata:    { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('AgentTrace', agentTraceSchema);
