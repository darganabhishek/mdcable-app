import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CustomersList from '../components/Customers/CustomersList';
import PaymentsList from '../components/Payments/PaymentsList';
import Reports from '../components/Reports/Reports';
import UsersList from '../components/Users/UsersList';
import RolePermissions from '../components/Users/RolePermissions';
import PackagesList from '../components/Packages/PackagesList'; // Added PackagesList import
import DashboardOverview from '../components/Dashboard/DashboardOverview';
import './Dashboard.css';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Overview');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="dashboard-layout">
            <aside className="sidebar glass-panel">
                <div className="sidebar-header">
                    <h2 className="text-gradient">M.D. Cable</h2>
                </div>
                <nav className="nav-menu">
                    <button 
                      className={`nav-item ${activeTab === 'Overview' ? 'active' : ''}`}
                      onClick={() => setActiveTab('Overview')}
                    >
                        <i className="ri-dashboard-3-line"></i>
                        <span>Dashboard</span>
                    </button>
                    <button 
                      className={`nav-item ${activeTab === 'Customers' ? 'active' : ''}`}
                      onClick={() => setActiveTab('Customers')}
                    >
                        <i className="ri-user-heart-line"></i>
                        <span>Customers</span>
                    </button>
                    <button 
                      className={`nav-item ${activeTab === 'Packages' ? 'active' : ''}`}
                      onClick={() => setActiveTab('Packages')}
                    >
                        <i className="ri-box-3-line"></i>
                        <span>Packages</span>
                    </button>
                    <button 
                      className={`nav-item ${activeTab === 'Payments' ? 'active' : ''}`}
                      onClick={() => setActiveTab('Payments')}
                    >
                        <i className="ri-bank-card-line"></i>
                        <span>Payments</span>
                    </button>
                    <button 
                      className={`nav-item ${activeTab === 'Reports' ? 'active' : ''}`}
                      onClick={() => setActiveTab('Reports')}
                    >
                        <i className="ri-bar-chart-box-line"></i>
                        <span>Reports</span>
                    </button>
                    {user?.role === 'Super Admin' && (
                        <>
                            <button 
                              className={`nav-item ${activeTab === 'Access Control' ? 'active' : ''}`}
                              onClick={() => setActiveTab('Access Control')}
                            >
                                <i className="ri-shield-user-line"></i>
                                <span>Access Control</span>
                            </button>
                            <button 
                              className={`nav-item ${activeTab === 'Permissions' ? 'active' : ''}`}
                              onClick={() => setActiveTab('Permissions')}
                            >
                                <i className="ri-lock-password-line"></i>
                                <span>Role Permissions</span>
                            </button>
                        </>
                    )}
                </nav>
            </aside>
            <main className="main-content">
                <header className="topbar">
                    <div className="user-info">
                        <i className="ri-user-6-fill"></i>
                        Welcome, <strong>{user?.name}</strong>
                    </div>
                    <button onClick={handleLogout} className="btn-logout">
                        <i className="ri-logout-box-r-line"></i>
                        Logout
                    </button>
                </header>
                <div className="content-area">
                    {activeTab === 'Overview' && <DashboardOverview />}
                    {activeTab === 'Customers' && <CustomersList />}
                    {activeTab === 'Packages' && <PackagesList />}
                    {activeTab === 'Payments' && <PaymentsList />}
                    {activeTab === 'Reports' && <Reports />}
                    {activeTab === 'Access Control' && <UsersList />}
                    {activeTab === 'Permissions' && <RolePermissions />}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
