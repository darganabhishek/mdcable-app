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
import Maintenance from '../components/Users/Maintenance';
import ActivityLogs from './ActivityLogs';
import DiscrepancyList from '../components/Customers/DiscrepancyList';
import './Dashboard.css';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Overview');
    const [initialAction, setInitialAction] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className={`dashboard-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            <aside className={`sidebar glass-panel ${isSidebarOpen ? 'show' : ''}`}>
                <button className="mobile-close" onClick={() => setIsSidebarOpen(false)}>
                    <i className="ri-close-line"></i>
                </button>
                <div className="sidebar-header">
                    <h2 className="text-gradient">M.D. Cable Networks</h2>
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
                    {user?.role !== 'Technician' && (
                        <button 
                          className={`nav-item ${activeTab === 'Reports' ? 'active' : ''}`}
                          onClick={() => setActiveTab('Reports')}
                        >
                            <i className="ri-bar-chart-box-line"></i>
                            <span>Reports</span>
                        </button>
                    )}
                    {user?.role === 'Super Admin' && (
                        <>
                            <button 
                              className={`nav-item ${activeTab === 'Discrepancy Search' ? 'active' : ''}`}
                              onClick={() => setActiveTab('Discrepancy Search')}
                            >
                                <i className="ri-search-eye-line"></i>
                                <span>Discrepancy Search</span>
                            </button>
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
                            <button 
                              className={`nav-item ${activeTab === 'Maintenance' ? 'active' : ''}`}
                              onClick={() => setActiveTab('Maintenance')}
                            >
                                <i className="ri-tools-line"></i>
                                <span>System Maintenance</span>
                            </button>
                            <button 
                              className={`nav-item ${activeTab === 'Activity Logs' ? 'active' : ''}`}
                              onClick={() => setActiveTab('Activity Logs')}
                            >
                                <i className="ri-history-line"></i>
                                <span>Activity Logs</span>
                            </button>
                        </>
                    )}
                </nav>
            </aside>
            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
            <main className="main-content">
                <header className="topbar">
                    <button className="mobile-menu-toggle" onClick={() => setIsSidebarOpen(true)}>
                        <i className="ri-menu-2-line"></i>
                    </button>
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
                    {activeTab === 'Overview' && (
                        <DashboardOverview 
                            setActiveTab={setActiveTab} 
                            setInitialAction={setInitialAction} 
                        />
                    )}
                    {activeTab === 'Customers' && (
                        <CustomersList 
                            initialAction={initialAction} 
                            onActionComplete={() => setInitialAction(null)} 
                        />
                    )}
                    {activeTab === 'Packages' && <PackagesList />}
                    {activeTab === 'Payments' && <PaymentsList />}
                    {user?.role !== 'Technician' && activeTab === 'Reports' && <Reports />}
                    {activeTab === 'Access Control' && <UsersList />}
                    {activeTab === 'Permissions' && <RolePermissions />}
                    {activeTab === 'Maintenance' && <Maintenance />}
                    {activeTab === 'Activity Logs' && <ActivityLogs />}
                    {activeTab === 'Discrepancy Search' && <DiscrepancyList />}
                </div>
                <footer className="developer-footer">
                    Designed & Developed by <strong>Abhishek Dargan</strong>
                </footer>
            </main>
        </div>
    );
};

export default Dashboard;
