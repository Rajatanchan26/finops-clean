import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getApiBaseUrl } from '../utils/api';

function MobileNavigation({ user, onLogout, onProfileClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Determine active tab from current route
    const path = location.pathname;
    if (path.includes('/dashboard/g1') || path.includes('/dashboard/g2') || path.includes('/dashboard/g3')) {
      // Extract tab from URL or default to overview
      const urlParams = new URLSearchParams(location.search);
      setActiveTab(urlParams.get('tab') || 'overview');
    }
  }, [location]);

  useEffect(() => {
    // WebSocket connection for notifications
    const token = localStorage.getItem('jwt');
    if (token) {
      const ws = new WebSocket(`${getApiBaseUrl().replace('http', 'ws')}?token=${token}`);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          setNotifications(prev => [data, ...prev.slice(0, 9)]);
          setUnreadCount(prev => prev + 1);
        } else if (data.type === 'pending_notifications') {
          setNotifications(data.notifications);
          setUnreadCount(data.notifications.filter(n => !n.read).length);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      return () => {
        ws.close();
      };
    }
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
    
    // Update URL with tab parameter
    const currentPath = location.pathname;
    const newUrl = `${currentPath}?tab=${tab}`;
    navigate(newUrl, { replace: true });
  };

  const getTabsForUser = () => {
    const baseTabs = [
      { id: 'overview', label: 'Overview', icon: '📊' },
      { id: 'invoices', label: 'Invoices', icon: '📄' },
      { id: 'commission', label: 'Commission', icon: '💸' }
    ];

    // Add projects tab for G2 users
            if (user.grade === 2) {
      baseTabs.splice(2, 0, { id: 'projects', label: 'Projects', icon: '📋' });
    }

    return baseTabs;
  };

  const handleSwipe = (direction) => {
    const tabs = getTabsForUser();
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    
    if (direction === 'left' && currentIndex < tabs.length - 1) {
      handleTabChange(tabs[currentIndex + 1].id);
    } else if (direction === 'right' && currentIndex > 0) {
      handleTabChange(tabs[currentIndex - 1].id);
    }
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <div className="mobile-navigation">
      {/* Top Header */}
      <div className="mobile-header">
        <div className="header-left">
          <button 
            className="menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            ☰
          </button>
          <h1 className="mobile-title">
                    {user.grade === 1 ? 'G1 Dashboard' :
         user.grade === 2 ? 'G2 Dashboard' : 'G3 Dashboard'}
          </h1>
        </div>
        
        <div className="header-right">
          <button 
            className="notification-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            🔔
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Side Menu */}
      {isMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="menu-header">
              <div className="user-info">
                <div className="user-avatar">👤</div>
                <div className="user-details">
                  <div className="user-name">{user.name}</div>
                  <div className="user-role">{user.grade} - {user.department}</div>
                </div>
              </div>
            </div>

            <div className="menu-section">
              <h3>Navigation</h3>
              {getTabsForUser().map(tab => (
                <button
                  key={tab.id}
                  className={`menu-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  <span className="menu-icon">{tab.icon}</span>
                  <span className="menu-label">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="menu-section">
              <h3>Notifications</h3>
              {notifications.length > 0 ? (
                <div className="notifications-list">
                  {notifications.slice(0, 5).map(notification => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${!notification.read ? 'unread' : ''}`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="notification-icon">
                        {notification.type === 'invoice_approved' ? '✅' :
                         notification.type === 'invoice_rejected' ? '❌' :
                         notification.type === 'budget_alert' ? '⚠️' :
                         notification.type === 'commission_earned' ? '💸' : '🔔'}
                      </div>
                      <div className="notification-content">
                        <div className="notification-title">{notification.title}</div>
                        <div className="notification-message">{notification.message}</div>
                        <div className="notification-time">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    className="clear-notifications-btn"
                    onClick={clearAllNotifications}
                  >
                    Clear All
                  </button>
                </div>
              ) : (
                <div className="no-notifications">No notifications</div>
              )}
            </div>

            <div className="menu-section">
              <h3>Account</h3>
              <button className="menu-item" onClick={onProfileClick}>
                <span className="menu-icon">👤</span>
                <span className="menu-label">Profile</span>
              </button>
              <button className="menu-item" onClick={onLogout}>
                <span className="menu-icon">🚪</span>
                <span className="menu-label">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="bottom-navigation">
        {getTabsForUser().map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Swipe Area */}
      <div 
        className="swipe-area"
        onTouchStart={(e) => {
          const touch = e.touches[0];
          e.target.dataset.startX = touch.clientX;
        }}
        onTouchEnd={(e) => {
          const touch = e.changedTouches[0];
          const startX = parseInt(e.target.dataset.startX);
          const endX = touch.clientX;
          const diff = startX - endX;
          
          if (Math.abs(diff) > 50) { // Minimum swipe distance
            if (diff > 0) {
              handleSwipe('left');
            } else {
              handleSwipe('right');
            }
          }
        }}
      />
    </div>
  );
}

export default MobileNavigation; 