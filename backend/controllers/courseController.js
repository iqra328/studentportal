const Course = require('../models/Course');
const User = require('../models/User');

exports.createCourse = async (req, res) => {
  try {
    const { title, description, price, isPremium, duration, level } = req.body;
    
    const course = new Course({
      title,
      description,
      price,
      isPremium: isPremium || price > 0,
      teacher: req.user.id,
      duration,
      level
    });
    
    await course.save();
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('teacher', 'name email');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('students', 'name email');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.isPremium) {
      return res.status(400).json({ message: 'This is a premium course. Please complete payment first.' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (user.enrolledCourses.includes(course._id)) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }
    
    user.enrolledCourses.push(course._id);
    course.students.push(user._id);
    
    await user.save();
    await course.save();
    
    res.json({ message: 'Successfully enrolled in course', course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};