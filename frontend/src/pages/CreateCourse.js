import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import API from '../utils/axios';

const CreateCourse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    duration: '4 weeks',
    level: 'beginner'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await API.post('/courses', formData);
      alert('✅ Course created successfully!');
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'teacher' && user?.role !== 'admin') {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <h2>Access Denied</h2>
          <p>Only teachers can create courses.</p>
          <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>✨ Create New Course</h1>
        <p style={styles.subtitle}>Share your knowledge with students</p>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Course Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              style={styles.input}
              required
              placeholder="e.g., Complete Web Development Bootcamp"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Course Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              style={styles.textarea}
              required
              placeholder="Describe what students will learn..."
              rows="5"
            />
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Price ($) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                style={styles.input}
                required
                min="0"
                step="0.01"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Duration</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g., 8 weeks"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Level</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Creating...' : '✨ Create Course'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: 'calc(100vh - 70px)',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '40px 20px'
  },
  card: {
    maxWidth: '700px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
  },
  title: {
    fontSize: '32px',
    color: '#333',
    marginBottom: '10px',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    textAlign: 'center',
    marginBottom: '30px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '15px'
  },
  label: {
    fontWeight: '600',
    color: '#333'
  },
  input: {
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px'
  },
  textarea: {
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  submitBtn: {
    padding: '14px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '10px'
  },
  errorCard: {
    maxWidth: '500px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '40px',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
  },
  backBtn: {
    padding: '12px 24px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '20px'
  }
};

export default CreateCourse;