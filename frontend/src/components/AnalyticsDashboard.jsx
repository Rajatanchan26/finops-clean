import React, { useState, useEffect } from 'react';

function AnalyticsDashboard({ user, token }) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('6months');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [chartType, setChartType] = useState('line');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, selectedMetric]);

  const fetchAnalyticsData = async () => {
    try {
      console.log('Fetching analytics data...');
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:5000/analytics?range=${timeRange}&metric=${selectedMetric}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Analytics response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Analytics data received:', data);
        setAnalyticsData(data);
      } else {
        const errorText = await response.text();
        console.error('Analytics API error:', response.status, errorText);
        setError(`API Error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError(`Network Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const response = await fetch(`http://localhost:5000/export/analytics?format=${format}&range=${timeRange}&metric=${selectedMetric}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_${selectedMetric}_${timeRange}_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setError(`Analytics data exported successfully as ${format.toUpperCase()}`);
      } else {
        setError('Error exporting analytics data');
      }
    } catch (error) {
      setError('Error exporting analytics data');
    } finally {
      setExporting(false);
    }
  };

  const renderTrendChart = () => {
    if (!analyticsData?.trends) return <div>No trend data available</div>;

    const { trends, predictions } = analyticsData;
    const maxValue = Math.max(...trends.map(t => t.value), ...predictions.map(p => p.value));

    return (
      <div className="trend-chart">
        <div className="chart-header">
          <h4>Trend Analysis & Predictions</h4>
          <div className="chart-controls">
            <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
              <option value="line">Line Chart</option>
              <option value="bar">Bar Chart</option>
              <option value="area">Area Chart</option>
            </select>
          </div>
        </div>
        
        <div className="chart-container">
          <div className="chart-legend">
            <span className="legend-item">
              <div className="legend-color actual"></div>
              <span>Actual</span>
            </span>
            <span className="legend-item">
              <div className="legend-color predicted"></div>
              <span>Predicted</span>
            </span>
          </div>
          
          <div className="chart-bars">
            {trends.map((trend, index) => (
              <div key={index} className="chart-bar-group">
                <div className="bar-label">{trend.period}</div>
                <div className="bars">
                  <div 
                    className="bar actual-bar"
                    style={{ height: `${(trend.value / maxValue) * 100}%` }}
                    title={`${trend.period}: $${trend.value.toLocaleString()}`}
                  ></div>
                </div>
              </div>
            ))}
            
            {predictions.map((prediction, index) => (
              <div key={`pred-${index}`} className="chart-bar-group prediction">
                <div className="bar-label">{prediction.period}</div>
                <div className="bars">
                  <div 
                    className="bar predicted-bar"
                    style={{ height: `${(prediction.value / maxValue) * 100}%` }}
                    title={`${prediction.period}: $${prediction.value.toLocaleString()} (predicted)`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderKPIMetrics = () => {
    if (!analyticsData?.kpis) return null;

    const { kpis } = analyticsData;

    return (
      <div className="kpi-metrics">
        <h4>Key Performance Indicators</h4>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-icon">📈</span>
              <span className="metric-title">Growth Rate</span>
            </div>
            <div className="metric-value">{kpis.growthRate?.toFixed(1)}%</div>
            <div className={`metric-change ${kpis.growthRate >= 0 ? 'positive' : 'negative'}`}>
              {kpis.growthRate >= 0 ? '↗' : '↘'} {Math.abs(kpis.growthRate).toFixed(1)}%
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-icon">🎯</span>
              <span className="metric-title">Target Achievement</span>
            </div>
            <div className="metric-value">{kpis.targetAchievement?.toFixed(1)}%</div>
            <div className="metric-progress">
              <div 
                className="progress-bar"
                style={{ width: `${Math.min(kpis.targetAchievement, 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-icon">📊</span>
              <span className="metric-title">Efficiency Score</span>
            </div>
            <div className="metric-value">{kpis.efficiencyScore?.toFixed(1)}%</div>
            <div className="metric-description">Based on cost vs revenue</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-icon">⚡</span>
              <span className="metric-title">Processing Speed</span>
            </div>
            <div className="metric-value">{kpis.avgProcessingTime?.toFixed(1)} days</div>
            <div className="metric-description">Average invoice processing</div>
          </div>
        </div>
      </div>
    );
  };

  const renderDepartmentComparison = () => {
    if (!analyticsData?.departments) return null;

    const { departments } = analyticsData;

    return (
      <div className="department-comparison">
        <h4>Department Performance Comparison</h4>
        <div className="comparison-chart">
          {departments.map((dept, index) => {
            const maxRevenue = Math.max(...departments.map(d => d.revenue));
            const maxCommission = Math.max(...departments.map(d => d.commission));
            
            return (
              <div key={index} className="dept-row">
                <div className="dept-name">{dept.name}</div>
                <div className="dept-metrics">
                  <div className="metric-group">
                    <span className="metric-label">Revenue</span>
                    <div className="metric-bar">
                      <div 
                        className="bar-fill revenue"
                        style={{ width: `${(dept.revenue / maxRevenue) * 100}%` }}
                      ></div>
                      <span className="bar-value">${dept.revenue?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                  
                  <div className="metric-group">
                    <span className="metric-label">Commission</span>
                    <div className="metric-bar">
                      <div 
                        className="bar-fill commission"
                        style={{ width: `${(dept.commission / maxCommission) * 100}%` }}
                      ></div>
                      <span className="bar-value">${dept.commission?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                  
                  <div className="metric-group">
                    <span className="metric-label">Efficiency</span>
                    <div className="efficiency-score">
                      <span className={`score ${dept.efficiency >= 80 ? 'high' : dept.efficiency >= 60 ? 'medium' : 'low'}`}>
                        {dept.efficiency?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPredictiveInsights = () => {
    if (!analyticsData?.insights) return null;

    const { insights } = analyticsData;

    return (
      <div className="predictive-insights">
        <h4>Predictive Insights</h4>
        <div className="insights-grid">
          {insights.map((insight, index) => (
            <div key={index} className={`insight-card ${insight.type}`}>
              <div className="insight-header">
                <span className="insight-icon">
                  {insight.type === 'opportunity' ? '💡' :
                   insight.type === 'warning' ? '⚠️' :
                   insight.type === 'trend' ? '📈' : 'ℹ️'}
                </span>
                <span className="insight-title">{insight.title}</span>
              </div>
              <div className="insight-message">{insight.message}</div>
              <div className="insight-confidence">
                Confidence: {insight.confidence}%
              </div>
              {insight.recommendation && (
                <div className="insight-recommendation">
                  <strong>Recommendation:</strong> {insight.recommendation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAnomalyDetection = () => {
    if (!analyticsData?.anomalies) return null;

    const { anomalies } = analyticsData;

    return (
      <div className="anomaly-detection">
        <h4>Anomaly Detection</h4>
        <div className="anomalies-list">
          {anomalies.map((anomaly, index) => (
            <div key={index} className={`anomaly-item ${anomaly.severity}`}>
              <div className="anomaly-header">
                <span className={`severity-indicator ${anomaly.severity}`}>
                  {anomaly.severity === 'high' ? '🔴' :
                   anomaly.severity === 'medium' ? '🟡' : '🟢'}
                </span>
                <span className="anomaly-title">{anomaly.title}</span>
                <span className="anomaly-date">{new Date(anomaly.date).toLocaleDateString()}</span>
              </div>
              <div className="anomaly-description">{anomaly.description}</div>
              <div className="anomaly-impact">
                <strong>Impact:</strong> {anomaly.impact}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Loading analytics data...</div>;
  }

  if (error) {
    return (
      <div className="card">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1.5rem' 
        }}>
          <h3 style={{ color: '#f8fafc', margin: 0 }}>Analytics Dashboard</h3>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            📊
          </div>
        </div>
        <div className="message error">{error}</div>
        <button onClick={fetchAnalyticsData} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="card">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1.5rem' 
        }}>
          <h3 style={{ color: '#f8fafc', margin: 0 }}>Analytics Dashboard</h3>
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
            📊
          </div>
        </div>
        <div className="message info">No analytics data available</div>
        <button onClick={fetchAnalyticsData} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Refresh Data
        </button>
      </div>
    );
  }

  const { trends, predictions, kpis, departments, insights, anomalies } = analyticsData;

  return (
    <div className="card">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem' 
      }}>
        <h3 style={{ color: '#f8fafc', margin: 0 }}>Analytics Dashboard</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="form-select"
            style={{ minWidth: '120px' }}
          >
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
          <select 
            value={selectedMetric} 
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="form-select"
            style={{ minWidth: '120px' }}
          >
            <option value="revenue">Revenue</option>
            <option value="commission">Commission</option>
            <option value="invoices">Invoices</option>
          </select>
          {/* Export Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => handleExport('excel')}
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
              📊 Excel
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
            📊
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      {kpis && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ color: '#f8fafc', marginBottom: '1rem' }}>Key Performance Indicators</h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1.5rem' 
          }}>
            <div style={{ 
              textAlign: 'center', 
              padding: '1rem', 
              background: 'rgba(15, 23, 42, 0.4)', 
              borderRadius: '12px', 
              border: '1px solid rgba(148, 163, 184, 0.1)' 
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📈</div>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Growth Rate
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.25rem' }}>
                {kpis.growthRate?.toFixed(1)}%
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: kpis.growthRate >= 0 ? '#10b981' : '#ef4444', 
                fontWeight: '500' 
              }}>
                {kpis.growthRate >= 0 ? '↗' : '↘'} {Math.abs(kpis.growthRate).toFixed(1)}%
              </div>
            </div>
            
            <div style={{ 
              textAlign: 'center', 
              padding: '1rem', 
              background: 'rgba(15, 23, 42, 0.4)', 
              borderRadius: '12px', 
              border: '1px solid rgba(148, 163, 184, 0.1)' 
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎯</div>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Target Achievement
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.25rem' }}>
                {kpis.targetAchievement?.toFixed(1)}%
              </div>
              <div style={{ 
                width: '100%', 
                height: '4px', 
                background: 'rgba(148, 163, 184, 0.2)', 
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div 
                  style={{ 
                    height: '100%', 
                    background: 'linear-gradient(90deg, #10b981, #059669)',
                    width: `${Math.min(kpis.targetAchievement, 100)}%`,
                    transition: 'width 0.3s ease'
                  }}
                ></div>
              </div>
            </div>
            
            <div style={{ 
              textAlign: 'center', 
              padding: '1rem', 
              background: 'rgba(15, 23, 42, 0.4)', 
              borderRadius: '12px', 
              border: '1px solid rgba(148, 163, 184, 0.1)' 
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</div>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Efficiency Score
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.25rem' }}>
                {kpis.efficiencyScore?.toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Based on cost vs revenue
              </div>
            </div>
            
            <div style={{ 
              textAlign: 'center', 
              padding: '1rem', 
              background: 'rgba(15, 23, 42, 0.4)', 
              borderRadius: '12px', 
              border: '1px solid rgba(148, 163, 184, 0.1)' 
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚡</div>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Processing Speed
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f8fafc', marginBottom: '0.25rem' }}>
                {kpis.avgProcessingTime?.toFixed(1)} days
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Average invoice processing
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trend Chart */}
      {trends && trends.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ color: '#f8fafc', marginBottom: '1rem' }}>Trend Analysis & Predictions</h4>
          <div style={{ 
            padding: '1.5rem',
            background: 'rgba(15, 23, 42, 0.4)',
            borderRadius: '12px',
            border: '1px solid rgba(148, 163, 184, 0.1)'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${trends.length + (predictions?.length || 0)}, 1fr)`, 
              gap: '1rem', 
              alignItems: 'end',
              height: '200px'
            }}>
              {trends.map((trend, index) => {
                const maxValue = Math.max(...trends.map(t => t.value), ...(predictions?.map(p => p.value) || [0]));
                const height = maxValue > 0 ? (trend.value / maxValue) * 100 : 0;
                
                return (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <div 
                      style={{ 
                        width: '100%',
                        height: `${height}%`,
                        background: 'linear-gradient(180deg, #3b82f6, #1d4ed8)',
                        borderRadius: '4px',
                        minHeight: '4px'
                      }}
                      title={`${trend.period}: $${trend.value.toLocaleString()}`}
                    ></div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                      {trend.period}
                    </div>
                  </div>
                );
              })}
              
              {predictions?.map((prediction, index) => {
                const maxValue = Math.max(...trends.map(t => t.value), ...predictions.map(p => p.value));
                const height = maxValue > 0 ? (prediction.value / maxValue) * 100 : 0;
                
                return (
                  <div key={`pred-${index}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <div 
                      style={{ 
                        width: '100%',
                        height: `${height}%`,
                        background: 'linear-gradient(180deg, #10b981, #059669)',
                        borderRadius: '4px',
                        minHeight: '4px',
                        border: '2px dashed rgba(16, 185, 129, 0.5)'
                      }}
                      title={`${prediction.period}: $${prediction.value.toLocaleString()} (predicted)`}
                    ></div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                      {prediction.period}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '2px' }}></div>
                <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Actual</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px', border: '2px dashed rgba(16, 185, 129, 0.5)' }}></div>
                <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Predicted</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Comparison */}
      {departments && departments.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ color: '#f8fafc', marginBottom: '1rem' }}>Department Performance Comparison</h4>
          <div style={{ 
            padding: '1.5rem',
            background: 'rgba(15, 23, 42, 0.4)',
            borderRadius: '12px',
            border: '1px solid rgba(148, 163, 184, 0.1)'
          }}>
            {departments.map((dept, index) => {
              const maxRevenue = Math.max(...departments.map(d => d.revenue));
              const maxCommission = Math.max(...departments.map(d => d.commission));
              
              return (
                <div key={index} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 2fr 2fr', 
                  gap: '1rem', 
                  alignItems: 'center',
                  padding: '1rem 0',
                  borderBottom: index < departments.length - 1 ? '1px solid rgba(148, 163, 184, 0.1)' : 'none'
                }}>
                  <div style={{ fontWeight: '600', color: '#f8fafc' }}>{dept.name}</div>
                  
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Revenue</div>
                    <div style={{ 
                      width: '100%', 
                      height: '8px', 
                      background: 'rgba(148, 163, 184, 0.2)', 
                      borderRadius: '4px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          background: 'linear-gradient(90deg, #60a5fa, #3b82f6)',
                          width: `${maxRevenue > 0 ? (dept.revenue / maxRevenue) * 100 : 0}%`,
                          transition: 'width 0.3s ease'
                        }}
                      ></div>
                      <span style={{ 
                        position: 'absolute', 
                        right: '0', 
                        top: '-20px', 
                        fontSize: '0.75rem', 
                        color: '#f8fafc',
                        fontWeight: '600'
                      }}>
                        ${dept.revenue?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Commission</div>
                    <div style={{ 
                      width: '100%', 
                      height: '8px', 
                      background: 'rgba(148, 163, 184, 0.2)', 
                      borderRadius: '4px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          background: 'linear-gradient(90deg, #10b981, #059669)',
                          width: `${maxCommission > 0 ? (dept.commission / maxCommission) * 100 : 0}%`,
                          transition: 'width 0.3s ease'
                        }}
                      ></div>
                      <span style={{ 
                        position: 'absolute', 
                        right: '0', 
                        top: '-20px', 
                        fontSize: '0.75rem', 
                        color: '#f8fafc',
                        fontWeight: '600'
                      }}>
                        ${dept.commission?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Predictive Insights */}
      {insights && insights.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ color: '#f8fafc', marginBottom: '1rem' }}>Predictive Insights</h4>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {insights.map((insight, index) => (
              <div key={index} style={{ 
                padding: '1rem',
                background: 'rgba(15, 23, 42, 0.4)',
                borderRadius: '12px',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                borderLeft: `4px solid ${insight.type === 'positive' ? '#10b981' : insight.type === 'warning' ? '#f59e0b' : '#ef4444'}`
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '0.75rem' 
                }}>
                  <div style={{ 
                    fontSize: '1.25rem',
                    color: insight.type === 'positive' ? '#10b981' : insight.type === 'warning' ? '#f59e0b' : '#ef4444'
                  }}>
                    {insight.type === 'positive' ? '💡' : insight.type === 'warning' ? '⚠️' : '🚨'}
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '600', 
                      color: '#f8fafc', 
                      marginBottom: '0.25rem' 
                    }}>
                      {insight.title}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                      {insight.description}
                    </div>
                    {insight.recommendation && (
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#60a5fa', 
                        marginTop: '0.5rem',
                        fontStyle: 'italic'
                      }}>
                        💡 {insight.recommendation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anomaly Detection */}
      {anomalies && anomalies.length > 0 && (
        <div>
          <h4 style={{ color: '#f8fafc', marginBottom: '1rem' }}>Anomaly Detection</h4>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {anomalies.map((anomaly, index) => (
              <div key={index} style={{ 
                padding: '1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '0.75rem' 
                }}>
                  <div style={{ fontSize: '1.25rem', color: '#ef4444' }}>🚨</div>
                  <div>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '600', 
                      color: '#f8fafc', 
                      marginBottom: '0.25rem' 
                    }}>
                      {anomaly.title}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                      {anomaly.description}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#fca5a5', 
                      marginTop: '0.5rem' 
                    }}>
                      Severity: {anomaly.severity} • Detected: {anomaly.detectedAt}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
          Exporting analytics data... Please wait.
        </div>
      )}
    </div>
  );
}

export default AnalyticsDashboard; 