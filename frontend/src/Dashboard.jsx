import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import Navbar from './Navbar';

function Dashboard({ token, user, onLogout }) {
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    const fetchSummary = async () => {
      const res = await fetch('http://localhost:5000/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSummary(data);
    };
    fetchSummary();
    // Poll every 10 seconds for real-time updates
    const interval = setInterval(fetchSummary, 10000);
    return () => clearInterval(interval);
  }, [token]);

  // Prepare data for Chart.js
  const chartData = {
    labels: summary.map(row => `${row.department} - ${row.category}`),
    datasets: [
      {
        label: 'Total Amount',
        data: summary.map(row => row.total),
        backgroundColor: 'rgba(75,192,192,0.6)',
      },
    ],
  };

  return (
    <>
      <Navbar user={user} onLogout={onLogout} />
      <div className="page-card">
        <h2>Budget vs Actual Summary</h2>
        <div className="chart-container">
          <Bar data={chartData} />
        </div>
      </div>
    </>
  );
}

export default Dashboard; 