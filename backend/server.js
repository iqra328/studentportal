const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();

// ============ CORS CONFIGURATION ============
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3004',
  'https://studentportal-ut2r.onrender.com',
  'https://*.netlify.app',
  'https://*.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(null, true); // Allow temporarily
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ MODELS ============
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
}, { timestamps: true }));

const Course = mongoose.models.Course || mongoose.model('Course', new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, default: 0 },
  isPremium: { type: Boolean, default: false },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  duration: { type: String, default: '4 weeks' },
  level: { type: String, default: 'beginner' }
}, { timestamps: true }));

// ============ TEST ROUTE ============
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// ============ REGISTER ROUTE ============
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'student'
    });
    
    await user.save();
    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ LOGIN ROUTE ============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ GET ALL COURSES ============
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await Course.find().populate('teacher', 'name email');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ GET SINGLE COURSE ============
app.get('/api/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('teacher', 'name email');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ CREATE COURSE (Teacher only) ============
// ============ CREATE COURSE ============
app.post('/api/courses', async (req, res) => {
  try {
    const { title, description, price, duration, level } = req.body;
    
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Creating course as user:', decoded.email);
    
    if (decoded.role !== 'teacher' && decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Only teachers can create courses' });
    }
    
    const course = new Course({
      title,
      description,
      price: price || 0,
      isPremium: (price || 0) > 0,
      teacher: decoded.id,
      duration: duration || '4 weeks',
      level: level || 'beginner'
    });
    
    await course.save();
    console.log('✅ Course created:', course._id);
    
    res.status(201).json({ success: true, course });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ message: error.message });
  }
});
// ============ ENROLL IN COURSE (Student only) ============
// ============ ENROLL IN COURSE (Student only) ============
app.post('/api/courses/:id/enroll', async (req, res) => {
  try {
    const courseId = req.params.id;
    console.log('📝 Enrollment request for course:', courseId);
    
    // Get token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - No token' });
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('User:', decoded.email);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    console.log('Course:', course.title);
    
    // Check if user exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('User:', user.name);
    
    // Check if already enrolled
    if (user.enrolledCourses && user.enrolledCourses.includes(courseId)) {
      return res.status(400).json({ message: 'Already enrolled' });
    }
    
    // Initialize array if needed
    if (!user.enrolledCourses) {
      user.enrolledCourses = [];
    }
    
    // ONLY update user - add course to enrolled list
    user.enrolledCourses.push(courseId);
    await user.save();
    console.log('✅ User updated');
    
    // ONLY update course students - using updateOne, NOT save()
    await Course.updateOne(
      { _id: courseId },
      { $addToSet: { students: decoded.id } }
    );
    console.log('✅ Course students updated');
    
    // Return success
    res.json({ 
      success: true, 
      message: 'Successfully enrolled in course' 
    });
    
  } catch (error) {
    console.error('❌ Enrollment error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ============ GET USER'S ENROLLED COURSES ============
app.get('/api/users/my-courses', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('enrolledCourses');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.enrolledCourses || []);
  } catch (error) {
    console.error('Error fetching user courses:', error);
    res.status(500).json({ message: error.message });
  }
});



// ============ DATABASE CONNECTION ============
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Error:', err.message));

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📝 API URL: http://localhost:${PORT}/api/test`);
});