import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import API from '../utils/axios';

const MyCourses = () => {
  const { user } = useAuth();
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      const response = await API.get('/users/my-courses');
      const courses = Array.isArray(response.data) ? response.data : [];
      setMyCourses(courses);
    } catch (error) {
      console.error('Error fetching my courses:', error);
      setMyCourses([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading your courses...</div>;

  if (myCourses.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📚</div>
          <h2>No courses yet</h2>
          <p>You haven't enrolled in any courses. Browse available courses and start learning!</p>
          <button onClick={() => window.location.href = '/dashboard'} style={styles.browseBtn}>
            Browse Courses →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📖 My Courses</h1>
        <p style={styles.subtitle}>Continue your learning journey</p>
      </div>
      <div style={styles.courseGrid}>
        {myCourses.map(course => (
          <div key={course._id} style={styles.courseCard}>
            <div style={styles.courseHeader}>
              <h3 style={styles.courseTitle}>{course.title}</h3>
              <span style={course.isPremium ? styles.premiumBadge : styles.freeBadge}>
                {course.isPremium ? 'PREMIUM' : 'FREE'}
              </span>
            </div>
            <p style={styles.courseDesc}>{course.description?.substring(0, 100)}...</p>
            <div style={styles.courseMeta}>
              <span>⏱️ {course.duration}</span>
              <span>⭐ {course.level}</span>
              <span>👨‍🏫 {course.teacher?.name}</span>
            </div>
            <button style={styles.continueBtn}>Continue Learning →</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '30px 20px',
    minHeight: 'calc(100vh - 70px)',
    backgroundColor: '#f5f5f5'
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px'
  },
  title: {
    fontSize: '36px',
    color: '#333',
    marginBottom: '10px'
  },
  subtitle: {
    fontSize: '16px',
    color: '#666'
  },
  courseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '25px'
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  courseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    marginBottom: '15px'
  },
  courseTitle: {
    fontSize: '20px',
    color: '#333',
    flex: 1,
    margin: 0
  },
  premiumBadge: {
    backgroundColor: '#ffd700',
    color: '#333',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  freeBadge: {
    backgroundColor: '#4caf50',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  courseDesc: {
    color: '#666',
    lineHeight: '1.5',
    marginBottom: '15px'
  },
  courseMeta: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px',
    fontSize: '13px',
    color: '#888',
    flexWrap: 'wrap'
  },
  continueBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px',
    backgroundColor: 'white',
    borderRadius: '12px'
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px'
  },
  browseBtn: {
    padding: '12px 24px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '20px',
    fontSize: '16px'
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px'
  }
};

export default MyCourses;