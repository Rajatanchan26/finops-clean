import React, { useState } from 'react';

function ProfileModal({ user, token, setUser, onClose }) {
  const [previewUrl, setPreviewUrl] = useState(user.profile_picture_url || '');
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  const handlePicChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      setMsg('');
      const formData = new FormData();
      formData.append('profile_picture', file);
      try {
        const res = await fetch(`http://localhost:5000/users/${user.id}/profile-picture/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to upload image');
        const profileRes = await fetch(`http://localhost:5000/users/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = await profileRes.json();
        setUser(profileData);
        setPreviewUrl(profileData.profile_picture_url);
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
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', minWidth: 320, maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>&times;</button>
        <h2 style={{ marginTop: 0 }}>Profile</h2>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#e0e7ff', overflow: 'hidden', border: '2px solid #2563eb', marginBottom: 10 }}>
            {previewUrl ? (
              <img src={previewUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#2563eb', fontWeight: 700, fontSize: 36 }}>
                {user.name ? user.name[0].toUpperCase() : '?'}
              </span>
            )}
          </div>
          <input type="file" accept="image/*" onChange={handlePicChange} style={{ marginBottom: 8 }} disabled={uploading} />
          {uploading && <p style={{ color: '#2563eb', marginTop: 8 }}>Uploading...</p>}
          {msg && <p style={{ color: msg.includes('updated') ? 'green' : 'red', marginTop: 8 }}>{msg}</p>}
        </div>
        <div style={{ marginTop: 10 }}>
          <div><b>Name:</b> {user.name}</div>
          <div><b>Email:</b> {user.email}</div>
          <div><b>Department:</b> {user.department}</div>
          <div><b>Role:</b> {user.role}</div>
        </div>
      </div>
    </div>
  );
}

export default ProfileModal; 