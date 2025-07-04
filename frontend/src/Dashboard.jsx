import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

function Dashboard({ token, user, onLogout }) {
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    const fetchSummary = async () => {
      const res = await fetch('http://localhost:5000/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        // Forbidden: log out the user
        if (onLogout) onLogout();
        return;
      }
      const data = await res.json();
      setSummary(Array.isArray(data) ? data : []);
    };
    fetchSummary();
    // Poll every 10 seconds for real-time updates
    const interval = setInterval(fetchSummary, 10000);
    return () => clearInterval(interval);
  }, [token, onLogout]);

  // Defensive: ensure summary is always an array
  const safeSummary = Array.isArray(summary) ? summary : [];

  // Prepare data for Chart.js
  const chartData = {
    labels: safeSummary.map(row => `${row.department} - ${row.category}`),
    datasets: [
      {
        label: 'Total Amount',
        data: safeSummary.map(row => row.total),
        backgroundColor: 'rgba(75,192,192,0.6)',
      },
    ],
  };

  return (
    <div className="page-card">
      <h2>Budget vs Actual Summary</h2>
      <div className="chart-container">
        <Bar data={chartData} />
      </div>
    </div>
  );
}

export default Dashboard; 