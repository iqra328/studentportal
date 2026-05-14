const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: { type: Date },
  submissions: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fileUrl: { type: String },
    fileName: { type: String },
    submittedAt: { type: Date, default: Date.now },
    grade: { type: Number, min: 0, max: 100 },
    feedback: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);