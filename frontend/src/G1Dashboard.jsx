import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BudgetOverview from './components/BudgetOverview';
import CommissionDashboard from './components/CommissionDashboard';
import InvoiceForm from './components/InvoiceForm';
import InvoiceReview from './components/InvoiceReview';
import TopKPICards from './components/TopKPICards';
import DashboardLayout from './components/DashboardLayout';

function G1Dashboard({ user, token, onLogout, onProfileClick }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user || user.grade !== 'G1') {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const navTabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'invoices', label: 'Invoices', icon: '📄' },
    { id: 'commission', label: 'Commission', icon: '💸' },
  ];

  if (!user || user.grade !== 'G1') {
    return null;
  }

  return (
    <DashboardLayout
      title="Employee Dashboard"
      user={user}
      onLogout={handleLogout}
      onProfileClick={onProfileClick}
      navTabs={navTabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="overview-tab">
          <TopKPICards scope="self" user={user} token={token} />
          <BudgetOverview scope="self" user={user} token={token} />
        </div>
      )}
      {activeTab === 'invoices' && (
        <div className="invoices-tab">
          <InvoiceForm scope="self" user={user} token={token} />
          <InvoiceReview scope="self" user={user} token={token} />
        </div>
      )}
      {activeTab === 'commission' && (
        <div className="commission-tab">
          <CommissionDashboard scope="self" user={user} token={token} />
        </div>
      )}
    </DashboardLayout>
  );
}

export default G1Dashboard; 