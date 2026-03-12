import { useState, useEffect } from 'react';
import axios from 'axios';
import './ActivityLogs.css';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/activity-logs`);
        setLogs(res.data);
      } catch (err) {
        console.error('Failed to fetch logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getActionColor = (action) => {
    if (action.includes('DELETE')) return 'var(--danger)';
    if (action.includes('CREATE') || action.includes('SYNC')) return 'var(--success)';
    if (action.includes('UPDATE')) return 'var(--warning)';
    if (action.includes('LOGIN')) return 'var(--primary)';
    return 'var(--text-main)';
  };

  const formatAction = (action) => {
    return action.replace(/_/g, ' ');
  };

  if (loading) return <div className="loading-state">Loading activity logs...</div>;

  return (
    <div className="module-container">
      <div className="module-header">
        <div>
          <h2>System Activity Logs</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Real-time monitoring of all user actions.</p>
        </div>
      </div>

      <div className="table-responsive glass-panel" style={{ marginTop: '1rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Target</th>
              <th>IP Address</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {new Date(log.createdAt).toLocaleString('en-IN')}
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600 }}>{log.user?.name || 'System'}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.user?.role}</span>
                  </div>
                </td>
                <td>
                  <span className="status-badge" style={{ 
                    background: 'transparent', 
                    border: `1px solid ${getActionColor(log.action)}`,
                    color: getActionColor(log.action),
                    fontSize: '0.75rem'
                  }}>
                    {formatAction(log.action)}
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem' }}>
                  {log.target_type ? `${log.target_type}: ` : ''}
                  <span style={{ fontWeight: 600 }}>{log.target_id || '-'}</span>
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.ip_address || '-'}</td>
                <td style={{ fontSize: '0.8rem' }}>
                    {log.details ? (
                        <div className="log-details-cell">
                            {Object.entries(log.details).map(([k, v]) => (
                                <span key={k} style={{ marginRight: '0.5rem' }}>
                                    <strong style={{ color: 'var(--primary)' }}>{k}:</strong> {v}
                                </span>
                            ))}
                        </div>
                    ) : '-'}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No logs recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLogs;
