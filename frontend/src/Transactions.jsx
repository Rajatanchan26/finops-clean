import React, { useEffect, useState } from 'react';

const CATEGORIES = [
  'Travel',
  'Supplies',
  'Training',
  'Software',
  'Other',
];

function Transactions({ token, user, onLogout }) {
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [justification, setJustification] = useState('');
  const [date, setDate] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      const res = await fetch('http://localhost:5000/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTransactions(data);
    };
    fetchTransactions();
    // Poll every 10 seconds for real-time updates
    const interval = setInterval(fetchTransactions, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch('http://localhost:5000/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          category,
          justification,
          date,
          department: user.role === 'admin' ? '' : user.department,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit transaction');
      setMsg('Transaction submitted!');
      setAmount('');
      setCategory(CATEGORIES[0]);
      setJustification('');
      setDate('');
    } catch (err) {
      setMsg(err.message);
    }
  };

  const handleStatus = async (id, status) => {
    setMsg('');
    try {
      const res = await fetch(`http://localhost:5000/transactions/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update status');
      setMsg('Status updated!');
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      padding: '2rem',
      fontFamily: 'Inter, Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto'
      }}>
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: 'white'
            }}>
              💳
            </div>
            <h2 style={{
              color: '#f1f5f9',
              fontSize: '1.75rem',
              fontWeight: '700',
              margin: 0
            }}>
              Transactions
            </h2>
          </div>

          <form onSubmit={handleSubmit} style={{
            marginBottom: '2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            alignItems: 'end'
          }}>
            <div>
              <label style={{
                display: 'block',
                color: '#94a3b8',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem'
              }}>
                Amount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '12px',
                  color: '#f1f5f9',
                  fontSize: '1rem',
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

            <div>
              <label style={{
                display: 'block',
                color: '#94a3b8',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem'
              }}>
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '12px',
                  color: '#f1f5f9',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} style={{ background: '#1e293b', color: '#f1f5f9' }}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                color: '#94a3b8',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem'
              }}>
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '12px',
                  color: '#f1f5f9',
                  fontSize: '1rem',
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

            <div>
              <label style={{
                display: 'block',
                color: '#94a3b8',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '0.5rem'
              }}>
                Justification
              </label>
              <input
                type="text"
                placeholder="Enter justification"
                value={justification}
                onChange={e => setJustification(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '12px',
                  color: '#f1f5f9',
                  fontSize: '1rem',
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

            <button
              type="submit"
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
              }}
            >
              Submit Transaction
            </button>
          </form>

          {msg && (
            <div style={{
              padding: '1rem',
              background: msg.includes('!') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${msg.includes('!') ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              borderRadius: '8px',
              color: msg.includes('!') ? '#22c55e' : '#ef4444',
              fontSize: '0.875rem',
              marginBottom: '1.5rem'
            }}>
              {msg}
            </div>
          )}
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Department</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Justification</th>
                <th>Status</th>
                {user.role === 'admin' && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id}>
                  <td style={{ fontWeight: '600', color: '#3b82f6' }}>#{tx.id}</td>
                  <td>{tx.department}</td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#60a5fa',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {tx.category}
                    </span>
                  </td>
                  <td style={{ fontWeight: '600', color: '#f1f5f9' }}>
                    ${parseFloat(tx.amount).toFixed(2)}
                  </td>
                  <td>{tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : ''}</td>
                  <td style={{ maxWidth: '200px', wordBreak: 'break-word' }}>{tx.justification}</td>
                  <td>
                    <span className={`status-badge ${tx.status.toLowerCase()}`}>
                      {tx.status}
                    </span>
                  </td>
                  {user.role === 'admin' && (
                    <td>
                      {tx.status === 'Pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleStatus(tx.id, 'Approved')}
                            style={{
                              background: 'rgba(34, 197, 94, 0.1)',
                              border: '1px solid rgba(34, 197, 94, 0.2)',
                              color: '#22c55e',
                              borderRadius: '6px',
                              padding: '0.5rem 1rem',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'rgba(34, 197, 94, 0.2)';
                              e.target.style.borderColor = 'rgba(34, 197, 94, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'rgba(34, 197, 94, 0.1)';
                              e.target.style.borderColor = 'rgba(34, 197, 94, 0.2)';
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatus(tx.id, 'Rejected')}
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              color: '#ef4444',
                              borderRadius: '6px',
                              padding: '0.5rem 1rem',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              cursor: 'pointer',
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
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Transactions; 