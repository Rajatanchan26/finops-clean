import React, { useEffect, useState } from 'react';

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
  });
  const [createMsg, setCreateMsg] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);

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
  }, [token, user, userMsg, createMsg]);

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
      setNewUser({ name: '', email: '', password: '', department: DEPARTMENTS[0], role: ROLES[0] });
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
          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '2rem', background: '#f8fafc', borderRadius: 12, padding: '1.2rem 1rem', boxShadow: '0 1px 6px rgba(0,0,0,0.03)' }}>
            <input type="text" placeholder="Name" value={newUser.name} onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))} required style={{ flex: '1 1 120px', fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.5rem 0.9rem', background: '#fff' }} />
            <input type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} required style={{ flex: '1 1 180px', fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.5rem 0.9rem', background: '#fff' }} />
            <input type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} required style={{ flex: '1 1 120px', fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.5rem 0.9rem', background: '#fff' }} />
            <select value={newUser.department} onChange={e => setNewUser(u => ({ ...u, department: e.target.value }))} style={{ flex: '1 1 140px', fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.5rem 0.9rem', background: '#fff' }}>
              {DEPARTMENTS.map(dep => <option key={dep} value={dep}>{dep}</option>)}
            </select>
            <select value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))} style={{ flex: '1 1 100px', fontSize: 15, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.5rem 0.9rem', background: '#fff' }}>
              {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
            </select>
            <button type="submit" style={{ flex: '1 1 100px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '0.7rem 1.2rem', fontWeight: 600, cursor: 'pointer', fontSize: 15, boxShadow: '0 1px 4px rgba(37,99,235,0.07)' }}>Add User</button>
          </form>
          {createMsg && <p style={{ color: createMsg.includes('success') ? '#059669' : '#b91c1c', fontWeight: 500 }}>{createMsg}</p>}
          {userMsg && <p style={{ color: userMsg.includes('admin') ? '#059669' : '#b91c1c', fontWeight: 500 }}>{userMsg}</p>}
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '1.5rem', marginBottom: '2.5rem' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                    <th style={{ padding: '0.7rem 1rem', textAlign: 'left' }}>ID</th>
                    <th style={{ padding: '0.7rem 1rem', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '0.7rem 1rem', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '0.7rem 1rem', textAlign: 'left' }}>Role</th>
                    <th style={{ padding: '0.7rem 1rem', textAlign: 'left' }}>Department</th>
                    <th style={{ padding: '0.7rem 1rem', textAlign: 'left' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                      <td style={{ padding: '0.6rem 1rem' }}>{u.id}</td>
                      <td style={{ padding: '0.6rem 1rem' }}>{u.name}</td>
                      <td style={{ padding: '0.6rem 1rem' }}>{u.email}</td>
                      <td style={{ padding: '0.6rem 1rem' }}>{u.role}</td>
                      <td style={{ padding: '0.6rem 1rem' }}>{u.department}</td>
                      <td style={{ padding: '0.6rem 1rem' }}>
                        {u.role !== 'admin' && u.id !== user.id ? (
                          <button onClick={() => makeAdmin(u.id)} style={{ padding: '0.3rem 0.8rem', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Make Admin</button>
                        ) : (
                          <span style={{ color: '#888' }}>-</span>
                        )}
                      </td>
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