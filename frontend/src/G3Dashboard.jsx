import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopKPICards from './components/TopKPICards';
import InvoiceForm from './components/InvoiceForm';
import InvoiceReview from './components/InvoiceReview';
import BudgetOverview from './components/BudgetOverview';
import CommissionDashboard from './components/CommissionDashboard';
import AdvancedFilters from './components/AdvancedFilters';
import MobileNavigation from './components/MobileNavigation';
import DashboardLayout from './components/DashboardLayout';

function G3Dashboard({ user, token, onLogout, onProfileClick }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  const navTabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'invoices', label: 'Invoices', icon: '📄' },
    { id: 'commission', label: 'Commission', icon: '💸' },
    { id: 'budget', label: 'Budget', icon: '💰' },
  ];

  useEffect(() => {
    if (!user || user.grade !== 'G3') {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="overview-content">
            <TopKPICards user={user} token={token} scope="all" />
            <BudgetOverview user={user} token={token} scope="all" />
            <CommissionDashboard user={user} token={token} scope="all" />
          </div>
        );
      
      case 'invoices':
        return (
          <div className="invoices-content">
            <AdvancedFilters 
              filters={filters}
              onFiltersChange={setFilters}
              searchPlaceholder="Search invoices..."
              departments={['Sales', 'Marketing', 'Engineering', 'Finance']}
            />
            <InvoiceReview user={user} token={token} scope="all" filters={filters} />
          </div>
        );
      
      case 'commission':
        return (
          <div className="commission-content">
            <CommissionDashboard user={user} token={token} scope="all" />
          </div>
        );
      
      case 'budget':
        return (
          <div className="budget-content">
            <BudgetOverview user={user} token={token} scope="all" />
          </div>
        );
      
      default:
        return <div>Select a tab to view content</div>;
    }
  };

  if (isMobile) {
    return (
      <div className="mobile-dashboard">
        <MobileNavigation 
          user={user} 
          onLogout={onLogout} 
          onProfileClick={onProfileClick}
        />
        <div className="mobile-content">
          {renderTabContent()}
        </div>
      </div>
    );
  }

  if (!user || user.grade !== 'G3') {
    return null;
  }

  return (
    <DashboardLayout
      title="Finance Head Dashboard"
      user={user}
      onLogout={handleLogout}
      onProfileClick={onProfileClick}
      navTabs={navTabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {renderTabContent()}
    </DashboardLayout>
  );
}

export default G3Dashboard; 