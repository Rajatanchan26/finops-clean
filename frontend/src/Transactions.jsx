import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';

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
  }, [token, msg]);

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
    <>
      <Navbar user={user} onLogout={onLogout} />
      <div className="page-card">
        <h2>Transactions</h2>
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <input type="number" min="0" step="0.01" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} required style={{ flex: '1 1 120px' }} />
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ flex: '1 1 120px' }}>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ flex: '1 1 140px' }} />
          <input type="text" placeholder="Justification" value={justification} onChange={e => setJustification(e.target.value)} required style={{ flex: '2 1 200px' }} />
          <button type="submit" style={{ flex: '1 1 100px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '0.7rem 1.2rem', fontWeight: 600, cursor: 'pointer' }}>Submit</button>
        </form>
        {msg && <p style={{ color: msg.includes('!') ? 'green' : 'red' }}>{msg}</p>}
        <div className="table-responsive">
          <table>
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
                  <td>{tx.id}</td>
                  <td>{tx.department}</td>
                  <td>{tx.category}</td>
                  <td>{tx.amount}</td>
                  <td>{tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : ''}</td>
                  <td>{tx.justification}</td>
                  <td>{tx.status}</td>
                  {user.role === 'admin' && (
                    <td>
                      {tx.status === 'Pending' && <>
                        <button onClick={() => handleStatus(tx.id, 'Approved')} style={{ marginRight: 8, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, padding: '0.3rem 0.7rem', cursor: 'pointer' }}>Approve</button>
                        <button onClick={() => handleStatus(tx.id, 'Rejected')} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '0.3rem 0.7rem', cursor: 'pointer' }}>Reject</button>
                      </>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default Transactions; 