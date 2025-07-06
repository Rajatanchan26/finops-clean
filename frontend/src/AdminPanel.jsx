import React, { useEffect, useState } from 'react';
import { FaEdit, FaTrash, FaUserShield, FaDownload, FaPlus } from 'react-icons/fa';
import DashboardLayout from './components/DashboardLayout';

const DEPARTMENTS = [
  'Finance',
  'HR',
  'Digital Transformation',
  'Planning',
  'Data&AI',
];

function AdminPanel({ token, user, onLogout, onProfileClick }) {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [userMsg, setUserMsg] = useState('');
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    department: DEPARTMENTS[0],
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
  const [refreshing, setRefreshing] = useState(false);

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
    if (!user.is_admin) return;
    fetchUsers();
  }, [token, user]);

    const fetchUsers = async () => {
    setRefreshing(true);
      const res = await fetch('http://localhost:5000/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data);
    setRefreshing(false);
    };

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
    setRefreshing(true);
    try {
      const userData = {
        ...newUser,
        is_admin: false,
        grade: newUser.employee_grade || '1'
      };
      delete userData.role;
      delete userData.employee_grade;
      const res = await fetch('http://localhost:5000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create user');
      setCreateMsg('User created successfully!');
      setNewUser({ name: '', email: '', password: '', department: DEPARTMENTS[0], employee_grade: '', designation: '' });
      await fetchUsers();
      setShowAddModal(false);
    } catch (err) {
      setCreateMsg(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportMsg('');
    setImportResult(null);
    setImporting(true);
    setRefreshing(true);
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
          errorMsg = await res.text();
        }
        throw new Error(errorMsg);
      }
      const data = await res.json();
      setImportMsg('Import completed!');
      setImportResult(data);
      await fetchUsers();
    } catch (err) {
      setImportMsg(err.message);
    } finally {
      setImporting(false);
      setRefreshing(false);
    }
  };

  // CSV template content
  const csvTemplate = `name,email,password,department,employee_grade,designation\nJohn Doe,john@example.com,Password123,Finance,1,Analyst\nJane Smith,jane@example.com,Password456,HR,2,Manager\n`;

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
      // Transform role to is_admin for backend compatibility
      const userData = {
        ...editUserData,
        is_admin: editUserData.is_admin || false // Preserve existing admin status
      };
      delete userData.role; // Remove role field as backend expects is_admin
      
      const res = await fetch(`http://localhost:5000/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update user');
      setUserMsg('User updated successfully!');
      // Refresh user list
      await fetchUsers();
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
      await fetchUsers();
    } catch (err) {
      setUserMsg(err.message);
    }
  };

  return (
    <DashboardLayout
      title="Admin Panel"
      user={user}
      onLogout={onLogout}
      onProfileClick={onProfileClick}
    >
        {!user.is_admin ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: 'rgba(15, 23, 42, 0.8)',
          borderRadius: '20px',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            color: '#ef4444',
            fontSize: '1.25rem',
            fontWeight: '500'
          }}>
            Access denied. Admins only.
          </div>
          </div>
        ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Audit Logs Section */}
          <div className="card">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                color: 'white'
              }}>
                📋
              </div>
              <h2 style={{
                color: '#f8fafc',
                fontSize: '1.5rem',
                fontWeight: '700',
                margin: 0
              }}>
                Audit Logs
              </h2>
            </div>
            <div className="table-container">
              <table className="table">
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
                      <td style={{ fontWeight: '600', color: '#3b82f6' }}>#{log.id}</td>
                      <td>{log.user_id}</td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#60a5fa',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ color: '#94a3b8' }}>{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* User Management Section */}
          <div className="card">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                color: 'white'
              }}>
                👥
              </div>
              <h2 style={{
                color: '#f8fafc',
                fontSize: '1.5rem',
                fontWeight: '700',
                margin: 0
              }}>
                User Management
              </h2>
              </div>
              
              {/* Import Section */}
            <div style={{
              padding: '1.5rem',
              background: 'rgba(30, 41, 59, 0.5)',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              border: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    <label style={{
                      color: '#94a3b8',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      minWidth: '100px'
                    }}>
                      Import Users:
                    </label>
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleImportCSV} 
                      disabled={importing}
                      style={{
                        flex: 1,
                        padding: '0.75rem 1rem',
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  <button 
                    onClick={handleDownloadTemplate}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '12px',
                        color: '#3b82f6',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                  >
                      <FaDownload style={{ marginRight: '0.5rem' }} />
                    Download Template
                  </button>
                </div>
                {importMsg && (
                    <div style={{
                      padding: '0.75rem 1rem',
                      background: importMsg.includes('completed') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: importMsg.includes('completed') ? '#22c55e' : '#ef4444',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                    {importMsg}
                  </div>
                )}
                  {importing && (
                    <div style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#60a5fa',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      Importing users... Please wait.
                    </div>
                    )}
                  </div>
              </div>
              </div>

            {/* Create User Section */}
            <div style={{
              padding: '1.5rem',
              background: 'rgba(30, 41, 59, 0.5)',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              border: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <button 
                  onClick={() => setShowAddModal(true)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <FaPlus />
                  Add New User
                </button>
                <button
                  onClick={fetchUsers}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                  disabled={refreshing}
                >
                  <FaDownload />
                  Refresh
                </button>
                {refreshing && (
                  <span style={{ color: '#3b82f6', fontWeight: '500' }}>Refreshing...</span>
                )}
              </div>
              {createMsg && (
                <div style={{
                  padding: '0.75rem 1rem',
                  background: createMsg.includes('successfully') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: createMsg.includes('successfully') ? '#22c55e' : '#ef4444',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  {createMsg}
                </div>
              )}
              </div>

              {/* Users Table */}
            <div className="table-container">
              <table className="table">
                <thead>
                    <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Grade</th>
                    <th>Designation</th>
                    <th>Role</th>
                    <th>Actions</th>
                    </tr>
                  </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td style={{ fontWeight: '600', color: '#3b82f6' }}>#{user.id}</td>
                      <td style={{ color: '#f8fafc', fontWeight: '500' }}>{user.name}</td>
                      <td style={{ color: '#94a3b8' }}>{user.email}</td>
                      <td style={{ color: '#f8fafc' }}>{user.department}</td>
                      <td style={{ color: '#f8fafc' }}>G{user.grade}</td>
                      <td style={{ color: '#f8fafc' }}>{user.designation}</td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: user.is_admin ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                          color: user.is_admin ? '#ef4444' : '#22c55e',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {user.is_admin ? 'Admin' : 'User'}
                        </span>
                            </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button 
                            onClick={() => {
                              setEditUserId(user.id);
                              setEditUserData(user);
                            }}
                            style={{
                              padding: '0.5rem',
                              background: 'rgba(59, 130, 246, 0.1)',
                              border: '1px solid rgba(59, 130, 246, 0.2)',
                              borderRadius: '8px',
                              color: '#3b82f6',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <FaEdit />
                                </button>
                                <button 
                            onClick={() => handleDeleteUser(user.id)}
                            style={{
                              padding: '0.5rem',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              borderRadius: '8px',
                              color: '#ef4444',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <FaTrash />
                                </button>
                              </div>
                            </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Add User</h3>
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Name" 
                    value={newUser.name} 
                    onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))} 
                    required 
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <input 
                    type="email" 
                    placeholder="Email" 
                    value={newUser.email} 
                    onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} 
                    required 
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <input 
                    type="password" 
                    placeholder="Password" 
                    value={newUser.password} 
                    onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} 
                    required 
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <select 
                    value={newUser.department} 
                    onChange={e => setNewUser(u => ({ ...u, department: e.target.value }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {DEPARTMENTS.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                  </select>
                  <input 
                    type="text" 
                    placeholder="Employee Grade" 
                    value={newUser.employee_grade} 
                    onChange={e => setNewUser(u => ({ ...u, employee_grade: e.target.value }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <input 
                    type="text" 
                    placeholder="Designation" 
                    value={newUser.designation} 
                    onChange={e => setNewUser(u => ({ ...u, designation: e.target.value }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <button 
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add User
                  </button>
                </form>
                {createMsg && (
                  <div className={`mt-3 text-sm ${createMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                    {createMsg}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </DashboardLayout>
  );
}

export default AdminPanel; 