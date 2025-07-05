import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './LoginPage';
import AdminPanel from './AdminPanel';
import Navbar from './Navbar';
import ProfileModal from './ProfileModal';
import './App.css';
import './components/DashboardComponents.css';
import { jwtDecode } from 'jwt-decode';

import G1Dashboard from './G1Dashboard';
import G2Dashboard from './G2Dashboard';
import G3Dashboard from './G3Dashboard';

function RequireAuth({ token, children }) {
  return token ? children : <Navigate to="/login" replace />;
}

function RedirectIfAuth({ token, user, children }) {
  if (!token) return children;
  
  // Redirect to appropriate dashboard based on user role
  if (user) {
    if (user.is_admin) return <Navigate to="/admin" replace />;
    if (user.grade === 'G3') return <Navigate to="/finance-head" replace />;
    if (user.grade === 'G2') return <Navigate to="/manager" replace />;
    if (user.grade === 'G1') return <Navigate to="/employee" replace />;
  }
  
  return <Navigate to="/login" replace />;
}

function fetchUserProfile(token) {
  return fetch('http://localhost:5000/me', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).then(res => res.ok ? res.json() : null);
}

function AppContent({ user, token, onLogout, setUser, setToken, profileOpen, setProfileOpen }) {
  const location = useLocation();

  // Only show Navbar on non-dashboard pages
  const hideNavbarRoutes = [
    '/dashboard/g1', '/dashboard/g2', '/dashboard/g3',
    '/finance-head', '/manager', '/employee', '/admin'
  ];
  const shouldShowNavbar = !hideNavbarRoutes.includes(location.pathname);

  // Role-based redirect after login
  const getDashboardRoute = () => {
    if (!user) return '/login';
    if (user.is_admin) return '/admin';
    if (user.grade === 'G3') return '/finance-head';
    if (user.grade === 'G2') return '/manager';
    if (user.grade === 'G1') return '/employee';
    return '/login';
  };

  // Check if user is trying to access a route they shouldn't
  const shouldRedirectToAdmin = (user, path) => {
    return user && user.is_admin && path !== '/admin';
  };

  const shouldRedirectFromAdmin = (user, path) => {
    return user && !user.is_admin && path === '/admin';
  };

  return (
    <>
      {shouldShowNavbar && user && (
        <Navbar user={user} onLogout={onLogout} onProfileClick={() => setProfileOpen(true)} />
      )}
      {profileOpen && user && (
        <ProfileModal user={user} token={token} setUser={setUser} onClose={() => setProfileOpen(false)} />
      )}
      <Routes>
        <Route path="/login" element={
          <RedirectIfAuth token={token} user={user}>
            <LoginPage setUser={setUser} setToken={setToken} />
          </RedirectIfAuth>
        } />
        <Route path="/admin" element={
          <RequireAuth token={token}>
            {user && user.is_admin ? <AdminPanel token={token} user={user} onLogout={onLogout} onProfileClick={() => setProfileOpen(true)} /> : <Navigate to={getDashboardRoute()} replace />}
          </RequireAuth>
        } />
        <Route path="/dashboard/g1" element={
          <RequireAuth token={token}>
            {user && user.grade === 'G1' && !user.is_admin ? <G1Dashboard user={user} token={token} onLogout={onLogout} onProfileClick={() => setProfileOpen(true)} /> : <Navigate to={getDashboardRoute()} replace />}
          </RequireAuth>
        } />
        <Route path="/dashboard/g2" element={
          <RequireAuth token={token}>
            {user && user.grade === 'G2' && !user.is_admin ? <G2Dashboard user={user} token={token} onLogout={onLogout} onProfileClick={() => setProfileOpen(true)} /> : <Navigate to={getDashboardRoute()} replace />}
          </RequireAuth>
        } />
        <Route path="/dashboard/g3" element={
          <RequireAuth token={token}>
            {user && user.grade === 'G3' && !user.is_admin ? <G3Dashboard user={user} token={token} onLogout={onLogout} onProfileClick={() => setProfileOpen(true)} /> : <Navigate to={getDashboardRoute()} replace />}
          </RequireAuth>
        } />
        <Route path="/finance-head" element={
          <RequireAuth token={token}>
            {shouldRedirectToAdmin(user, '/finance-head') ? <Navigate to="/admin" replace /> : 
             user && user.grade === 'G3' ? <G3Dashboard user={user} token={token} onLogout={onLogout} onProfileClick={() => setProfileOpen(true)} /> : 
             <Navigate to={getDashboardRoute()} replace />}
          </RequireAuth>
        } />
        <Route path="/manager" element={
          <RequireAuth token={token}>
            {shouldRedirectToAdmin(user, '/manager') ? <Navigate to="/admin" replace /> : 
             user && user.grade === 'G2' ? <G2Dashboard user={user} token={token} onLogout={onLogout} onProfileClick={() => setProfileOpen(true)} /> : 
             <Navigate to={getDashboardRoute()} replace />}
          </RequireAuth>
        } />
        <Route path="/employee" element={
          <RequireAuth token={token}>
            {shouldRedirectToAdmin(user, '/employee') ? <Navigate to="/admin" replace /> : 
             user && user.grade === 'G1' ? <G1Dashboard user={user} token={token} onLogout={onLogout} onProfileClick={() => setProfileOpen(true)} /> : 
             <Navigate to={getDashboardRoute()} replace />}
          </RequireAuth>
        } />
        <Route path="*" element={<Navigate to={getDashboardRoute()} replace />} />
      </Routes>
    </>
  );
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
    fetchUserProfile(token)
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, [token]);

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('jwt');
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  return (
    <Router>
      <AppContent 
        user={user} 
        token={token} 
        onLogout={handleLogout} 
        setUser={setUser}
        setToken={setToken}
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
      />
    </Router>
  );
}

export default App;
