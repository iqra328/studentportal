const express = require('express');
const router = express.Router();
const { authMiddleware, teacherMiddleware } = require('../middleware/auth');
const {
  createCourse,
  getAllCourses,
  getCourseById,
  enrollCourse
} = require('../controllers/courseController');

router.post('/', authMiddleware, teacherMiddleware, createCourse);
router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.post('/:id/enroll', authMiddleware, enrollCourse);

module.exports = router;