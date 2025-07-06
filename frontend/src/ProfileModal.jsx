import React, { useState } from 'react';
import { getAuth, updateProfile } from 'firebase/auth';
import { getApiBaseUrl } from './utils/api';

function ProfileModal({ user, token, setUser, onClose }) {
  const [previewUrl, setPreviewUrl] = useState(user.profile_picture_url || user.profile_picture || '');
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const handlePicChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      setMsg('');
      const formData = new FormData();
      formData.append('profile_picture', file);
      try {
        const res = await fetch(`${getApiBaseUrl()}/users/${user.id}/profile-picture/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to upload image');
        const profileRes = await fetch(`${getApiBaseUrl()}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = await profileRes.json();
        setUser(profileData);
        setPreviewUrl(profileData.profile_picture_url || profileData.profile_picture);
        setMsg('Profile picture updated!');
      } catch (err) {
        setMsg(err.message);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(4px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        borderRadius: '16px',
        padding: '2rem',
        minWidth: 350,
        maxWidth: 450,
        border: '1px solid rgba(148, 163, 184, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        backdropFilter: 'blur(10px)'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '6px',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            cursor: 'pointer',
            color: '#ef4444',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(239, 68, 68, 0.2)';
            e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(239, 68, 68, 0.1)';
            e.target.style.borderColor = 'rgba(239, 68, 68, 0.2)';
          }}
        >
          ×
        </button>
        
        <h2 style={{
          color: '#f8fafc',
          fontSize: '1.5rem',
          fontWeight: '700',
          margin: '0 0 1.5rem',
          textAlign: 'center'
        }}>
          Profile
        </h2>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            border: '2px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 6px 20px rgba(59, 130, 246, 0.3)',
            overflow: 'hidden'
          }}>
            {previewUrl ? (
              <img
                src={previewUrl}
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
                fontSize: '2rem',
                letterSpacing: '0.02em'
              }}>
                {getInitials(user.name)}
              </span>
            )}
          </div>
          
          <div style={{
            position: 'relative',
            marginBottom: '1rem',
            width: '100%'
          }}>
            <input
              type="file"
              accept="image/*"
              onChange={handlePicChange}
              disabled={uploading}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          
          {uploading && (
            <div style={{
              color: '#3b82f6',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                width: '14px',
                height: '14px',
                border: '2px solid rgba(59, 130, 246, 0.3)',
                borderTop: '2px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Uploading...
            </div>
          )}
          
          {msg && (
            <div style={{
              padding: '0.625rem 0.875rem',
              background: msg.includes('updated') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: msg.includes('updated') ? '#22c55e' : '#ef4444',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: '500'
            }}>
              {msg}
            </div>
          )}
        </div>

        {/* Profile Information */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.5)',
          borderRadius: '10px',
          padding: '1.25rem',
          border: '1px solid rgba(148, 163, 184, 0.1)'
        }}>
          <div style={{
            display: 'grid',
            gap: '0.875rem'
          }}>
            <div>
              <label style={{
                color: '#94a3b8',
                fontSize: '0.7rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.25rem',
                display: 'block'
              }}>
                Name
              </label>
              <div style={{
                color: '#f8fafc',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}>
                {user.name}
              </div>
            </div>
            
            <div>
              <label style={{
                color: '#94a3b8',
                fontSize: '0.7rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.25rem',
                display: 'block'
              }}>
                Email
              </label>
              <div style={{
                color: '#f8fafc',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}>
                {user.email}
              </div>
            </div>
            
            <div>
              <label style={{
                color: '#94a3b8',
                fontSize: '0.7rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.25rem',
                display: 'block'
              }}>
                Department
              </label>
              <div style={{
                color: '#f8fafc',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}>
                {user.department}
              </div>
            </div>
            
            <div>
              <label style={{
                color: '#94a3b8',
                fontSize: '0.7rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.25rem',
                display: 'block'
              }}>
                Grade
              </label>
              <div style={{
                color: '#f8fafc',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}>
                {user.is_admin ? 'Admin' : `Grade ${user.grade}`}
              </div>
            </div>
            
            {user.designation && (
              <div>
                <label style={{
                  color: '#94a3b8',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.25rem',
                  display: 'block'
                }}>
                  Designation
                </label>
                <div style={{
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  {user.designation}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileModal; 