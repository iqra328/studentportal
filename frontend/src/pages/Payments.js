import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import API from '../utils/axios';

const Payments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get all courses
      const coursesRes = await API.get('/courses');
      setCourses(coursesRes.data);
      
      // Get user's enrolled courses using API (not localhost)
      const myCoursesRes = await API.get('/users/my-courses');
      const myCourses = Array.isArray(myCoursesRes.data) ? myCoursesRes.data : [];
      
      // Set payment history from enrolled courses
      const paymentHistory = myCourses.map(course => ({
        id: course._id,
        title: course.title,
        amount: course.price || 0,
        status: 'completed',
        date: new Date(course.createdAt || Date.now()).toLocaleDateString(),
        paymentMethod: 'Credit Card'
      }));
      setPayments(paymentHistory);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (course) => {
    setSelectedCourse(course);
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    try {
      alert(`Processing payment for ${selectedCourse.title}...`);
      
      // Enroll the user
      await API.post(`/courses/${selectedCourse._id}/enroll`);
      
      alert(`✅ Successfully enrolled in ${selectedCourse.title}!`);
      setShowPaymentModal(false);
      fetchData(); // Refresh data
      
    } catch (error) {
      alert(error.response?.data?.message || 'Payment failed');
    }
  };

  // Get premium courses (courses not enrolled)
  const enrolledIds = payments.map(p => p.id);
  const premiumCourses = courses.filter(course => 
    course.price > 0 && !enrolledIds.includes(course._id)
  );

  // Get free courses
  const freeCourses = courses.filter(course => 
    course.price === 0 && !enrolledIds.includes(course._id)
  );

  const totalSpent = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>💳 Payment Center</h1>
        <p style={styles.subtitle}>Manage your subscriptions and payments</p>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div>
            <h3 style={styles.statNumber}>${totalSpent}</h3>
            <p style={styles.statLabel}>Total Spent</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📚</div>
          <div>
            <h3 style={styles.statNumber}>{payments.length}</h3>
            <p style={styles.statLabel}>Courses Purchased</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>⭐</div>
          <div>
            <h3 style={styles.statNumber}>Premium</h3>
            <p style={styles.statLabel}>Membership</p>
          </div>
        </div>
      </div>

      {/* Premium Courses Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🎯 Premium Courses</h2>
        <div style={styles.courseGrid}>
          {premiumCourses.map(course => (
            <div key={course._id} style={styles.courseCard}>
              <div style={styles.premiumBadge}>⭐ PREMIUM</div>
              <h3 style={styles.courseTitle}>{course.title}</h3>
              <p style={styles.courseDesc}>{course.description?.substring(0, 100)}...</p>
              <p style={styles.teacherInfo}>👨‍🏫 {course.teacher?.name}</p>
              <div style={styles.priceContainer}>
                <span style={styles.price}>${course.price}</span>
                <button onClick={() => handlePayment(course)} style={styles.buyBtn}>
                  Buy Now →
                </button>
              </div>
            </div>
          ))}
          {premiumCourses.length === 0 && (
            <div style={styles.emptyMessage}>No premium courses available</div>
          )}
        </div>
      </div>

      {/* Free Courses Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>✨ Free Courses</h2>
        <div style={styles.courseGrid}>
          {freeCourses.map(course => (
            <div key={course._id} style={styles.courseCard}>
              <div style={styles.freeBadge}>🎁 FREE</div>
              <h3 style={styles.courseTitle}>{course.title}</h3>
              <p style={styles.courseDesc}>{course.description?.substring(0, 100)}...</p>
              <p style={styles.teacherInfo}>👨‍🏫 {course.teacher?.name}</p>
              <div style={styles.priceContainer}>
                <span style={styles.freePrice}>Free</span>
                <button onClick={() => handlePayment(course)} style={styles.enrollFreeBtn}>
                  Enroll Free →
                </button>
              </div>
            </div>
          ))}
          {freeCourses.length === 0 && (
            <div style={styles.emptyMessage}>No free courses available</div>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📜 Payment History</h2>
        {payments.length === 0 ? (
          <div style={styles.emptyHistory}>
            <p>No payment history yet</p>
          </div>
        ) : (
          <div style={styles.historyTable}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Payment Method</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, index) => (
                  <tr key={index}>
                    <td>{payment.title}</td>
                    <td>${payment.amount}</td>
                    <td style={styles.successStatus}>✅ {payment.status}</td>
                    <td>{payment.date}</td>
                    <td>{payment.paymentMethod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedCourse && (
        <div style={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Complete Payment</h2>
            <div style={styles.modalContent}>
              <p><strong>Course:</strong> {selectedCourse.title}</p>
              <p><strong>Price:</strong> ${selectedCourse.price}</p>
              <p><strong>Payment Method:</strong> Credit Card / Debit Card</p>
              <div style={styles.cardDetails}>
                <input type="text" placeholder="Card Number" style={styles.cardInput} />
                <div style={styles.cardRow}>
                  <input type="text" placeholder="MM/YY" style={styles.smallInput} />
                  <input type="text" placeholder="CVC" style={styles.smallInput} />
                </div>
                <input type="text" placeholder="Cardholder Name" style={styles.cardInput} />
              </div>
            </div>
            <div style={styles.modalButtons}>
              <button onClick={() => setShowPaymentModal(false)} style={styles.cancelBtn}>
                Cancel
              </button>
              <button onClick={processPayment} style={styles.payBtn}>
                Pay ${selectedCourse.price}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' },
  header: { textAlign: 'center', marginBottom: '40px' },
  title: { fontSize: '36px', color: '#333', marginBottom: '10px' },
  subtitle: { fontSize: '16px', color: '#666' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' },
  statCard: { backgroundColor: 'white', padding: '25px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  statIcon: { fontSize: '40px' },
  statNumber: { fontSize: '28px', fontWeight: 'bold', color: '#667eea', margin: 0 },
  statLabel: { fontSize: '14px', color: '#666', margin: 0 },
  section: { marginBottom: '50px' },
  sectionTitle: { fontSize: '24px', marginBottom: '20px', color: '#333' },
  courseGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  courseCard: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  premiumBadge: { position: 'absolute', top: '15px', right: '15px', backgroundColor: '#ffd700', color: '#333', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  freeBadge: { position: 'absolute', top: '15px', right: '15px', backgroundColor: '#4caf50', color: 'white', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  courseTitle: { fontSize: '18px', marginBottom: '10px', paddingRight: '70px' },
  courseDesc: { color: '#666', marginBottom: '10px', lineHeight: '1.5' },
  teacherInfo: { color: '#667eea', marginBottom: '15px', fontSize: '14px' },
  priceContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' },
  price: { fontSize: '24px', fontWeight: 'bold', color: '#667eea' },
  freePrice: { fontSize: '20px', fontWeight: 'bold', color: '#4caf50' },
  buyBtn: { padding: '8px 20px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  enrollFreeBtn: { padding: '8px 20px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  historyTable: { backgroundColor: 'white', borderRadius: '12px', overflow: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  successStatus: { color: '#4caf50' },
  emptyMessage: { textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '12px', color: '#666' },
  emptyHistory: { textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '12px' },
  loading: { textAlign: 'center', padding: '50px', fontSize: '18px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { backgroundColor: 'white', borderRadius: '12px', padding: '30px', width: '90%', maxWidth: '500px' },
  modalTitle: { fontSize: '24px', marginBottom: '20px' },
  modalContent: { marginBottom: '20px' },
  cardDetails: { marginTop: '20px' },
  cardInput: { width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '6px' },
  cardRow: { display: 'flex', gap: '10px', marginBottom: '10px' },
  smallInput: { flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '6px' },
  modalButtons: { display: 'flex', gap: '15px', marginTop: '20px' },
  cancelBtn: { flex: 1, padding: '12px', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  payBtn: { flex: 1, padding: '12px', backgroundColor: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }
};

export default Payments;