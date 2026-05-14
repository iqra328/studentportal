const Assignment = require('../models/Assignment');
const Course = require('../models/Course');

exports.createAssignment = async (req, res) => {
  try {
    const { title, description, course, dueDate } = req.body;
    
    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const assignment = new Assignment({
      title,
      description,
      course,
      dueDate
    });
    
    await assignment.save();
    
    courseExists.assignments.push(assignment._id);
    await courseExists.save();
    
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const fileUrl = req.file.path;
    
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    const existingSubmission = assignment.submissions.find(
      sub => sub.student.toString() === req.user.id
    );
    
    if (existingSubmission) {
      existingSubmission.fileUrl = fileUrl;
      existingSubmission.submittedAt = new Date();
    } else {
      assignment.submissions.push({
        student: req.user.id,
        fileUrl,
        submittedAt: new Date()
      });
    }
    
    await assignment.save();
    
    res.json({ message: 'Assignment submitted successfully', assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAssignmentsByCourse = async (req, res) => {
  try {
    const assignments = await Assignment.find({ course: req.params.courseId })
      .populate('submissions.student', 'name email');
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};