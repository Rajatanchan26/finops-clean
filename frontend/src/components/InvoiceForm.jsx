import React, { useState } from 'react';
import { getApiBaseUrl } from '../../utils/api';
import './InvoiceForm.css';

function InvoiceForm({ scope = 'self', user, token, onInvoiceCreated }) {
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    commission_rate: 5.0,
    category: '',
    department: user?.department || '',
    date: new Date().toISOString().split('T')[0]
  });
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Submitting invoice...');
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          description: formData.description,
          commission_rate: parseFloat(formData.commission_rate),
          category: formData.category,
          department: formData.department,
          date: formData.date
        })
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(`Invoice submitted successfully! Invoice #: ${result.invoice.invoice_number}`);
        
        // Call the callback to refresh the invoice list
        if (onInvoiceCreated && result.invoice) {
          onInvoiceCreated(result.invoice);
        }
        
        setFormData({
          amount: '',
          description: '',
          commission_rate: 5.0,
          category: '',
          department: user?.department || '',
          date: new Date().toISOString().split('T')[0]
        });
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.message}`);
      }
    } catch (error) {
      setMessage('Error submitting invoice');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="invoice-form">
      <div className="form-header">
        <h3 className="form-title">Submit Invoice</h3>
        <div className="form-icon">📄</div>
      </div>
      
      {message && (
        <div className={`form-message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Amount ($)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="form-input"
              placeholder="Enter amount"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Commission Rate (%)</label>
            <input
              type="number"
              name="commission_rate"
              value={formData.commission_rate}
              onChange={handleChange}
              required
              min="0"
              max="100"
              step="0.1"
              className="form-input"
              placeholder="5.0"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Category</label>
            <select 
              name="category" 
              value={formData.category} 
              onChange={handleChange} 
              required
              className="form-select"
            >
              <option value="">Select Category</option>
              <option value="travel">Travel</option>
              <option value="office">Office Supplies</option>
              <option value="marketing">Marketing</option>
              <option value="software">Software</option>
              <option value="consulting">Consulting</option>
              <option value="training">Training</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              readOnly={scope === 'self'}
              className="form-input"
              placeholder="Department name"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            className="form-textarea"
            placeholder="Provide a detailed description of the invoice..."
          />
        </div>
        
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setFormData({
            amount: '',
            description: '',
            commission_rate: 5.0,
            category: '',
            department: user?.department || '',
            date: new Date().toISOString().split('T')[0]
          })}>
            Clear Form
          </button>
          <button type="submit" className="btn btn-primary">
            📄 Submit Invoice
          </button>
        </div>
      </form>
    </div>
  );
}

export default InvoiceForm; 