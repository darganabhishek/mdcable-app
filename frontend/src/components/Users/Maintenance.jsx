import { useState } from 'react';
import axios from 'axios';
import '../Customers/Customers.css';

const Maintenance = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSyncBilling = async () => {
        if (!window.confirm('This will recalculate all customer billing cycles based on their installation dates and payment history. This action cannot be undone. Proceed?')) {
            return;
        }

        setLoading(true);
        setMessage({ type: 'info', text: 'Synchronization in progress. Please do not close the window...' });

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/admin/sync-billing`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage({ type: 'success', text: res.data.message });
        } catch (error) {
            console.error('Sync failed', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to synchronize billing dates.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="module-container">
            <div className="module-header">
                <div>
                    <h2>System Maintenance</h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Administrative tools for data integrity and system health.</p>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', marginTop: '1.5rem', maxWidth: '800px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                    <div style={{ fontSize: '2.5rem', background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '12px', color: 'var(--primary)' }}>
                        <i className="ri-refresh-line"></i>
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>Sync Billing Cycles</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                            Automatically recalculates the "Next Billing Cycle" date for ALL customers. 
                            Uses the installation date as the starting point and advances the cycle for every full month of completed payments recorded in the system.
                        </p>
                        <button 
                            className="btn-primary" 
                            style={{ marginTop: '1.5rem' }} 
                            onClick={handleSyncBilling}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Recalculate & Sync All Cycles'}
                        </button>
                    </div>
                </div>

                {message && (
                    <div className={`animate-fade-in`} style={{ 
                        marginTop: '2rem', 
                        padding: '1rem', 
                        borderRadius: '8px', 
                        background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : message.type === 'error' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        color: message.type === 'success' ? 'var(--success)' : message.type === 'error' ? 'var(--danger)' : 'var(--info)',
                        border: `1px solid ${message.type === 'success' ? 'var(--success)' : message.type === 'error' ? 'var(--danger)' : 'var(--info)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <i className={message.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'}></i>
                        <span>{message.text}</span>
                    </div>
                )}
            </div>

            <div className="glass-panel" style={{ padding: '2rem', marginTop: '1.5rem', maxWidth: '800px', opacity: 0.7 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                    <div style={{ fontSize: '2.5rem', background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '12px', color: 'var(--warning)' }}>
                        <i className="ri-database-2-line"></i>
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>Database Integrity Check</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                            Future tool: Scan for orphaned records, invalid UUIDs, or inconsistent customer data.
                        </p>
                        <button className="btn-secondary" style={{ marginTop: '1.5rem' }} disabled>Coming Soon</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Maintenance;
