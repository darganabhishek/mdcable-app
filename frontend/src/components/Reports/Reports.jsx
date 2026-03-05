import { useState, useEffect } from 'react';
import axios from 'axios';
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
      const endpoint = reportType === 'collections' ? '/reports/collections' : '/reports/renewals';
      const res = await axios.get(`${import.meta.env.VITE_API_URL}${endpoint}`, { params: filters });
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch report', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]); // Re-fetch when switching tabs, but let user manually fetch when changing dates

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="module-container animate-fade-in">
      <div className="module-header report-header">
        <h2>Reports & Analytics</h2>
        <div className="report-tabs">
          <button 
            className={`tab-btn ${reportType === 'collections' ? 'active' : ''}`}
            onClick={() => setReportType('collections')}
          >
            Collections
          </button>
          <button 
            className={`tab-btn ${reportType === 'renewals' ? 'active' : ''}`}
            onClick={() => setReportType('renewals')}
          >
            Renewals
          </button>
        </div>
      </div>

      <div className="filters-bar glass-panel">
        <div className="filter-group">
          <label>Start Date</label>
          <input type="date" name="startDate" className="input-control" value={filters.startDate} onChange={handleFilterChange} />
        </div>
        <div className="filter-group">
          <label>End Date</label>
          <input type="date" name="endDate" className="input-control" value={filters.endDate} onChange={handleFilterChange} />
        </div>
        <button className="btn-primary filter-btn" onClick={fetchReport}>Generate Report</button>
      </div>

      {loading ? (
        <div className="loading-state">Generating report...</div>
      ) : data ? (
        <div className="report-results">
            {reportType === 'collections' && (
                <div className="summary-cards">
                    <div className="stat-card glass-panel highlight-card">
                        <h3>Total Collected</h3>
                        <p className="stat-value">₹ {data.totalCollected}</p>
                    </div>
                     <div className="stat-card glass-panel">
                        <h3>Transactions Count</h3>
                        <p className="stat-value">{data.count}</p>
                    </div>
                </div>
            )}
            
            {reportType === 'renewals' && (
                 <div className="summary-cards">
                    <div className="stat-card glass-panel highlight-card">
                        <h3>Total Renewals</h3>
                        <p className="stat-value">{data.count}</p>
                    </div>
                </div>
            )}

            <div className="table-responsive glass-panel mt-4">
                <table className="data-table">
                    <thead>
                        <tr>
                            {reportType === 'collections' ? (
                                <>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Amount</th>
                                    <th>Collected By</th>
                                </>
                            ) : (
                                <>
                                    <th>Renewal ID</th>
                                    <th>Customer</th>
                                    <th>Old Expiry</th>
                                    <th>New Expiry</th>
                                    <th>Status</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {reportType === 'collections' && data.payments?.map(item => (
                            <tr key={item.id}>
                                <td>{new Date(item.payment_date).toLocaleDateString()}</td>
                                <td>{item.customer?.name}</td>
                                <td className="amount-col">₹ {item.amount}</td>
                                <td>{item.collector?.name}</td>
                            </tr>
                        ))}
                        {reportType === 'renewals' && data.renewals?.map(item => (
                            <tr key={item.id}>
                                <td className="text-sm text-muted">{item.id.substring(0,8)}...</td>
                                <td>{item.customer?.name}</td>
                                <td>{new Date(item.previous_expiry).toLocaleDateString()}</td>
                                <td>{new Date(item.new_expiry).toLocaleDateString()}</td>
                                <td>
                                    <span className={`status-badge status-${item.status.toLowerCase()}`}>
                                        {item.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {(data.payments?.length === 0 || data.renewals?.length === 0) && (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-muted">No data found for the selected period.</td>
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
