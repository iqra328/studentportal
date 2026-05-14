import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(email, password);
    
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
          <div className="auth-logo">📚</div>
          <h1 className="auth-title">Welcome Back!</h1>
          <p className="auth-subtitle">Login to continue your learning journey</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>
              <span className="input-icon">📧</span> Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Logging in...' : '🔓 Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?
            <Link to="/register" className="auth-link">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;