import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../utils/api';
import './TopKPICards.css';

function TopKPICards({ scope = 'self', user, token }) {
  const [kpis, setKpis] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIs();
  }, [scope]);

  const fetchKPIs = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/kpi?scope=${scope}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setKpis(data);
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getKPICards = () => {
    switch (scope) {
      case 'self':
        return [
          {
            title: "Total Invoices",
            value: kpis.totalInvoices || 0,
            icon: "📄",
            change: "+12%",
            changeType: "positive",
            description: "Your invoice count this month"
          },
          {
            title: "Total Amount",
            value: `$${(kpis.totalAmount || 0).toLocaleString()}`,
            icon: "💰",
            change: "+8.5%",
            changeType: "positive",
            description: "Total revenue generated"
          },
          {
            title: "Total Commission",
            value: `$${(kpis.totalCommission || 0).toLocaleString()}`,
            icon: "💸",
            change: "+15.2%",
            changeType: "positive",
            description: "Your commission earnings"
          },
          {
            title: "Pending Invoices",
            value: kpis.pendingInvoices || 0,
            icon: "⏳",
            change: "-3%",
            changeType: "negative",
            description: "Awaiting approval"
          }
        ];
      
      case 'department':
        return [
          {
            title: "Total Invoices",
            value: kpis.totalInvoices || 0,
            icon: "📄",
            change: "+18%",
            changeType: "positive",
            description: "Department invoice count"
          },
          {
            title: "Total Amount",
            value: `$${(kpis.totalAmount || 0).toLocaleString()}`,
            icon: "💰",
            change: "+12.3%",
            changeType: "positive",
            description: "Department revenue"
          },
          {
            title: "Total Commission",
            value: `$${(kpis.totalCommission || 0).toLocaleString()}`,
            icon: "💸",
            change: "+9.7%",
            changeType: "positive",
            description: "Team commission total"
          },
          {
            title: "Pending Invoices",
            value: kpis.pendingInvoices || 0,
            icon: "⏳",
            change: "-5%",
            changeType: "negative",
            description: "Awaiting approval"
          }
        ];
      
      case 'all':
        return [
          {
            title: "Total Invoices",
            value: kpis.totalInvoices || 0,
            icon: "📄",
            change: "+22%",
            changeType: "positive",
            description: "Company-wide invoice count"
          },
          {
            title: "Total Amount",
            value: `$${(kpis.totalAmount || 0).toLocaleString()}`,
            icon: "💰",
            change: "+16.8%",
            changeType: "positive",
            description: "Total company revenue"
          },
          {
            title: "Total Commission",
            value: `$${(kpis.totalCommission || 0).toLocaleString()}`,
            icon: "💸",
            change: "+14.2%",
            changeType: "positive",
            description: "Total commission paid"
          },
          {
            title: "Total Users",
            value: kpis.totalUsers || 0,
            icon: "👥",
            change: "+5%",
            changeType: "positive",
            description: "Active team members"
          }
        ];
      
      default:
        return [];
    }
  };

  if (loading) {
    return <div className="loading">Loading KPIs...</div>;
  }

  const kpiCards = getKPICards();

  return (
    <div className="kpi-cards">
      {kpiCards.map((kpi, index) => (
        <div key={index} className="kpi-card">
          <div className="kpi-header">
            <h3 className="kpi-title">{kpi.title}</h3>
            <div className="kpi-icon">{kpi.icon}</div>
          </div>
          <div className="kpi-value">{kpi.value}</div>
          <div className={`kpi-change ${kpi.changeType}`}>
            <span className="kpi-change-icon">
              {kpi.changeType === 'positive' ? '↗' : kpi.changeType === 'negative' ? '↘' : '→'}
            </span>
            {kpi.change}
          </div>
          <p className="kpi-description">{kpi.description}</p>
        </div>
      ))}
    </div>
  );
}

export default TopKPICards; 