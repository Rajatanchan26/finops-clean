import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';

function Transactions({ token, user, onLogout }) {
  const [transactions, setTransactions] = useState([]);

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

  return (
    <>
      <Navbar user={user} onLogout={onLogout} />
      <div className="page-card">
        <h2>Transactions</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Department</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id}>
                <td>{tx.id}</td>
                <td>{tx.department}</td>
                <td>{tx.category}</td>
                <td>{tx.amount}</td>
                <td>{new Date(tx.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Transactions; 