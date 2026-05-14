const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../utils/multer');

// Create assignment (Teacher only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, course, dueDate } = req.body;
    
    const courseExists = await Course.findById(course);
    if (!courseExists) return res.status(404).json({ message: 'Course not found' });
    
    if (courseExists.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const assignment = new Assignment({
      title, description, course, dueDate,
      teacher: req.user.id
    });
    
    await assignment.save();
    res.status(201).json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit assignment (Student only)
router.post('/:id/submit', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    const existingSubmission = assignment.submissions.find(
      s => s.student.toString() === req.user.id
    );
    
    if (existingSubmission) {
      existingSubmission.fileUrl = req.file.path;
      existingSubmission.fileName = req.file.originalname;
      existingSubmission.submittedAt = new Date();
    } else {
      assignment.submissions.push({
        student: req.user.id,
        fileUrl: req.file.path,
        fileName: req.file.originalname
      });
    }
    
    await assignment.save();
    res.json({ success: true, message: 'Assignment submitted', fileUrl: req.file.path });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get assignments by course
router.get('/course/:courseId', authMiddleware, async (req, res) => {
  try {
    const assignments = await Assignment.find({ course: req.params.courseId })
      .populate('submissions.student', 'name email');
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;