import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar({ user, onLogout }) {
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
        {user && <span className="navbar-user">{user.name} ({user.role})</span>}
        <button className="navbar-logout" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default Navbar; 