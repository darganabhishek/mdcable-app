import { useState, useEffect } from 'react';
import axios from 'axios';
import '../Customers/Customers.css';
import './Reports.css';

const Reports = () => {
  const [reportType, setReportType] = useState('collections');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of current month
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      switch(reportType) {
        case 'collections': endpoint = '/reports/collections'; break;
        case 'renewals': endpoint = '/reports/renewals'; break;
        case 'staff': endpoint = '/reports/staff-collections'; break;
        case 'churn': endpoint = '/reports/churn-analysis'; break;
        default: endpoint = '/reports/collections';
      }
      const res = await axios.get(`${import.meta.env.VITE_API_URL}${endpoint}`, { params: filters });
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch report', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setData(null);
    fetchReport();
  }, [reportType]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="module-container">
      <div className="module-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1.5rem' }}>
        <div>
          <h2>Business Intelligence</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Analyze your network performance and revenue metrics.</p>
        </div>
        <div className="report-tabs">
          <button 
            className={`tab-btn ${reportType === 'collections' ? 'active' : ''}`}
            onClick={() => setReportType('collections')}
          >
            <i className="ri-money-dollar-circle-line" style={{ marginRight: '0.5rem' }}></i>
            Revenue Collections
          </button>
          <button 
            className={`tab-btn ${reportType === 'renewals' ? 'active' : ''}`}
            onClick={() => setReportType('renewals')}
          >
            <i className="ri-refresh-line" style={{ marginRight: '0.5rem' }}></i>
            Subscription Renewals
          </button>
          <button 
            className={`tab-btn ${reportType === 'staff' ? 'active' : ''}`}
            onClick={() => setReportType('staff')}
          >
            <i className="ri-group-line" style={{ marginRight: '0.5rem' }}></i>
            Staff Leaderboard
          </button>
          <button 
            className={`tab-btn ${reportType === 'churn' ? 'active' : ''}`}
            onClick={() => setReportType('churn')}
          >
            <i className="ri-user-unfollow-line" style={{ marginRight: '0.5rem' }}></i>
            Churn Analysis
          </button>
        </div>
      </div>

      <div className="filters-bar glass-panel">
        <div className="filter-group">
          <label>Starting Period</label>
          <div className="input-with-icon">
              <i className="ri-calendar-event-line"></i>
              <input type="date" name="startDate" className="input-control" value={filters.startDate} onChange={handleFilterChange} />
          </div>
        </div>
        <div className="filter-group">
          <label>Ending Period</label>
          <div className="input-with-icon">
              <i className="ri-calendar-check-line"></i>
              <input type="date" name="endDate" className="input-control" value={filters.endDate} onChange={handleFilterChange} />
          </div>
        </div>
        <button className="btn-primary filter-btn" onClick={fetchReport}>
            <i className="ri-flashlight-line" style={{ marginRight: '0.5rem' }}></i>
            Generate Analytics
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Synthesizing data models...</div>
      ) : data ? (
        <div className="report-results animate-fade-in">
            {reportType === 'collections' && (
                <div className="summary-cards">
                    <div className="stat-card glass-panel highlight-card">
                        <h3>Total Gross Revenue</h3>
                        <p className="stat-value">₹ {parseFloat(data.totalCollected).toLocaleString()}</p>
                    </div>
                     <div className="stat-card glass-panel">
                        <h3>Transaction Volume</h3>
                        <p className="stat-value">{data.count} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>Payments</span></p>
                    </div>
                </div>
            )}
            
            {reportType === 'renewals' && (
                <div className="summary-cards">
                    <div className="stat-card glass-panel highlight-card">
                        <h3>Total Renewals Processed</h3>
                        <p className="stat-value">{data.count}</p>
                    </div>
                </div>
            )}

            {reportType === 'staff' && (
                <div className="summary-cards">
                    <div className="stat-card glass-panel highlight-card">
                        <h3>Top Performer</h3>
                        <p className="stat-value">{data[0]?.staff_name || 'N/A'}</p>
                    </div>
                </div>
            )}

            {reportType === 'churn' && (
                <div className="summary-cards">
                    <div className="stat-card glass-panel highlight-card" style={{ borderColor: 'var(--danger)' }}>
                        <h3>Churn Rate</h3>
                        <p className="stat-value" style={{ color: 'var(--danger)' }}>{data.churnRate}%</p>
                    </div>
                    <div className="stat-card glass-panel">
                        <h3>At-Risk Customers</h3>
                        <p className="stat-value">{data.atRiskCount}</p>
                    </div>
                </div>
            )}

            <div className="table-responsive">
                <table className="data-table mobile-card-view">
                    <thead>
                        <tr>
                            {reportType === 'collections' ? (
                                <>
                                    <th>Settlement Date</th>
                                    <th>Customer Profile</th>
                                    <th>Amount Paid</th>
                                    <th>Field Collector</th>
                                </>
                            ) : reportType === 'renewals' ? (
                                <>
                                    <th>Process ID</th>
                                    <th>Subscribed Customer</th>
                                    <th>Previous Expiry</th>
                                    <th>Extended To</th>
                                    <th>Current Logic</th>
                                </>
                            ) : reportType === 'staff' ? (
                                <>
                                    <th>Staff Member</th>
                                    <th>Today's Collection</th>
                                    <th>Monthly Collection</th>
                                    <th>Total Collections Done</th>
                                </>
                            ) : (
                                <>
                                    <th>At-Risk Customer</th>
                                    <th>Last Billing Cycle</th>
                                    <th>Due For</th>
                                    <th>Contact Info</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {reportType === 'collections' && data.payments?.map(item => (
                            <tr key={item.id}>
                                <td data-label="Date">
                                    <div className="user-cell">
                                        <div className="user-avatar" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--info)' }}>
                                            <i className="ri-calendar-2-line"></i>
                                        </div>
                                        {new Date(item.payment_date).toLocaleDateString()}
                                    </div>
                                </td>
                                <td data-label="Customer"><strong>{item.customer?.name}</strong></td>
                                <td data-label="Amount" className="amount-col">₹ {parseFloat(item.amount).toLocaleString()}</td>
                                <td data-label="Collector">
                                    <div className="collector-badge">
                                        <i className="ri-user-star-line"></i>
                                        {item.collector?.name}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {reportType === 'renewals' && data.renewals?.map(item => (
                            <tr key={item.id}>
                                <td data-label="Ref" className="text-sm text-muted">#RES-{item.id.substring(0,6)}</td>
                                <td data-label="Customer">
                                    <div className="user-cell">
                                        <div className="user-avatar" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                                            <i className="ri-user-received-2-line"></i>
                                        </div>
                                        <strong>{item.customer?.name}</strong>
                                    </div>
                                </td>
                                <td data-label="Prev Expiry">{new Date(item.previous_expiry).toLocaleDateString()}</td>
                                <td data-label="New Expiry"><span style={{ fontWeight: 700, color: 'var(--success)' }}>{new Date(item.new_expiry).toLocaleDateString()}</span></td>
                                <td data-label="Logic">
                                    <span className={`status-badge status-${item.status.toLowerCase()}`}>
                                        {item.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {reportType === 'staff' && Array.isArray(data) && data.map((item, idx) => (
                          <tr key={idx}>
                               <td data-label="Staff">
                                   <div className="user-cell">
                                       <div className="user-avatar" style={{ 
                                         background: idx === 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(148, 163, 184, 0.1)', 
                                         color: idx === 0 ? 'var(--warning)' : 'var(--text-muted)' 
                                       }}>
                                           {idx === 0 ? <i className="ri-medal-fill"></i> : <i className="ri-user-line"></i>}
                                       </div>
                                       <strong>{item.staff_name}</strong>
                                   </div>
                               </td>
                               <td data-label="Today" style={{ color: 'var(--success)', fontWeight: 700 }}>₹{parseFloat(item.today || 0).toLocaleString()}</td>
                               <td data-label="Monthly" style={{ fontWeight: 700 }}>₹{parseFloat(item.monthly || 0).toLocaleString()}</td>
                               <td data-label="Total">{item.total_count}</td>
                          </tr>
                        ))}
                        {reportType === 'churn' && data.customers?.map(item => {
                          const lastDate = new Date(item.next_billing_date);
                          const daysOverdue = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
                          return (
                            <tr key={item.id}>
                                <td data-label="Customer">
                                    <div className="user-cell">
                                        <div className="user-avatar" style={{ background: 'rgba(251, 113, 133, 0.1)', color: 'var(--danger)' }}>
                                            <i className="ri-error-warning-line"></i>
                                        </div>
                                        <strong>{item.name}</strong>
                                    </div>
                                </td>
                                <td data-label="Last Billing">{lastDate.toLocaleDateString()}</td>
                                <td data-label="Due For"><span className="status-badge status-suspended">{daysOverdue} days overdue</span></td>
                                <td data-label="Contact">{item.mobile}</td>
                            </tr>
                          );
                        })}
                        {((reportType === 'collections' && data.payments?.length === 0) || 
                          (reportType === 'renewals' && data.renewals?.length === 0) ||
                          (reportType === 'staff' && data?.length === 0) ||
                          (reportType === 'churn' && data.customers?.length === 0)) && (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-muted">No tactical data found for the selected period.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      ) : null}
    </div>
  );
};

export default Reports;
