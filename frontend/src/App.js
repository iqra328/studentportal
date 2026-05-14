import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Payments from './pages/Payments';
import CreateCourse from './pages/CreateCourse';
import MyCourses from './pages/MyCourses';
import './styles/auth.css'; 



const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <div>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/my-courses" element={
          <ProtectedRoute>
            <MyCourses />
          </ProtectedRoute>
        } />
        <Route path="/create-course" element={
          <ProtectedRoute>
            <CreateCourse />
          </ProtectedRoute>
        } />
        <Route path="/payments" element={
          <ProtectedRoute>
            <Payments />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;