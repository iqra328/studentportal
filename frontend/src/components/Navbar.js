import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav style={styles.navbar}>
      <div style={styles.navContainer}>
        <Link to="/dashboard" style={styles.logo}>
          📚 CoursePortal
        </Link>
        <div style={styles.navLinks}>
          <Link to="/dashboard" style={styles.navLink}>Dashboard</Link>
          <Link to="/my-courses" style={styles.navLink}>My Courses</Link>
          {user.role === 'teacher' && (
            <Link to="/create-course" style={styles.navLink}>Create Course</Link>
          )}
          <Link to="/payments" style={styles.navLink}>Payments</Link>
        </div>
        <div style={styles.userSection}>
          <span style={styles.userName}>👤 {user.name}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    backgroundColor: '#2c3e50',
    padding: '15px 0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  navContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '15px'
  },
  logo: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '20px',
    fontWeight: 'bold'
  },
  navLinks: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap'
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    transition: 'background 0.3s'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  userName: {
    color: 'white'
  },
  logoutBtn: {
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};

export default Navbar;