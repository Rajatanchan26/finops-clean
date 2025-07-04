import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar({ user, onLogout, onProfileClick }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <span className="navbar-logo">FinOps</span>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/transactions">Transactions</Link>
        {user && user.role === 'admin' && <Link to="/admin">Admin Panel</Link>}
      </div>
      <div className="navbar-right">
        {user && (
          <>
            <span className="navbar-user">{user.name} ({user.role})</span>
            <span
              className="navbar-avatar"
              onClick={onProfileClick}
              style={{
                display: 'inline-block',
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#e0e7ff',
                overflow: 'hidden',
                marginLeft: 10,
                cursor: 'pointer',
                verticalAlign: 'middle',
                border: '2px solid #2563eb',
              }}
            >
              {user.profile_picture_url ? (
                <img src={user.profile_picture_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#2563eb', fontWeight: 700, fontSize: 18 }}>
                  {user.name ? user.name[0].toUpperCase() : '?'}
                </span>
              )}
            </span>
          </>
        )}
        <button className="navbar-logout" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default Navbar; 