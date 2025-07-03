import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';
import Transactions from './Transactions';
import AdminPanel from './AdminPanel';
import SignUpPage from './SignUpPage';
import { jwtDecode } from 'jwt-decode';
import './App.css';

function RequireAuth({ token, children }) {
  return token ? children : <Navigate to="/login" replace />;
}

function RedirectIfAuth({ token, children }) {
  return token ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('jwt') || '');

  // Save token to localStorage
  useEffect(() => {
    if (token) localStorage.setItem('jwt', token);
    else localStorage.removeItem('jwt');
  }, [token]);

  // Decode JWT and set user info on token change
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const decoded = jwtDecode(token);
      setUser({
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
      });
    } catch (e) {
      setUser(null);
    }
  }, [token]);

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('jwt');
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          <RedirectIfAuth token={token}>
            <LoginPage setUser={setUser} setToken={setToken} />
          </RedirectIfAuth>
        } />
        <Route path="/signup" element={
          <RedirectIfAuth token={token}>
            <SignUpPage />
          </RedirectIfAuth>
        } />
        <Route path="/dashboard" element={
          <RequireAuth token={token}>
            <Dashboard token={token} user={user} onLogout={handleLogout} />
          </RequireAuth>
        } />
        <Route path="/transactions" element={
          <RequireAuth token={token}>
            <Transactions token={token} user={user} onLogout={handleLogout} />
          </RequireAuth>
        } />
        <Route path="/admin" element={
          <RequireAuth token={token}>
            {user && user.role === 'admin' ? (
              <AdminPanel token={token} user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/dashboard" replace />
            )}
          </RequireAuth>
        } />
        <Route path="*" element={
          token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
}

export default App;
