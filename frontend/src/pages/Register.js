import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🎓</div>
          <h1 className="auth-title">Get Started!</h1>
          <p className="auth-subtitle">Create your account to start learning</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>
              <span className="input-icon">👤</span> Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="auth-input"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="input-group">
            <label>
              <span className="input-icon">📧</span> Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="auth-input"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="input-group">
            <label>
              <span className="input-icon">🔒</span> Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="auth-input"
              placeholder="Create a password (min. 6 characters)"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="input-group">
            <label>
              <span className="input-icon">✓</span> Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="auth-input"
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="input-group">
            <label>
              <span className="input-icon">👔</span> I want to join as
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="auth-input role-select"
            >
              <option value="student">🎓 Student - Learn new skills</option>
              <option value="teacher">👨‍🏫 Teacher - Share knowledge</option>
            </select>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating Account...' : '✨ Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?
            <Link to="/login" className="auth-link">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;