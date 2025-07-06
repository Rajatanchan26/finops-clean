import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../utils/api';

function CommissionDashboard({ scope = 'self', user, token }) {
  const [commissionData, setCommissionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [timeRange, setTimeRange] = useState('6months'); // 3months, 6months, 1year
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchCommissionData();
  }, [scope, timeRange]);

  const fetchCommissionData = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/commission?scope=${scope}&range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCommissionData(data);
      } else {
        setMessage('Error fetching commission data');
      }
    } catch (error) {
      setMessage('Error fetching commission data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/export/commission?format=${format}&scope=${scope}&range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `commission_${scope}_${timeRange}_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setMessage(`Commission data exported successfully as ${format.toUpperCase()}`);
      } else {
        setMessage('Error exporting commission data');
      }
    } catch (error) {
      setMessage('Error exporting commission data');
    } finally {
      setExporting(false);
    }
  };

  const getScopeTitle = () => {
    switch (scope) {
      case 'self': return 'Personal Commission Overview';
      case 'team': return 'Department Commission Overview';
      case 'all': return 'Commission Summary';
      default: return 'Commission Overview';
    }
  };

  if (loading) {
    return <div className="loading">Loading commission data...</div>;
  }

  if (!commissionData) {
    return (
      <div className="card">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1.5rem' 
        }}>
          <h3 style={{ color: '#f8fafc', margin: 0 }}>{getScopeTitle()}</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="form-select"
              style={{ minWidth: '150px' }}
            >
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
            </select>
            {/* Export Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="btn btn-outline"
                style={{ 
                  fontSize: '0.875rem',
                  padding: '0.5rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  color: '#22c55e'
                }}
              >
                📊 CSV
              </button>
            </div>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              background: 'rgba(34, 197, 94, 0.1)',
              color: '#22c55e',
              border: '1px solid rgba(34, 197, 94, 0.2)'
            }}>
              💸
            </div>
          </div>
        </div>
        <div className="message info">No commission data available</div>
      </div>
    );
  }

  const { totalRevenue, totalCommission, avgCommissionRate, topPerformers, monthlyData } = commissionData;

  return (
    <div className="card">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem' 
      }}>
        <h3 style={{ color: '#f8fafc', margin: 0 }}>{getScopeTitle()}</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="form-select"
            style={{ minWidth: '150px' }}
          >
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
          {/* Export Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="btn btn-outline"
              style={{ 
                fontSize: '0.875rem',
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                color: '#22c55e'
              }}
            >
              📊 CSV
            </button>
          </div>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            background: 'rgba(34, 197, 94, 0.1)',
            color: '#22c55e',
            border: '1px solid rgba(34, 197, 94, 0.2)'
          }}>
            💸
          </div>
        </div>
      </div>
      
      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Commission Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '2rem' 
      }}>
        <div style={{ 
          textAlign: 'center', 
          padding: '1rem', 
          background: 'rgba(15, 23, 42, 0.4)', 
          borderRadius: '12px', 
          border: '1px solid rgba(148, 163, 184, 0.1)' 
        }}>
          <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Revenue
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.25rem' }}>
            ${totalRevenue?.toLocaleString() || 0}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: '500' }}>
            +12.5% from last month
          </div>
        </div>
        
        <div style={{ 
          textAlign: 'center', 
          padding: '1rem', 
          background: 'rgba(15, 23, 42, 0.4)', 
          borderRadius: '12px', 
          border: '1px solid rgba(148, 163, 184, 0.1)' 
        }}>
          <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Commission
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.25rem' }}>
            ${totalCommission?.toLocaleString() || 0}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: '500' }}>
            +8.3% from last month
          </div>
        </div>
        
        <div style={{ 
          textAlign: 'center', 
          padding: '1rem', 
          background: 'rgba(15, 23, 42, 0.4)', 
          borderRadius: '12px', 
          border: '1px solid rgba(148, 163, 184, 0.1)' 
        }}>
          <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Avg Commission Rate
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.25rem' }}>
            {(avgCommissionRate || 0).toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: '500' }}>
            Industry average: 5.2%
          </div>
        </div>
      </div>

      {/* Commission Chart */}
      {monthlyData && monthlyData.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ color: '#f8fafc', marginBottom: '1rem' }}>Revenue vs Commission Over Time</h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${monthlyData.length}, 1fr)`, 
            gap: '1rem', 
            alignItems: 'end',
            height: '200px',
            padding: '1rem',
            background: 'rgba(15, 23, 42, 0.4)',
            borderRadius: '12px',
            border: '1px solid rgba(148, 163, 184, 0.1)'
          }}>
            {monthlyData.map((month, index) => {
              const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));
              const maxCommission = Math.max(...monthlyData.map(d => d.commission));
              
              // Use separate scales for revenue and commission
              const revenueHeight = maxRevenue > 0 ? (month.revenue / maxRevenue) * 80 : 0; // Revenue uses 80% of height
              const commissionHeight = maxCommission > 0 ? (month.commission / maxCommission) * 60 : 0; // Commission uses 60% of height
              
              return (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ 
                    width: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '2px',
                    height: '100%',
                    justifyContent: 'flex-end'
                  }}>
                    <div 
                      style={{ 
                        height: `${revenueHeight}%`,
                        background: 'linear-gradient(180deg, #60a5fa, #3b82f6)',
                        borderRadius: '4px 4px 0 0',
                        minHeight: '4px'
                      }}
                      title={`Revenue: $${month.revenue.toLocaleString()}`}
                    ></div>
                    <div 
                      style={{ 
                        height: `${commissionHeight}%`,
                        background: 'linear-gradient(180deg, #10b981, #059669)',
                        borderRadius: '0 0 4px 4px',
                        minHeight: '4px'
                      }}
                      title={`Commission: $${month.commission.toLocaleString()}`}
                    ></div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                    {month.month}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', background: '#60a5fa', borderRadius: '2px' }}></div>
              <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Revenue</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px' }}></div>
              <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Commission</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Performers */}
      {scope === 'all' && topPerformers && topPerformers.length > 0 && (
        <div>
          <h4 style={{ color: '#f8fafc', marginBottom: '1rem' }}>Top Performers</h4>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Commission</th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.map((performer, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: '600', color: '#60a5fa' }}>#{index + 1}</td>
                    <td>{performer.name}</td>
                    <td style={{ fontWeight: '600', color: '#10b981' }}>
                      ${performer.commission?.toLocaleString() || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {exporting && (
        <div style={{ 
          textAlign: 'center', 
          padding: '1rem', 
          color: '#94a3b8',
          fontSize: '0.875rem'
        }}>
          Exporting commission data... Please wait.
        </div>
      )}
    </div>
  );
}

export default CommissionDashboard; 