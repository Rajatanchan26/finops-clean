import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../utils/api';

function BudgetOverview({ scope = 'self', user, token }) {
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchBudgetData();
  }, [scope]);

  const fetchBudgetData = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/budget?scope=${scope}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBudgetData(data);
      } else {
        setMessage('Error fetching budget data');
      }
    } catch (error) {
      setMessage('Error fetching budget data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/export/budget/${format}?scope=${scope}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `budget_${scope}_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setMessage(`Budget data exported successfully as ${format.toUpperCase()}`);
      } else {
        setMessage('Error exporting budget data');
      }
    } catch (error) {
      setMessage('Error exporting budget data');
    } finally {
      setExporting(false);
    }
  };

  const getScopeTitle = () => {
    switch (scope) {
      case 'self': return 'Team Budget Overview';
      case 'department': return 'Department Budget Overview';
      case 'all': return 'Enterprise Budget Overview';
      default: return 'Budget Overview';
    }
  };

  if (loading) {
    return <div className="loading">Loading budget data...</div>;
  }

  if (!budgetData) {
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
              💰
            </div>
          </div>
        </div>
        <div className="message info">No budget data available</div>
      </div>
    );
  }

  const { budget, spent, remaining } = budgetData;
  const spentPercentage = budget > 0 ? (spent / budget) * 100 : 0;
  const remainingPercentage = 100 - spentPercentage;

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
            💰
          </div>
        </div>
      </div>
      
      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

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
            Total Budget
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.25rem' }}>
            ${budget?.toLocaleString() || 0}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: '500' }}>
            +2.5% from last month
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
            Spent
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.25rem' }}>
            ${spent?.toLocaleString() || 0}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: '500' }}>
            +8.1% from last month
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
            Remaining
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.25rem' }}>
            ${remaining?.toLocaleString() || 0}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#ef4444', fontWeight: '500' }}>
            -3.2% from last month
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ color: '#f8fafc', marginBottom: '1rem' }}>Budget Utilization</h4>
        <div style={{ 
          padding: '1.5rem',
          background: 'rgba(15, 23, 42, 0.4)',
          borderRadius: '12px',
          border: '1px solid rgba(148, 163, 184, 0.1)'
        }}>
          <div style={{ 
            width: '100%', 
            height: '12px', 
            background: 'rgba(148, 163, 184, 0.2)', 
            borderRadius: '6px',
            overflow: 'hidden',
            marginBottom: '1rem'
          }}>
            <div 
              style={{ 
                height: '100%', 
                background: 'linear-gradient(90deg, #10b981, #059669)',
                width: `${spentPercentage}%`,
                transition: 'width 0.3s ease'
              }}
            ></div>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            fontSize: '0.875rem'
          }}>
            <span style={{ color: '#94a3b8' }}>
              Spent: <span style={{ color: '#f8fafc', fontWeight: '600' }}>${spent?.toLocaleString() || 0}</span>
            </span>
            <span style={{ color: '#94a3b8' }}>
              Remaining: <span style={{ color: '#f8fafc', fontWeight: '600' }}>${remaining?.toLocaleString() || 0}</span>
            </span>
          </div>
        </div>
      </div>

      {scope === 'all' && budgetData.departments && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ color: '#f8fafc', marginBottom: '1rem' }}>Department Breakdown</h4>
          <div style={{ 
            padding: '1.5rem',
            background: 'rgba(15, 23, 42, 0.4)',
            borderRadius: '12px',
            border: '1px solid rgba(148, 163, 184, 0.1)'
          }}>
            {budgetData.departments.map((dept, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '1rem 0',
                borderBottom: index < budgetData.departments.length - 1 ? '1px solid rgba(148, 163, 184, 0.1)' : 'none'
              }}>
                <div style={{ fontWeight: '600', color: '#f8fafc' }}>{dept.name}</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#f8fafc' }}>
                    ${dept.spent?.toLocaleString() || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {((dept.spent / dept.budget) * 100).toFixed(1)}% of budget
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {scope === 'self' && (
        <div style={{ 
          padding: '1rem',
          background: 'rgba(59, 130, 246, 0.1)', 
          borderRadius: '12px',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          color: '#60a5fa',
          fontSize: '0.875rem'
        }}>
          <strong>Note:</strong> This is a read-only view of your team's budget allocation.
        </div>
      )}

      {exporting && (
        <div style={{ 
          textAlign: 'center', 
          padding: '1rem', 
          color: '#94a3b8',
          fontSize: '0.875rem'
        }}>
          Exporting budget data... Please wait.
        </div>
      )}
    </div>
  );
}

export default BudgetOverview; 