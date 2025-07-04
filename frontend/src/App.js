import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';
import Transactions from './Transactions';
import AdminPanel from './AdminPanel';
import Navbar from './Navbar';
import ProfileModal from './ProfileModal';
import './App.css';
import { jwtDecode } from 'jwt-decode';

function RequireAuth({ token, children }) {
  return token ? children : <Navigate to="/login" replace />;
}

function RedirectIfAuth({ token, children }) {
  return token ? <Navigate to="/dashboard" replace /> : children;
}

function fetchUserProfile(token, id) {
  return fetch(`http://localhost:5000/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).then(res => res.ok ? res.json() : null);
}

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('jwt') || '');
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Save token to localStorage
  useEffect(() => {
    if (token) localStorage.setItem('jwt', token);
    else localStorage.removeItem('jwt');
  }, [token]);

  // Fetch user profile from backend on token change
  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const decoded = jwtDecode(token);
      fetchUserProfile(token, decoded.id)
        .then(data => {
          setUser(data);
          setLoading(false);
        })
        .catch(() => {
          setUser(null);
          setLoading(false);
        });
    } catch (e) {
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('jwt');
  };

  if (loading) return <div>Loading...</div>;
  console.log('User state:', user);

  return (
    <Router>
      {user && <Navbar user={user} onLogout={handleLogout} onProfileClick={() => setProfileOpen(true)} />}
      {profileOpen && user && (
        <ProfileModal user={user} token={token} setUser={setUser} onClose={() => setProfileOpen(false)} />
      )}
      <Routes>
        <Route path="/login" element={
          <RedirectIfAuth token={token}>
            <LoginPage setUser={setUser} setToken={setToken} />
          </RedirectIfAuth>
        } />
        <Route path="/dashboard" element={
          <RequireAuth token={token}>
            {user ? <Dashboard token={token} user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
          </RequireAuth>
        } />
        <Route path="/transactions" element={
          <RequireAuth token={token}>
            {user ? <Transactions token={token} user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
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
