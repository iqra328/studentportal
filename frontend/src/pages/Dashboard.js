import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import API from '../utils/axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '', description: '', price: 0, duration: '4 weeks', level: 'beginner'
  });
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching data...');
      
      // Get all courses from live backend
      const coursesRes = await API.get('/courses');
      setCourses(coursesRes.data);
      console.log('Courses fetched:', coursesRes.data.length);
      
      // Get user's enrolled courses from live backend
      const myCoursesRes = await API.get('/users/my-courses');
      setMyCourses(myCoursesRes.data);
      console.log('Enrolled courses fetched:', myCoursesRes.data.length);
      console.log('Enrolled courses:', myCoursesRes.data);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const enrollCourse = async (courseId) => {
    if (enrolling) return;
    
    try {
      setEnrolling(true);
      console.log('Enrolling in course:', courseId);
      
      const response = await API.post(`/courses/${courseId}/enroll`);
      console.log('Enroll response:', response.data);
      
      if (response.data.success) {
        alert('✅ Successfully enrolled in course!');
        // Refresh data to update counts
        await fetchData();
        // Switch to my-courses tab
        setActiveTab('my-courses');
      } else {
        alert(response.data.message || 'Enrollment failed');
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      alert(error.response?.data?.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  const createCourse = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post('/courses', newCourse);
      console.log('Create course response:', response.data);
      
      if (response.data.success) {
        alert('✅ Course created successfully!');
        setNewCourse({ title: '', description: '', price: 0, duration: '4 weeks', level: 'beginner' });
        setShowCreateModal(false);
        await fetchData();
      } else {
        alert(response.data.message || 'Failed to create course');
      }
    } catch (error) {
      console.error('Create course error:', error);
      alert(error.response?.data?.message || 'Failed to create course');
    }
  };

  const availableCourses = courses.filter(course => 
    !myCourses.some(myCourse => myCourse._id === course._id)
  );

  const getRoleTitle = () => {
    switch(user?.role) {
      case 'teacher':
        return { title: '👨‍🏫 Teacher Portal', subtitle: 'Manage your courses and students' };
      case 'admin':
        return { title: '👑 Admin Portal', subtitle: 'Platform Management Dashboard' };
      default:
        return { title: '🎓 Student Portal', subtitle: 'Your Learning Dashboard' };
    }
  };

  const roleInfo = getRoleTitle();

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      {/* Header with Role-Based Title */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>{roleInfo.title}</h1>
        <p style={styles.headerSubtitle}>{roleInfo.subtitle}</p>
      </div>

      {/* Role-Based Welcome Banner */}
      <div style={styles.welcomeBanner}>
        <div>
          {user?.role === 'teacher' ? (
            <>
              <h1 style={styles.welcomeTitle}>👨‍🏫 Welcome back, Teacher {user?.name}!</h1>
              <p style={styles.welcomeText}>Create engaging courses, manage enrollments, and track student progress</p>
              <div style={styles.teacherStats}>
                <span>📚 Your Courses: {courses.filter(c => c.teacher?._id === user?.id).length}</span>
                <span>👥 Total Students: {courses.reduce((sum, c) => sum + (c.students?.length || 0), 0)}</span>
              </div>
            </>
          ) : user?.role === 'admin' ? (
            <>
              <h1 style={styles.welcomeTitle}>👑 Welcome back, Admin {user?.name}!</h1>
              <p style={styles.welcomeText}>Platform overview, user management, and system analytics</p>
              <div style={styles.teacherStats}>
                <span>📊 Total Users: {courses.length + myCourses.length}</span>
                <span>💰 Total Revenue: ${courses.reduce((sum, c) => sum + (c.price || 0), 0)}</span>
              </div>
            </>
          ) : (
            <>
              <h1 style={styles.welcomeTitle}>🎓 Welcome back, Student {user?.name}!</h1>
              <p style={styles.welcomeText}>Continue your learning journey, track progress, and achieve your goals</p>
              <div style={styles.studentStats}>
                <span>📖 Enrolled: {myCourses.length} courses</span>
                <span>⭐ Completed: 0 courses</span>
                <span>🎯 In Progress: {myCourses.length} courses</span>
              </div>
            </>
          )}
        </div>
        {user?.role === 'teacher' && (
          <button onClick={() => setShowCreateModal(true)} style={styles.createCourseBtn}>
            + Create New Course
          </button>
        )}
      </div>

      {/* Stats Cards - Role Based */}
      <div style={styles.statsGrid}>
        {user?.role === 'teacher' ? (
          <>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📚</div>
              <div>
                <h3 style={styles.statNumber}>{courses.filter(c => c.teacher?._id === user?.id).length}</h3>
                <p style={styles.statLabel}>My Courses</p>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>👥</div>
              <div>
                <h3 style={styles.statNumber}>{courses.reduce((sum, c) => sum + (c.students?.length || 0), 0)}</h3>
                <p style={styles.statLabel}>Total Students</p>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>💰</div>
              <div>
                <h3 style={styles.statNumber}>${courses.reduce((sum, c) => sum + (c.price || 0), 0)}</h3>
                <p style={styles.statLabel}>Total Earnings</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📚</div>
              <div>
                <h3 style={styles.statNumber}>{courses.length}</h3>
                <p style={styles.statLabel}>Total Courses</p>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>✅</div>
              <div>
                <h3 style={styles.statNumber}>{myCourses.length}</h3>
                <p style={styles.statLabel}>Enrolled</p>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>🎯</div>
              <div>
                <h3 style={styles.statNumber}>In Progress</h3>
                <p style={styles.statLabel}>Learning</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button onClick={() => setActiveTab('dashboard')} style={activeTab === 'dashboard' ? styles.activeTab : styles.tab}>
          📊 Dashboard
        </button>
        <button onClick={() => setActiveTab('my-courses')} style={activeTab === 'my-courses' ? styles.activeTab : styles.tab}>
          📖 My Courses ({myCourses.length})
        </button>
        <button onClick={() => setActiveTab('available')} style={activeTab === 'available' ? styles.activeTab : styles.tab}>
          🎯 Available Courses ({availableCourses.length})
        </button>
        {user?.role === 'teacher' && (
          <button onClick={() => setActiveTab('create')} style={activeTab === 'create' ? styles.activeTab : styles.tab}>
            ✨ Create Course
          </button>
        )}
        <button onClick={() => setActiveTab('payments')} style={activeTab === 'payments' ? styles.activeTab : styles.tab}>
          💳 Payments
        </button>
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={styles.welcomeCard}>
              {user?.role === 'teacher' ? (
                <>
                  <h2>📊 Teacher Dashboard Overview</h2>
                  <p>You have {courses.filter(c => c.teacher?._id === user?.id).length} active courses with {courses.reduce((sum, c) => sum + (c.students?.length || 0), 0)} students enrolled.</p>
                  <p>✨ Keep creating amazing content for your students!</p>
                </>
              ) : user?.role === 'admin' ? (
                <>
                  <h2>🏢 Admin Dashboard</h2>
                  <p>Manage platform, users, and monitor overall performance.</p>
                  <p>📈 Total Courses: {courses.length} | 👥 Total Users: {courses.length + myCourses.length}</p>
                </>
              ) : (
                <>
                  <h2>🎯 Your Learning Path</h2>
                  <p>You are enrolled in {myCourses.length} course(s). Keep learning and growing!</p>
                  {myCourses.length === 0 && (
                    <button onClick={() => setActiveTab('available')} style={styles.browseBtn}>
                      Browse Courses →
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* My Courses Tab */}
        {activeTab === 'my-courses' && (
          <div>
            <h2 style={styles.sectionTitle}>📖 My Enrolled Courses</h2>
            {myCourses.length === 0 ? (
              <div style={styles.emptyState}>
                <p>You haven't enrolled in any courses yet.</p>
                <button onClick={() => setActiveTab('available')} style={styles.browseBtn}>
                  Browse Available Courses
                </button>
              </div>
            ) : (
              <div style={styles.courseGrid}>
                {myCourses.map(course => (
                  <div key={course._id} style={styles.courseCard}>
                    <h3 style={styles.courseTitle}>{course.title}</h3>
                    <p style={styles.courseDesc}>{course.description?.substring(0, 100)}...</p>
                    <p style={styles.teacherInfo}>👨‍🏫 {course.teacher?.name}</p>
                    <div style={styles.progressBar}>
                      <div style={{...styles.progressFill, width: '30%'}}></div>
                    </div>
                    <button style={styles.continueBtn}>Continue Learning →</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Available Courses Tab */}
        {activeTab === 'available' && (
          <div>
            <h2 style={styles.sectionTitle}>🎯 Available Courses</h2>
            {availableCourses.length === 0 ? (
              <div style={styles.emptyState}>
                <p>You're enrolled in all available courses! 🎉</p>
              </div>
            ) : (
              <div style={styles.courseGrid}>
                {availableCourses.map(course => (
                  <div key={course._id} style={styles.courseCard}>
                    <div style={course.isPremium ? styles.premiumBadge : styles.freeBadge}>
                      {course.isPremium ? '💰 PREMIUM' : '✨ FREE'}
                    </div>
                    <h3 style={styles.courseTitle}>{course.title}</h3>
                    <p style={styles.courseDesc}>{course.description?.substring(0, 100)}...</p>
                    <p style={styles.teacherInfo}>👨‍🏫 {course.teacher?.name}</p>
                    <div style={styles.cardFooter}>
                      <span style={styles.price}>${course.price}</span>
                      <button 
                        onClick={() => enrollCourse(course._id)} 
                        style={styles.enrollBtn}
                        disabled={enrolling}
                      >
                        {enrolling ? 'Enrolling...' : 'Enroll Now →'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Course Tab (Teacher Only) */}
        {activeTab === 'create' && user?.role === 'teacher' && (
          <div style={styles.createCard}>
            <h2 style={styles.modalTitle}>✨ Create New Course</h2>
            <form onSubmit={createCourse} style={styles.createForm}>
              <input type="text" placeholder="Course Title" value={newCourse.title}
                onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                style={styles.input} required />
              <textarea placeholder="Course Description" value={newCourse.description}
                onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                style={styles.textarea} required />
              <input type="number" placeholder="Price ($)" value={newCourse.price}
                onChange={(e) => setNewCourse({...newCourse, price: parseFloat(e.target.value)})}
                style={styles.input} required />
              <input type="text" placeholder="Duration (e.g., 8 weeks)" value={newCourse.duration}
                onChange={(e) => setNewCourse({...newCourse, duration: e.target.value})}
                style={styles.input} />
              <select value={newCourse.level} onChange={(e) => setNewCourse({...newCourse, level: e.target.value})}
                style={styles.input}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <button type="submit" style={styles.submitBtn}>Create Course</button>
            </form>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div>
            <h2 style={styles.sectionTitle}>💳 Payment History</h2>
            <div style={styles.paymentCard}>
              <p>💰 Total Spent: $0</p>
              <p>📊 Active Subscriptions: 0</p>
              <div style={styles.paymentMethods}>
                <h4>Payment Methods</h4>
                <button style={styles.addPaymentBtn}>+ Add Payment Method</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Create New Course</h2>
            <form onSubmit={createCourse}>
              <input type="text" placeholder="Course Title" value={newCourse.title}
                onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                style={styles.modalInput} required />
              <textarea placeholder="Course Description" value={newCourse.description}
                onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                style={styles.modalTextarea} required />
              <input type="number" placeholder="Price ($)" value={newCourse.price}
                onChange={(e) => setNewCourse({...newCourse, price: parseFloat(e.target.value)})}
                style={styles.modalInput} required />
              <div style={styles.modalButtons}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" style={styles.submitBtn}>Create Course</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  headerTitle: {
    fontSize: '32px',
    color: '#333',
    marginBottom: '10px'
  },
  headerSubtitle: {
    fontSize: '16px',
    color: '#666'
  },
  welcomeBanner: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '16px',
    padding: '30px',
    marginBottom: '30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'white',
    flexWrap: 'wrap'
  },
  welcomeTitle: {
    fontSize: '28px',
    marginBottom: '10px'
  },
  welcomeText: {
    fontSize: '14px',
    opacity: 0.9,
    marginBottom: '15px'
  },
  teacherStats: {
    display: 'flex',
    gap: '20px',
    fontSize: '13px',
    flexWrap: 'wrap'
  },
  studentStats: {
    display: 'flex',
    gap: '20px',
    fontSize: '13px',
    flexWrap: 'wrap'
  },
  createCourseBtn: {
    padding: '12px 24px',
    backgroundColor: 'white',
    color: '#667eea',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  statIcon: {
    fontSize: '40px'
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#667eea',
    margin: 0
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    margin: 0
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '10px',
    flexWrap: 'wrap'
  },
  tab: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#666',
    borderRadius: '8px'
  },
  activeTab: {
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    borderRadius: '8px'
  },
  tabContent: {
    minHeight: '400px'
  },
  welcomeCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '30px',
    borderRadius: '12px',
    textAlign: 'center',
    marginBottom: '30px'
  },
  sectionTitle: {
    fontSize: '24px',
    marginBottom: '20px',
    color: '#333'
  },
  courseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px'
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    position: 'relative'
  },
  courseTitle: {
    fontSize: '18px',
    marginBottom: '10px',
    color: '#333'
  },
  courseDesc: {
    color: '#666',
    marginBottom: '10px',
    lineHeight: '1.5'
  },
  teacherInfo: {
    color: '#667eea',
    marginBottom: '10px',
    fontSize: '14px'
  },
  premiumBadge: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    backgroundColor: '#ffd700',
    color: '#333',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  freeBadge: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    backgroundColor: '#4caf50',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  price: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#667eea'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #eee'
  },
  enrollBtn: {
    padding: '8px 16px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed'
    }
  },
  continueBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '10px'
  },
  browseBtn: {
    padding: '10px 20px',
    backgroundColor: 'white',
    color: '#667eea',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '15px',
    fontWeight: 'bold'
  },
  progressBar: {
    backgroundColor: '#f0f0f0',
    borderRadius: '10px',
    height: '8px',
    margin: '15px 0',
    overflow: 'hidden'
  },
  progressFill: {
    backgroundColor: '#667eea',
    height: '100%',
    borderRadius: '10px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '50px',
    backgroundColor: 'white',
    borderRadius: '12px'
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px'
  },
  createCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    maxWidth: '600px',
    margin: '0 auto'
  },
  createForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  input: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px'
  },
  textarea: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    minHeight: '100px'
  },
  submitBtn: {
    padding: '12px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  paymentCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px'
  },
  paymentMethods: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #eee'
  },
  addPaymentBtn: {
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '10px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    width: '90%',
    maxWidth: '500px'
  },
  modalTitle: {
    fontSize: '24px',
    marginBottom: '20px',
    color: '#333'
  },
  modalInput: {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    border: '1px solid #ddd',
    borderRadius: '6px'
  },
  modalTextarea: {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    minHeight: '100px'
  },
  modalButtons: {
    display: 'flex',
    gap: '15px',
    marginTop: '20px'
  },
  cancelBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  }
};

export default Dashboard;