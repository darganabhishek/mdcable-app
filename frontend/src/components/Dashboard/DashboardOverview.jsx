import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import './DashboardOverview.css';

const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL}`;

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const DashboardOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

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
          <h1 className="page-title">Business Intelligence Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
              Strategic growth metrics and revenue forecasting.
          </p>
        </div>
      </div>
      
      <div className="kpi-grid">
        <div className="kpi-card glass-panel">
          <div className="kpi-icon monthly">
            <i className="ri-hand-coin-line"></i>
          </div>
          <div className="kpi-info">
            <h3>Monthly Collections</h3>
            <p className="kpi-value positive">₹ {stats.monthlyCollection?.toLocaleString() || 0}</p>
          </div>
        </div>
        <div className="kpi-card glass-panel">
          <div className="kpi-icon project">
            <i className="ri-funds-line"></i>
          </div>
          <div className="kpi-info">
            <h3>Projected Revenue (30d)</h3>
            <p className="kpi-value info">₹ {stats.projectedRevenue?.toLocaleString() || 0}</p>
          </div>
        </div>
        <div className="kpi-card glass-panel">
          <div className="kpi-icon due">
            <i className="ri-alarm-warning-line"></i>
          </div>
          <div className="kpi-info">
            <h3>Outstanding Dues</h3>
            <p className="kpi-value negative">₹ {stats.totalPaymentDue?.toLocaleString() || 0}</p>
          </div>
        </div>
      </div>

      <div className="charts-grid-top">
        <div className="chart-container glass-panel main-chart">
          <h3>
              <i className="ri-line-chart-line"></i>
              New Customer Acquisition Trend
          </h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={stats.growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: 'var(--text-muted)', fontSize: 12}} 
                />
                <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: 'var(--text-muted)', fontSize: 12}} 
                />
                <Tooltip 
                  contentStyle={{ 
                      backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                      border: '1px solid var(--surface-border)', 
                      borderRadius: '12px',
                      color: 'white'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line 
                    type="monotone" 
                    dataKey="customers" 
                    stroke="var(--primary)" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: 'var(--primary)', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                    name="New Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-container glass-panel">
          <h3>
              <i className="ri-pie-chart-2-line"></i>
              Service Revenue Mix
          </h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats.serviceMix}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {stats.serviceMix?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="charts-grid-bottom">
        <div className="chart-container glass-panel">
          <h3>
              <i className="ri-bar-chart-box-line"></i>
              Revenue Velocity
          </h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="uv" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={24} />
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
      </div>
    </div>
  );
};

export default DashboardOverview;
