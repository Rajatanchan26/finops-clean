import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar({ user, onLogout, onProfileClick }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  return (
    <nav style={{
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <span style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          cursor: 'pointer'
        }}>
          FinOps
        </span>
        {!user.is_admin && (
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {user.grade === 'G3' && (
              <Link
                to="/finance-head"
                style={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#f8fafc';
                  e.target.style.background = 'rgba(59, 130, 246, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#94a3b8';
                  e.target.style.background = 'transparent';
                }}
              >
                Finance Head Dashboard
              </Link>
            )}
            {user.grade === 'G2' && (
              <Link
                to="/manager"
                style={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#f8fafc';
                  e.target.style.background = 'rgba(59, 130, 246, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#94a3b8';
                  e.target.style.background = 'transparent';
                }}
              >
                Manager Dashboard
              </Link>
            )}
            {user.grade === 'G1' && (
              <Link
                to="/employee"
                style={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#f8fafc';
                  e.target.style.background = 'rgba(59, 130, 246, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#94a3b8';
                  e.target.style.background = 'transparent';
                }}
              >
                Employee Dashboard
              </Link>
            )}
          </div>
        )}
        {user.is_admin && (
          <Link
            to="/admin"
            style={{
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: '500',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#f8fafc';
              e.target.style.background = 'rgba(59, 130, 246, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#94a3b8';
              e.target.style.background = 'transparent';
            }}
          >
            Admin Panel
          </Link>
        )}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {user && (
          <>
            <span style={{
              color: '#f8fafc',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              {user.name} ({user.is_admin ? 'Admin' : `Grade ${user.grade}`})
            </span>
            <button
              onClick={onProfileClick}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '2px solid rgba(59, 130, 246, 0.3)',
                background: 'rgba(59, 130, 246, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                e.target.style.background = 'rgba(59, 130, 246, 0.2)';
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                e.target.style.background = 'rgba(59, 130, 246, 0.1)';
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              {user.profile_picture_url || user.profile_picture ? (
                <img
                  src={user.profile_picture_url || user.profile_picture}
                  alt={user.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%'
                  }}
                />
              ) : (
                <span style={{
                  color: '#60a5fa',
                  fontWeight: '700',
                  fontSize: '1rem',
                  letterSpacing: '0.02em',
                  textAlign: 'center',
                  lineHeight: '1'
                }}>
                  {getInitials(user.name)}
                </span>
              )}
            </button>
          </>
        )}
        <button
          onClick={handleLogout}
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            color: '#ef4444',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(239, 68, 68, 0.2)';
            e.target.style.borderColor = 'rgba(239, 68, 68, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(239, 68, 68, 0.1)';
            e.target.style.borderColor = 'rgba(239, 68, 68, 0.2)';
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar; 