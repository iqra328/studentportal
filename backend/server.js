const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  'http://localhost:3000',           // Local development
  'http://localhost:3001',           // Alternative local port
  'https://studentportal-ut2r.onrender.com',  // Backend itself
  'https://studentportal-git-main-iqra328.vercel.app',  // Vercel frontend (if any)
  'https://studentportal.vercel.app',                // Vercel custom
  'https://*.netlify.app',                           // All Netlify apps
  'https://studentportal.netlify.app'                // Your Netlify URL
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('Blocked origin:', origin);  // Debug log
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Define Models
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

// ============ ASSIGNMENT MODEL ============
const Assignment = mongoose.models.Assignment || mongoose.model('Assignment', new mongoose.Schema({
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
    grade: { type: Number },
    feedback: { type: String }
  }]
}, { timestamps: true }));

// ============ PAYMENT MODEL ============
const Payment = mongoose.models.Payment || mongoose.model('Payment', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  amount: { type: Number, required: true },
  stripePaymentId: { type: String },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' }
}, { timestamps: true }));

// ============ CLOUDINARY SETUP ============
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ============ MULTER SETUP ============
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'assignments',
    allowed_formats: ['pdf', 'doc', 'docx', 'jpg', 'png', 'jpeg']
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ============ TEST ROUTE ============
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// ============ AUTH ROUTES ============
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log('Registration:', { name, email, role });
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = new User({
      name, email, password: hashedPassword, role: role || 'student'
    });
    await user.save();
    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true, token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

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
      success: true, token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ COURSE ROUTES ============
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await Course.find().populate('teacher', 'name email');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('teacher', 'name email');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/courses', async (req, res) => {
  try {
    const { title, description, price, duration, level } = req.body;
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'teacher' && decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Only teachers can create courses' });
    }
    
    const course = new Course({
      title, description, price: price || 0, isPremium: (price || 0) > 0,
      teacher: decoded.id, duration: duration || '4 weeks', level: level || 'beginner'
    });
    await course.save();
    res.status(201).json({ success: true, course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/courses/:id/enroll', async (req, res) => {
  try {
    const courseId = req.params.id;
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.enrolledCourses && user.enrolledCourses.includes(courseId)) {
      return res.status(400).json({ message: 'Already enrolled' });
    }
    
    if (!user.enrolledCourses) user.enrolledCourses = [];
    user.enrolledCourses.push(courseId);
    await user.save();
    
    await Course.findByIdAndUpdate(courseId, { $push: { students: decoded.id } });
    res.json({ success: true, message: 'Enrolled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ ASSIGNMENT ROUTES ============
// Create assignment (Teacher only)
app.post('/api/assignments', async (req, res) => {
  try {
    const { title, description, course, dueDate } = req.body;
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const courseExists = await Course.findById(course);
    if (!courseExists) return res.status(404).json({ message: 'Course not found' });
    
    if (courseExists.teacher.toString() !== decoded.id && decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const assignment = new Assignment({
      title, description, course, dueDate, teacher: decoded.id
    });
    await assignment.save();
    res.status(201).json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit assignment (Student only)
app.post('/api/assignments/:id/submit', upload.single('file'), async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    const existingSubmission = assignment.submissions.find(
      s => s.student.toString() === decoded.id
    );
    
    if (existingSubmission) {
      existingSubmission.fileUrl = req.file.path;
      existingSubmission.fileName = req.file.originalname;
      existingSubmission.submittedAt = new Date();
    } else {
      assignment.submissions.push({
        student: decoded.id,
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
app.get('/api/assignments/course/:courseId', async (req, res) => {
  try {
    const assignments = await Assignment.find({ course: req.params.courseId })
      .populate('submissions.student', 'name email');
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ PAYMENT ROUTES ============
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create payment intent
app.post('/api/payments/create-intent', async (req, res) => {
  try {
    const { courseId } = req.body;
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(course.price * 100),
      currency: 'usd',
      metadata: { courseId, userId: decoded.id }
    });
    
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Confirm payment
app.post('/api/payments/confirm', async (req, res) => {
  try {
    const { paymentIntentId, courseId } = req.body;
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      const payment = new Payment({
        user: decoded.id,
        course: courseId,
        amount: paymentIntent.amount / 100,
        stripePaymentId: paymentIntentId,
        status: 'completed'
      });
      await payment.save();
      
      const user = await User.findById(decoded.id);
      const course = await Course.findById(courseId);
      
      if (!user.enrolledCourses.includes(courseId)) {
        user.enrolledCourses.push(courseId);
        course.students.push(decoded.id);
        await user.save();
        await course.save();
      }
      
      res.json({ success: true, message: 'Payment successful!' });
    } else {
      res.status(400).json({ message: 'Payment failed' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// ============ USER'S ENROLLED COURSES ROUTE ============
app.get('/api/users/my-courses', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - No token' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
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

// ============ INSTALL MISSING PACKAGES ============
// Run these commands in terminal:
// npm install multer multer-storage-cloudinary cloudinary stripe

// ============ CONNECT TO MONGODB ============
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Error:', err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📝 Test: http://localhost:${PORT}/api/test`);
  console.log(`📝 Assignments API: http://localhost:${PORT}/api/assignments`);
  console.log(`💰 Payments API: http://localhost:${PORT}/api/payments`);
});
