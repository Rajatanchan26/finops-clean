import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../utils/api';

function InvoiceReview({ scope = 'department', user, token }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [scope, filter]);

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/invoices?scope=${scope}&status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      } else {
        setMessage('Error fetching invoices');
      }
    } catch (error) {
      setMessage('Error fetching invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleNewInvoice = (newInvoice) => {
    // Add the new invoice to the beginning of the list
    setInvoices(prevInvoices => [newInvoice, ...prevInvoices]);
  };

  const handleAction = async (invoiceId, action) => {
    if (scope === 'all' && user.grade === 3) {
      setMessage('Finance Heads cannot approve/reject invoices');
      return;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: action })
      });

      if (response.ok) {
        setMessage(`Invoice ${action}d successfully`);
        fetchInvoices(); // Refresh the list
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.message}`);
      }
    } catch (error) {
      setMessage(`Error ${action}ing invoice`);
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/export/invoices?format=${format}&scope=${scope}&status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoices_${scope}_${filter}_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setMessage(`Invoices exported successfully as ${format.toUpperCase()}`);
      } else {
        setMessage('Error exporting invoices');
      }
    } catch (error) {
      setMessage('Error exporting invoices');
    } finally {
      setExporting(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => 
    invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Loading invoices...</div>;
  }

  return (
    <div className="card">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem' 
      }}>
        <h3 style={{ color: '#f8fafc', margin: 0 }}>Invoice Review</h3>
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
            background: 'rgba(59, 130, 246, 0.1)',
            color: '#3b82f6',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            📄
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem', 
        marginBottom: '1.5rem',
        padding: '1rem',
        background: 'rgba(15, 23, 42, 0.3)',
        borderRadius: '12px',
        border: '1px solid rgba(148, 163, 184, 0.1)'
      }}>
        <div style={{ 
          position: 'relative', 
          flex: '1',
          display: 'flex',
          alignItems: 'center'
        }}>
          <input
            type="text"
            placeholder="Search invoices by number, description, user, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ 
              paddingLeft: '2.5rem',
              paddingRight: '2.5rem',
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: '#f8fafc'
            }}
          />
          <div style={{ 
            position: 'absolute', 
            left: '0.75rem', 
            color: '#94a3b8',
            fontSize: '1rem'
          }}>
            🔍
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary"
            style={{ 
              position: 'absolute', 
              right: '0.25rem',
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              background: 'rgba(148, 163, 184, 0.1)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: '#94a3b8'
            }}
          >
            {showFilters ? '▼' : '▶'} Filters
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div style={{ 
          padding: '1rem',
          background: 'rgba(15, 23, 42, 0.2)',
          borderRadius: '8px',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label style={{ 
              fontSize: '0.875rem', 
              color: '#94a3b8', 
              fontWeight: '500',
              minWidth: '80px'
            }}>
              Status:
            </label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="form-select"
              style={{ 
                minWidth: '150px',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                color: '#f8fafc'
              }}
            >
              <option value="all">All Invoices</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      )}

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Amount</th>
              <th>Commission</th>
              <th>Description</th>
              <th>User</th>
              <th>Department</th>
              <th>Date</th>
              <th>Status</th>
              {user.grade === 3 && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id}>
                <td style={{ fontFamily: 'monospace', color: '#60a5fa' }}>
                  {invoice.invoice_number}
                </td>
                <td style={{ fontWeight: '600' }}>
                  ${invoice.amount?.toLocaleString() || 0}
                </td>
                <td style={{ color: '#10b981' }}>
                  ${invoice.commission_amount?.toLocaleString() || 0}
                </td>
                <td style={{ maxWidth: '200px' }}>
                  <div style={{ 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap' 
                  }}>
                    {invoice.description}
                  </div>
                </td>
                <td>{invoice.user_name}</td>
                <td>{invoice.department}</td>
                <td>
                  {new Date(invoice.created_at).toLocaleDateString()}
                </td>
                <td>
                  <span className={`status-badge ${invoice.status}`}>
                    {invoice.status}
                  </span>
                </td>
                {user.grade === 3 && invoice.status === 'pending' && (
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleAction(invoice.id, 'approved')}
                        className="btn btn-primary"
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        ✓ Approve
                      </button>
                      <button 
                        onClick={() => handleAction(invoice.id, 'rejected')}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredInvoices.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          color: '#94a3b8',
          fontStyle: 'italic'
        }}>
          {searchTerm ? 'No invoices found matching your search.' : 'No invoices found for the selected filter.'}
        </div>
      )}

      {exporting && (
        <div style={{ 
          textAlign: 'center', 
          padding: '1rem', 
          color: '#94a3b8',
          fontSize: '0.875rem'
        }}>
          Exporting invoices... Please wait.
        </div>
      )}
    </div>
  );
}

export default InvoiceReview; 