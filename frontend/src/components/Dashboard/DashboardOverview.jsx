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
  Cell
} from 'recharts';
import './DashboardOverview.css';

const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL}`;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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
          <h1 className="page-title">Network Analytics</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
              Real-time performance metrics and revenue distribution.
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
          <div className="kpi-icon yearly">
            <i className="ri-safe-2-line"></i>
          </div>
          <div className="kpi-info">
            <h3>Annual Revenue</h3>
            <p className="kpi-value positive">₹ {stats.yearlyCollection?.toLocaleString() || 0}</p>
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

      <div className="charts-grid">
        <div className="chart-container glass-panel">
          <h3>
              <i className="ri-bar-chart-groupped-line"></i>
              Revenue Velocity (Last 6 Months)
          </h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500}} 
                    dy={10}
                />
                <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500}} 
                />
                <Tooltip 
                  cursor={{fill: 'rgba(0,0,0,0.02)'}}
                  contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid var(--surface-border)', 
                      borderRadius: '12px', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      padding: '12px'
                  }}
                  itemStyle={{ color: 'var(--primary)', fontWeight: 700 }}
                  labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase' }}
                />
                <Bar dataKey="uv" fill="var(--primary)" radius={[6, 6, 0, 0]} name="Revenue" barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-container glass-panel">
          <h3>
              <i className="ri-pie-chart-2-line"></i>
              Node Distribution by Area
          </h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={stats.areaDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}) => `${name}`}
                >
                  {stats.areaDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid var(--surface-border)', 
                      borderRadius: '12px', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
