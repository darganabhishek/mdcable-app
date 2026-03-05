import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CustomersList from '../components/Customers/CustomersList';
import PaymentsList from '../components/Payments/PaymentsList';
import Reports from '../components/Reports/Reports';
import UsersList from '../components/Users/UsersList';
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
                    <h2>M.D. Cable</h2>
                </div>
                <nav className="nav-menu">
                    <button 
                      className={`nav-item ${activeTab === 'Overview' ? 'active' : ''}`}
                      onClick={() => setActiveTab('Overview')}
                    >Dashboard</button>
                    <button 
                      className={`nav-item ${activeTab === 'Customers' ? 'active' : ''}`}
                      onClick={() => setActiveTab('Customers')}
                    >Customers</button>
                    <button 
                      className={`nav-item ${activeTab === 'Packages' ? 'active' : ''}`} // Added Packages tab
                      onClick={() => setActiveTab('Packages')}
                    >Packages</button>
                    <button 
                      className={`nav-item ${activeTab === 'Payments' ? 'active' : ''}`}
                      onClick={() => setActiveTab('Payments')}
                    >Payments</button>
                    <button 
                      className={`nav-item ${activeTab === 'Reports' ? 'active' : ''}`}
                      onClick={() => setActiveTab('Reports')}
                    >Reports</button>
                    {user?.role === 'Super Admin' && (
                        <button 
                          className={`nav-item ${activeTab === 'Access Control' ? 'active' : ''}`}
                          onClick={() => setActiveTab('Access Control')}
                        >Access Control</button>
                    )}
                </nav>
            </aside>
            <main className="main-content">
                <header className="topbar glass-panel">
                    <div className="user-info">
                        Welcome, <strong>{user?.name}</strong> ({user?.role})
                    </div>
                    <button onClick={handleLogout} className="btn-logout">Logout</button>
                </header>
                <div className="content-area animate-fade-in">
                    {activeTab === 'Overview' && (
                        <>
                            <DashboardOverview />
                        </>
                    )}
                    {activeTab === 'Customers' && <CustomersList />}
                    {activeTab === 'Packages' && <PackagesList />} {/* Added PackagesList component */}
                    {activeTab === 'Payments' && <PaymentsList />}
                    {activeTab === 'Reports' && <Reports />}
                    {activeTab === 'Access Control' && <UsersList />}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
