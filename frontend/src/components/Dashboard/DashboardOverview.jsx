import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from 'recharts';
import './DashboardOverview.css';

const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL}`;

const DashboardOverview = ({ setActiveTab, setInitialAction }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);
  const isTechnician = user?.role === 'Technician';

  useEffect(() => {
    fetchStats();
  }, []);

  const [showRenewalsModal, setShowRenewalsModal] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/reports/dashboard`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard statistics.');
      setLoading(false);
    }
  };

  const handleAction = (tab, action = null) => {
    if (action) setInitialAction(action);
    setActiveTab(tab);
  };

  if (loading) return (
    <div className="module-container">
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Synchronizing global network metrics...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="module-container">
      <div className="error-alert animate-fade-in">
        <i className="ri-error-warning-line"></i>
        <span>{error}</span>
      </div>
    </div>
  );

  if (!stats) return null;

  return (
    <div className="dashboard-overview">
      <div className="module-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="page-title">{isTechnician ? 'Network Operations Dashboard' : 'Business Intelligence Dashboard'}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
              {isTechnician ? 'Monitor subscriber status and daily collection dues.' : 'Strategic growth metrics and revenue forecasting.'}
          </p>
        </div>
      </div>
      
      <div className="section-group">
        <h2 className="section-title">Network Metrics</h2>
        <div className="kpi-grid dashboard-metrics-grid">
          <div className="action-card metric-card" onClick={() => setActiveTab('Customers')}>
            <div className="action-icon customers">👥</div>
            <div className="metric-info">
              <span>Total Customers</span>
              <p className="metric-value">{stats.totalCustomers?.toLocaleString() || 0}</p>
            </div>
          </div>
          
          {!isTechnician && (
            <div className="action-card metric-card" onClick={() => setActiveTab('Payments')}>
              <div className="action-icon revenue">💰</div>
              <div className="metric-info">
                <span>Total Revenue</span>
                <p className="metric-value positive">₹{stats.totalRevenue?.toLocaleString() || 0}</p>
              </div>
            </div>
          )}

          {!isTechnician && (
            <div className="action-card metric-card" onClick={() => setActiveTab('Payments')}>
              <div className="action-icon collection">📈</div>
              <div className="metric-info">
                <span>Monthly Collection</span>
                <p className="metric-value info">₹{stats.monthlyCollection?.toLocaleString() || 0}</p>
              </div>
            </div>
          )}

          <div className={`action-card metric-card ${stats.renewalsDue > 0 ? 'clickable-metric' : ''}`}
               onClick={() => stats.renewalsDue > 0 && handleAction('Customers', 'renewals')}>
            <div className="action-icon due">⏳</div>
            <div className="metric-info">
              <span>Renewals Due</span>
              <p className="metric-value negative">{stats.renewalsDue || 0}</p>
            </div>
            {stats.renewalsDue > 0 && <div className="metric-tap-hint">Tap to view</div>}
          </div>

          <div className="action-card metric-card" onClick={() => setActiveTab('Customers')}>
            <div className="action-icon active">✅</div>
            <div className="metric-info">
              <span>Active Users</span>
              <p className="metric-value positive">{stats.activeUsers || 0}</p>
            </div>
          </div>

          <div className="action-card metric-card" onClick={() => setActiveTab('Customers')}>
            <div className="action-icon inactive">💤</div>
            <div className="metric-info">
              <span>Inactive Users</span>
              <p className="metric-value">{stats.inactiveUsers || 0}</p>
            </div>
          </div>

          <div className="action-card metric-card" onClick={() => setActiveTab('Customers')}>
            <div className="action-icon suspended">🚫</div>
            <div className="metric-info">
              <span>Suspended Users</span>
              <p className="metric-value warning">{stats.suspendedUsers || 0}</p>
            </div>
          </div>

          {!isTechnician && (
            <div className="action-card metric-card" onClick={() => setActiveTab('Reports')}>
              <div className="action-icon suspended">📉</div>
              <div className="metric-info">
                <span>Churn Rate</span>
                <p className="metric-value danger">{stats.churnRate || 0}%</p>
              </div>
            </div>
          )}

          {!isTechnician && (
            <div className="action-card metric-card" onClick={() => setActiveTab('Payments')}>
              <div className="action-icon projected">📑</div>
              <div className="metric-info">
                <span>Projected (30d)</span>
                <p className="metric-value info">₹{stats.projectedRevenue?.toLocaleString() || 0}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="section-group">
        <h2 className="section-title">Quick Operations</h2>
        <div className="quick-actions-grid">
          <div className="action-card" onClick={() => handleAction('Customers', 'add')}>
            <div className="action-icon" style={{color: 'var(--primary)'}}>👤</div>
            <span>Add Customer</span>
          </div>
          <div className="action-card" onClick={() => setShowRenewalsModal(true)}>
            <div className="action-icon" style={{color: 'var(--negative)'}}>♻️</div>
            <span>Renew Plans</span>
          </div>
          <div className="action-card" onClick={() => setActiveTab('Payments')}>
            <div className="action-icon" style={{color: 'var(--success)'}}>💳</div>
            <span>Record Payment</span>
          </div>
          {!isTechnician ? (
            <div className="action-card" onClick={() => setActiveTab('Reports')}>
              <div className="action-icon" style={{color: 'var(--info)'}}>📊</div>
              <span>View Reports</span>
            </div>
          ) : (
            <div className="action-card" onClick={() => setActiveTab('Discrepancy')}>
              <div className="action-icon" style={{color: 'var(--warning)'}}>🔍</div>
              <span>Search Discrepancy</span>
            </div>
          )}
        </div>
      </div>

      <div className="charts-grid-top-restructured">
        <div className="chart-container glass-panel">
          <h3>
              <i className="ri-calendar-todo-line"></i>
              Daily Collection Dues
          </h3>
          <div className="chart-wrapper">
            <div className="collection-dues-list" style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {stats.dailyDues && stats.dailyDues.length > 0 ? (
                stats.dailyDues.map((due, idx) => (
                  <div key={idx} className="due-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid var(--surface-border)' }}>
                    <span style={{ fontWeight: 600 }}>{due.date}</span>
                    <span className="text-negative" style={{ fontWeight: 700 }}>₹{due.amount.toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <div className="empty-state-mini">
                  <p>No collections due for the upcoming days.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="chart-container glass-panel">
          <h3>
              <i className="ri-history-line"></i>
              Recent Customers
          </h3>
          <div className="chart-wrapper">
            <div className="activity-list">
              {stats.recentCustomers?.map(cust => (
                <div key={cust.id} className="activity-item">
                  <div className="activity-main">
                    <span className="activity-title">{cust.name}</span>
                    <span className="activity-sub">{cust.customer_id} • {cust.package?.name}</span>
                  </div>
                  <div className="activity-meta">
                    <span className={`status-badge ${cust.status.toLowerCase()}`}>{cust.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="charts-grid-bottom" style={{ marginTop: '2.5rem' }}>
        <div className="chart-container glass-panel">
          <h3>
              <i className="ri-map-pin-2-line"></i>
              Customer Distribution by Area
          </h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.areaAnalytics} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={120}
                  tick={{fill: 'var(--text-muted)', fontSize: 12}}
                />
                <Tooltip 
                  contentStyle={{ 
                      backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                      border: '1px solid var(--surface-border)', 
                      borderRadius: '12px',
                      color: 'white'
                  }}
                />
                <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} name="Customers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-container glass-panel">
          <h3>
              <i className="ri-bank-card-line"></i>
              Latest Collections
          </h3>
          <div className="chart-wrapper">
            <div className="activity-list">
              {stats.recentPayments?.map(pay => (
                <div key={pay.id} className="activity-item">
                  <div className="activity-main">
                    <span className="activity-title">₹{pay.amount.toLocaleString()}</span>
                    <span className="activity-sub">{pay.customer?.name} • {pay.payment_method}</span>
                  </div>
                  <div className="activity-meta">
                    <span className="activity-sub">{new Date(pay.payment_date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!isTechnician && (
        <div className="charts-grid-bottom">
          <div className="chart-container glass-panel">
            <h3>
                <i className="ri-bar-chart-box-line"></i>
                Revenue Velocity
            </h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stats.monthlyData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                          backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                          border: '1px solid var(--surface-border)', 
                          borderRadius: '12px',
                          color: 'white'
                      }}
                    />
                    <Bar dataKey="uv" fill="url(#colorRevenue)" radius={[4, 4, 0, 0]} barSize={24} name="Revenue" />
                  </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-container glass-panel">
            <h3>
                <i className="ri-medal-fill"></i>
                Popular Packages
            </h3>
            <div className="package-rank-list">
              {(stats.topPackages && stats.topPackages.length > 0) ? (
                stats.topPackages.map((pkg, idx) => (
                  <div key={idx} className="rank-item">
                    <span className="rank-badge">{idx + 1}</span>
                    <span className="rank-name">{pkg.name}</span>
                    <span className="rank-count">{pkg.value} users</span>
                    <div className="rank-progress-bg">
                        <div 
                            className="rank-progress-fill" 
                            style={{ 
                              width: `${stats.topPackages[0].value > 0 ? (pkg.value / stats.topPackages[0].value) * 100 : 0}%` 
                            }}
                        ></div>
                    </div>
                  </div>
                ))
              ) : (
                  <div className="empty-state-mini">
                      <p>No active package data available yet.</p>
                  </div>
              )}
            </div>
          </div>

          <div className="chart-container glass-panel">
            <h3>
                <i className="ri-map-pin-2-line"></i>
                Revenue per Area
            </h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.revenuePerArea} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    width={100}
                    tick={{fill: 'var(--text-muted)', fontSize: 12}}
                  />
                  <Tooltip 
                    contentStyle={{ 
                        backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                        border: '1px solid var(--surface-border)', 
                        borderRadius: '12px',
                        color: 'white'
                    }}
                    formatter={(value) => `₹${value.toLocaleString()}`}
                  />
                  <Bar dataKey="value" fill="var(--info)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {showRenewalsModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-slide-up" style={{ maxWidth: '700px' }}>
            <button className="btn-close" onClick={() => setShowRenewalsModal(false)}>
                <i className="ri-close-line"></i>
            </button>
            <div className="modal-header">
              <h3 className="text-gradient">Customers Requiring Renewal</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>List of active/suspended users whose billing date has passed.</p>
            </div>
            
            <div className="table-responsive" style={{ marginTop: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Mobile</th>
                            <th>Package</th>
                            <th className="text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.renewalsDueList?.map(cust => (
                            <tr key={cust.id}>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{cust.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{cust.customer_id}</div>
                                </td>
                                <td style={{ fontFamily: 'monospace' }}>{cust.mobile}</td>
                                <td>{cust.package?.name || 'Standard'}</td>
                                <td className="text-right" style={{ color: parseFloat(cust.balance) > 0 ? 'var(--negative)' : 'inherit', fontWeight: 700 }}>
                                    ₹{parseFloat(cust.balance).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'center' }}>
                <button className="btn-primary" onClick={() => setShowRenewalsModal(false)}>
                    Close List
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;
