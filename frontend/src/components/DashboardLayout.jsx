import React from 'react';
import './DashboardLayout.css';

export default function DashboardLayout({
  title,
  user,
  onLogout,
  onProfileClick,
  navTabs,
  activeTab,
  setActiveTab,
  children
}) {
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="dashboard unified-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>{title}</h1>
          <div className="user-info">
            <span>Welcome, {user.name}</span>
            <span className="user-role">{user.designation || `Grade: ${user.grade}`}</span>
            {onProfileClick && (
              <button onClick={onProfileClick} className="profile-avatar">
                {user.profile_picture_url || user.profile_picture ? (
                  <img 
                    src={user.profile_picture_url || user.profile_picture} 
                    alt={user.name}
                    className="profile-image"
                  />
                ) : (
                  <div className="profile-initials">
                    {getInitials(user.name)}
                  </div>
                )}
              </button>
            )}
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>
      {navTabs && navTabs.length > 0 && (
        <nav className="dashboard-nav">
          {navTabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-btn${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      )}
      <main className="dashboard-content">
        {children}
      </main>
    </div>
  );
} 