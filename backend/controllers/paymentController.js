const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const Course = require('../models/Course');
const User = require('../models/User');

exports.createPaymentIntent = async (req, res) => {
  try {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: course.price * 100,
      currency: 'usd',
      metadata: {
        courseId: course._id.toString(),
        userId: req.user.id
      }
    });
    
    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, courseId } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      const payment = new Payment({
        user: req.user.id,
        course: courseId,
        amount: paymentIntent.amount / 100,
        stripePaymentId: paymentIntentId,
        status: 'completed'
      });
      
      await payment.save();
      
      const user = await User.findById(req.user.id);
      const course = await Course.findById(courseId);
      
      if (!user.enrolledCourses.includes(courseId)) {
        user.enrolledCourses.push(courseId);
        course.students.push(user._id);
        await user.save();
        await course.save();
      }
      
      res.json({ message: 'Payment successful', payment });
    } else {
      res.status(400).json({ message: 'Payment failed' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};