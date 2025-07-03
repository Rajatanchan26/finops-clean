import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';

function AdminPanel({ token, user, onLogout }) {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [userMsg, setUserMsg] = useState('');

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
    // Poll every 10 seconds for real-time updates
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
  }, [token, user, userMsg]);

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

  return (
    <>
      <Navbar user={user} onLogout={onLogout} />
      <div className="page-card">
        {user.role !== 'admin' ? (
          <div>Access denied. Admins only.</div>
        ) : (
          <>
            <h2>Audit Logs</h2>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User ID</th>
                    <th>Action</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td>{log.id}</td>
                      <td>{log.user_id}</td>
                      <td>{log.action}</td>
                      <td>{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h2 style={{ marginTop: '2.5rem' }}>User Management</h2>
            {userMsg && <p style={{ color: userMsg.includes('admin') ? 'green' : 'red' }}>{userMsg}</p>}
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>
                        {u.role !== 'admin' && u.id !== user.id ? (
                          <button onClick={() => makeAdmin(u.id)} style={{ padding: '0.3rem 0.8rem', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}>Make Admin</button>
                        ) : (
                          <span style={{ color: '#888' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default AdminPanel; 