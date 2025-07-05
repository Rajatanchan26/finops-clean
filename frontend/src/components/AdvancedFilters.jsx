import React, { useState, useEffect } from 'react';

function AdvancedFilters({ 
  filters, 
  onFiltersChange, 
  searchPlaceholder = "Search...",
  showDateRange = true,
  showStatus = true,
  showDepartment = true,
  showAmountRange = true,
  departments = [],
  statuses = ['pending', 'approved', 'rejected']
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters || {});

  useEffect(() => {
    setLocalFilters(filters || {});
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSearchChange = (value) => {
    handleFilterChange('search', value);
  };

  const handleDateRangeChange = (type, value) => {
    const newFilters = { ...localFilters };
    if (type === 'start') {
      newFilters.startDate = value;
    } else {
      newFilters.endDate = value;
    }
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleAmountRangeChange = (type, value) => {
    const newFilters = { ...localFilters };
    if (type === 'min') {
      newFilters.minAmount = value;
    } else {
      newFilters.maxAmount = value;
    }
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.values(localFilters).filter(value => 
      value !== undefined && value !== null && value !== ''
    ).length;
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          flex: '1',
          minWidth: '300px'
        }}>
          <div style={{ 
            position: 'relative', 
            flex: '1',
            display: 'flex',
            alignItems: 'center'
          }}>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={localFilters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="form-input"
              style={{ 
                paddingLeft: '2.5rem',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                color: '#f1f5f9'
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
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            {isExpanded ? '▼' : '▶'} Filters
            {getActiveFiltersCount() > 0 && (
              <span style={{ 
                background: '#ef4444', 
                color: 'white', 
                borderRadius: '50%', 
                width: '20px', 
                height: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {getActiveFiltersCount()}
              </span>
            )}
          </button>
          
          {getActiveFiltersCount() > 0 && (
            <button 
              className="btn btn-outline"
              onClick={clearFilters}
              style={{ fontSize: '0.875rem' }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div style={{ 
          padding: '1.5rem',
          background: 'rgba(15, 23, 42, 0.3)',
          borderRadius: '12px',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          marginTop: '1rem'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {showDateRange && (
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  color: '#94a3b8', 
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  Date Range
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="date"
                    value={localFilters.startDate || ''}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    className="form-input"
                    style={{ 
                      background: 'rgba(15, 23, 42, 0.4)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      color: '#f1f5f9'
                    }}
                  />
                  <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>to</span>
                  <input
                    type="date"
                    value={localFilters.endDate || ''}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    className="form-input"
                    style={{ 
                      background: 'rgba(15, 23, 42, 0.4)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      color: '#f1f5f9'
                    }}
                  />
                </div>
              </div>
            )}

            {showStatus && (
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  color: '#94a3b8', 
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  Status
                </label>
                <select
                  value={localFilters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="form-select"
                  style={{ 
                    background: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    color: '#f1f5f9'
                  }}
                >
                  <option value="">All Statuses</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {showDepartment && departments.length > 0 && (
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  color: '#94a3b8', 
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  Department
                </label>
                <select
                  value={localFilters.department || ''}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="form-select"
                  style={{ 
                    background: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    color: '#f1f5f9'
                  }}
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            )}

            {showAmountRange && (
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  color: '#94a3b8', 
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  Amount Range
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    placeholder="Min"
                    value={localFilters.minAmount || ''}
                    onChange={(e) => handleAmountRangeChange('min', e.target.value)}
                    className="form-input"
                    style={{ 
                      background: 'rgba(15, 23, 42, 0.4)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      color: '#f1f5f9'
                    }}
                  />
                  <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={localFilters.maxAmount || ''}
                    onChange={(e) => handleAmountRangeChange('max', e.target.value)}
                    className="form-input"
                    style={{ 
                      background: 'rgba(15, 23, 42, 0.4)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      color: '#f1f5f9'
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                color: '#94a3b8', 
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                Sort By
              </label>
              <select
                value={localFilters.sortBy || 'created_at'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="form-select"
                style={{ 
                  background: 'rgba(15, 23, 42, 0.4)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  color: '#f1f5f9'
                }}
              >
                <option value="created_at">Date Created</option>
                <option value="amount">Amount</option>
                <option value="status">Status</option>
                <option value="invoice_number">Invoice Number</option>
              </select>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                color: '#94a3b8', 
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                Sort Order
              </label>
              <select
                value={localFilters.sortOrder || 'desc'}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="form-select"
                style={{ 
                  background: 'rgba(15, 23, 42, 0.4)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  color: '#f1f5f9'
                }}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvancedFilters; 