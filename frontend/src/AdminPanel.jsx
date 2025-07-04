import React, { useEffect, useState } from 'react';
import { FaEdit, FaTrash, FaUserShield } from 'react-icons/fa';

const DEPARTMENTS = [
  'Finance',
  'HR',
  'Digital Transformation',
  'Planning',
  'Data&AI',
];
const ROLES = ['user', 'admin'];

function AdminPanel({ token, user, onLogout }) {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [userMsg, setUserMsg] = useState('');
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    department: DEPARTMENTS[0],
    role: ROLES[0],
    employee_grade: '',
    designation: '',
  });
  const [createMsg, setCreateMsg] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [editUserData, setEditUserData] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch audit logs
  useEffect(() => {
    if (user.role !== 'admin') return;
    const fetchLogs = async () => {
      const res = await fetch('http://localhost:5000/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLogs(data);
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [token, user]);

  // Fetch users
  useEffect(() => {
    if (user.role !== 'admin') return;
    const fetchUsers = async () => {
      const res = await fetch('http://localhost:5000/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data);
    };
    fetchUsers();
  }, [token, user]);

  const makeAdmin = async (id) => {
    setUserMsg('');
    try {
      const res = await fetch(`http://localhost:5000/users/${id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: 'admin' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update role');
      setUserMsg('User promoted to admin!');
    } catch (err) {
      setUserMsg(err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateMsg('');
    try {
      const res = await fetch('http://localhost:5000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create user');
      setCreateMsg('User created successfully!');
      setNewUser({ name: '', email: '', password: '', department: DEPARTMENTS[0], role: ROLES[0], employee_grade: '', designation: '' });
    } catch (err) {
      setCreateMsg(err.message);
    }
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportMsg('');
    setImportResult(null);
    setImporting(true);
    const formData = new FormData();
    formData.append('csv', file);
    try {
      const res = await fetch('http://localhost:5000/users/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const contentType = res.headers.get('content-type');
      if (!res.ok) {
        let errorMsg = 'Unknown error';
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          errorMsg = data.message || errorMsg;
        } else {
          errorMsg = await res.text(); // This will be the HTML error page
        }
        throw new Error(errorMsg);
      }
      const data = await res.json();
      setImportMsg('Import completed!');
      setImportResult(data);
      // Refresh user list
      const usersRes = await fetch('http://localhost:5000/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(await usersRes.json());
    } catch (err) {
      setImportMsg(err.message);
    } finally {
      setImporting(false);
    }
  };

  // CSV template content
  const csvTemplate = `name,email,password,department,role\nJohn Doe,john@example.com,Password123,Finance,user\nJane Admin,jane@example.com,AdminPass456,HR,admin\n`;

  const handleDownloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveUser = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editUserData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update user');
      setUserMsg('User updated successfully!');
      // Refresh user list
      const usersRes = await fetch('http://localhost:5000/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(await usersRes.json());
      setEditUserId(null);
    } catch (err) {
      setUserMsg(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`http://localhost:5000/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete user');
      setUserMsg('User deleted successfully!');
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      setUserMsg(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '2rem auto', padding: '2rem', background: '#f8fafc', borderRadius: 18, boxShadow: '0 4px 32px rgba(0,0,0,0.07)', fontFamily: 'Inter, Arial, sans-serif' }}>
      {user.role !== 'admin' ? (
        <div style={{ color: '#b91c1c', fontWeight: 600, fontSize: 20, textAlign: 'center', padding: '2rem' }}>Access denied. Admins only.</div>
      ) : (
        <>
          <h2 style={{ marginTop: 0, fontSize: 32, fontWeight: 700, letterSpacing: -1, color: '#22223b' }}>Audit Logs</h2>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '1.5rem', marginBottom: '2.5rem' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                    <th style={{ padding: '0.7rem 1rem', textAlign: 'left' }}>ID</th>
                    <th style={{ padding: '0.7rem 1rem', textAlign: 'left' }}>User ID</th>
                    <th style={{ padding: '0.7rem 1rem', textAlign: 'left' }}>Action</th>
                    <th style={{ padding: '0.7rem 1rem', textAlign: 'left' }}>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                      <td style={{ padding: '0.6rem 1rem' }}>{log.id}</td>
                      <td style={{ padding: '0.6rem 1rem' }}>{log.user_id}</td>
                      <td style={{ padding: '0.6rem 1rem' }}>{log.action}</td>
                      <td style={{ padding: '0.6rem 1rem' }}>{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <h2 style={{ marginTop: '2.5rem', fontSize: 28, fontWeight: 700, letterSpacing: -0.5, color: '#22223b' }}>User Management</h2>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '1.5rem', marginBottom: '2.5rem' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 16 }}>
              <label style={{ fontWeight: 600, fontSize: 16 }}>Import Users from CSV:</label>
              <input type="file" accept=".csv" onChange={handleImportCSV} disabled={importing} style={{ marginLeft: 0, fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.3rem 0.7rem', background: '#f8fafc' }} />
              <button type="button" onClick={handleDownloadTemplate} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '0.4rem 1.1rem', fontWeight: 600, cursor: 'pointer', fontSize: 15, boxShadow: '0 1px 4px rgba(37,99,235,0.07)' }}>Download Template</button>
              {importing && <span style={{ color: '#2563eb', fontWeight: 500 }}>Importing...</span>}
            </div>
            {importMsg && <p style={{ color: importMsg.includes('completed') ? '#059669' : '#b91c1c', margin: 0, fontWeight: 500 }}>{importMsg}</p>}
            {importResult && (
              <div style={{ marginTop: 8, fontSize: 15 }}>
                <b>Imported:</b> {importResult.imported.length}<br />
                <b>Errors:</b> {importResult.errors.length}
                {importResult.errors.length > 0 && (
                  <ul style={{ color: '#b91c1c', marginTop: 4, paddingLeft: 18 }}>
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err.email}: {err.error}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button onClick={() => setShowAddModal(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '0.6rem 1.4rem', fontWeight: 600, fontSize: 15, boxShadow: '0 1px 4px rgba(37,99,235,0.07)', cursor: 'pointer' }}>Add User</button>
          </div>
          {showAddModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 32px rgba(0,0,0,0.10)', padding: '2rem 2.5rem', minWidth: 340, maxWidth: 400, width: '100%', position: 'relative' }}>
                <button onClick={() => setShowAddModal(false)} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }}>&times;</button>
                <h3 style={{ margin: 0, marginBottom: 18, fontWeight: 700, fontSize: 22, color: '#22223b' }}>Add User</h3>
                <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <input type="text" placeholder="Name" value={newUser.name} onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))} required style={{ fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.6rem 1rem', background: '#fff' }} />
                  <input type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} required style={{ fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.6rem 1rem', background: '#fff' }} />
                  <input type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} required style={{ fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.6rem 1rem', background: '#fff' }} />
                  <select value={newUser.department} onChange={e => setNewUser(u => ({ ...u, department: e.target.value }))} style={{ fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.6rem 1rem', background: '#fff' }}>
                    {DEPARTMENTS.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                  </select>
                  <select value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))} style={{ fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.6rem 1rem', background: '#fff' }}>
                    {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                  <input type="text" placeholder="Employee Grade" value={newUser.employee_grade} onChange={e => setNewUser(u => ({ ...u, employee_grade: e.target.value }))} style={{ fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.6rem 1rem', background: '#fff' }} />
                  <input type="text" placeholder="Designation" value={newUser.designation} onChange={e => setNewUser(u => ({ ...u, designation: e.target.value }))} style={{ fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.6rem 1rem', background: '#fff' }} />
                  <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '0.7rem 1.2rem', fontWeight: 600, cursor: 'pointer', fontSize: 15, boxShadow: '0 1px 4px rgba(37,99,235,0.07)' }}>Add User</button>
                </form>
                {createMsg && <p style={{ color: createMsg.includes('success') ? '#059669' : '#b91c1c', fontWeight: 500, marginTop: 10 }}>{createMsg}</p>}
              </div>
            </div>
          )}
          {userMsg && <p style={{ color: userMsg.includes('admin') ? '#059669' : '#b91c1c', fontWeight: 500 }}>{userMsg}</p>}
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '1.5rem', marginBottom: '2.5rem', maxWidth: 1100, marginLeft: 'auto', marginRight: 'auto' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 900, borderCollapse: 'separate', borderSpacing: 0, fontSize: 15 }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                  <tr style={{ color: '#22223b', fontWeight: 700, borderBottom: '1.5px solid #e5e7eb' }}>
                    <th style={{ padding: '0.7rem 1rem', textAlign: 'left', background: '#f8fafc' }}>ID</th>
                    <th style={{ padding: '0.7rem 1rem', textAlign: 'left', background: '#f8fafc' }}>Name</th>
                    <th style={{ padding: '0.7rem 1rem', textAlign: 'left', background: '#f8fafc' }}>Email</th>
                    <th style={{ padding: '0.7rem 1rem', textAlign: 'left', background: '#f8fafc' }}>Role</th>
                    <th style={{ padding: '0.7rem 1rem', textAlign: 'left', background: '#f8fafc' }}>Department</th>
                    <th style={{ padding: '0.7rem 1rem', textAlign: 'left', background: '#f8fafc' }}>Grade</th>
                    <th style={{ padding: '0.7rem 1rem', textAlign: 'left', background: '#f8fafc' }}>Designation</th>
                    <th style={{ padding: '0.7rem 1rem', textAlign: 'center', background: '#f8fafc' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', background: editUserId === u.id ? '#f1f5f9' : '#fff', transition: 'background 0.2s' }}>
                      <td style={{ padding: '0.6rem 1rem' }}>{u.id}</td>
                      {editUserId === u.id ? (
                        <>
                          <td style={{ padding: '0.6rem 1rem' }}><input value={editUserData.name} onChange={e => setEditUserData(d => ({ ...d, name: e.target.value }))} style={{ width: '100%', borderRadius: 6, border: '1px solid #e5e7eb', padding: '0.4rem 0.7rem', background: '#f8fafb' }} /></td>
                          <td style={{ padding: '0.6rem 1rem' }}><input value={editUserData.email} onChange={e => setEditUserData(d => ({ ...d, email: e.target.value }))} style={{ width: '100%', borderRadius: 6, border: '1px solid #e5e7eb', padding: '0.4rem 0.7rem', background: '#f9fafb' }} /></td>
                          <td style={{ padding: '0.6rem 1rem' }}>
                            <select value={editUserData.role} onChange={e => setEditUserData(d => ({ ...d, role: e.target.value }))} style={{ width: '100%', borderRadius: 6, border: '1px solid #e5e7eb', padding: '0.4rem 0.7rem', background: '#f9fafb' }}>
                              {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: '0.6rem 1rem' }}>
                            <select value={editUserData.department} onChange={e => setEditUserData(d => ({ ...d, department: e.target.value }))} style={{ width: '100%', borderRadius: 6, border: '1px solid #e5e7eb', padding: '0.4rem 0.7rem', background: '#f9fafb' }}>
                              {DEPARTMENTS.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: '0.6rem 1rem' }}><input value={editUserData.employee_grade || ''} onChange={e => setEditUserData(d => ({ ...d, employee_grade: e.target.value }))} style={{ width: '100%', borderRadius: 6, border: '1px solid #e5e7eb', padding: '0.4rem 0.7rem', background: '#f9fafb' }} /></td>
                          <td style={{ padding: '0.6rem 1rem' }}><input value={editUserData.designation || ''} onChange={e => setEditUserData(d => ({ ...d, designation: e.target.value }))} style={{ width: '100%', borderRadius: 6, border: '1px solid #e5e7eb', padding: '0.4rem 0.7rem', background: '#f9fafb' }} /></td>
                          <td style={{ padding: '0.6rem 1rem', display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button onClick={() => handleSaveUser(u.id)} title="Save" style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 0.7rem', cursor: 'pointer', fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✔</button>
                            <button onClick={() => setEditUserId(null)} title="Cancel" style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 0.7rem', cursor: 'pointer', fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✖</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '0.6rem 1rem' }}>{u.name}</td>
                          <td style={{ padding: '0.6rem 1rem' }}>{u.email}</td>
                          <td style={{ padding: '0.6rem 1rem' }}>{u.role}</td>
                          <td style={{ padding: '0.6rem 1rem' }}>{u.department}</td>
                          <td style={{ padding: '0.6rem 1rem' }}>{u.employee_grade || '-'}</td>
                          <td style={{ padding: '0.6rem 1rem' }}>{u.designation || '-'}</td>
                          <td style={{ padding: '0.6rem 1rem', display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button onClick={() => { setEditUserId(u.id); setEditUserData(u); }} title="Edit" style={{ background: 'none', color: '#2563eb', border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaEdit /></button>
                            {u.role !== 'admin' && u.id !== user.id ? (
                              <button onClick={() => makeAdmin(u.id)} title="Make Admin" style={{ background: 'none', color: '#6366f1', border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaUserShield /></button>
                            ) : (
                              <span style={{ color: '#bbb', fontSize: 18, fontWeight: 500, minWidth: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</span>
                            )}
                            {u.id !== user.id && (
                              <button onClick={() => handleDeleteUser(u.id)} title="Delete" style={{ background: 'none', color: '#ef4444', border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaTrash /></button>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminPanel; 