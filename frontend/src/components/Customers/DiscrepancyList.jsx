import { useState, useEffect } from 'react';
import axios from 'axios';
import CustomerForm from './CustomerForm';
import './Customers.css';

const DiscrepancyList = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [discrepancies, setDiscrepancies] = useState([]);
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);

    const fetchCustomers = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/customers`);
            setCustomers(res.data);
            findDiscrepancies(res.data);
        } catch (error) {
            console.error('Failed to fetch customers for discrepancy check', error);
        } finally {
            setLoading(false);
        }
    };

    const findDiscrepancies = (data) => {
        const dupGroups = [];
        const mobileMap = {};
        const nameMap = {};
        const addressMap = {};

        data.forEach(cust => {
            if (cust.mobile) {
                if (!mobileMap[cust.mobile]) mobileMap[cust.mobile] = [];
                mobileMap[cust.mobile].push(cust);
            }
            const cleanName = cust.name.trim().toLowerCase();
            if (cleanName) {
                if (!nameMap[cleanName]) nameMap[cleanName] = [];
                nameMap[cleanName].push(cust);
            }
            const house = (cust.house_no || '').trim().toLowerCase();
            const locality = (cust.locality || '').trim().toLowerCase();
            if (house && locality) {
                const addrKey = `${house}|${locality}`;
                if (!addressMap[addrKey]) addressMap[addrKey] = [];
                addressMap[addrKey].push(cust);
            }
        });

        const addGroups = (map, type) => {
            Object.keys(map).forEach(key => {
                if (map[key].length > 1) {
                    dupGroups.push({ type, key, members: map[key] });
                }
            });
        };

        addGroups(mobileMap, 'Duplicate Mobile');
        addGroups(nameMap, 'Identical Name');
        addGroups(addressMap, 'Same Address');
        setDiscrepancies(dupGroups.sort((a, b) => a.type.localeCompare(b.type)));
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this customer? It will be removed from the entire system.')) {
            try {
                await axios.delete(`${import.meta.env.VITE_API_URL}/customers/${id}`);
                setSelectedCustomers(prev => prev.filter(item => item !== id));
                fetchCustomers();
            } catch (error) {
                console.error('Failed to delete customer from discrepancy view', error);
            }
        }
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`Are you sure you want to delete ${selectedCustomers.length} selected customers? This action is permanent.`)) {
            try {
                await axios.post(`${import.meta.env.VITE_API_URL}/customers/bulk-delete`, { ids: selectedCustomers });
                setSelectedCustomers([]);
                fetchCustomers();
            } catch (error) {
                console.error('Failed to bulk delete customers', error);
            }
        }
    };

    const handleSelectToggle = (id) => {
        setSelectedCustomers(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const openEditModal = (customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const toTitleCase = (str) => {
        if (!str || str.toLowerCase() === 'null') return '';
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    if (loading) return <div className="loading-state">Scanning for duplicates...</div>;

    return (
        <div className="module-container">
            <div className="module-header">
                <div>
                    <h2 style={{ marginBottom: '0.25rem' }}>Discrepancy Registry</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Identifying potential pilferage through duplicate connection detection.</p>
                </div>
                <div className="action-buttons">
                    {selectedCustomers.length > 0 && (
                        <button className="btn-bulk-delete animate-fade-in" onClick={handleBulkDelete}>
                            <i className="ri-delete-bin-line"></i>
                            Delete Selected ({selectedCustomers.length})
                        </button>
                    )}
                    <button className="btn-secondary" onClick={fetchCustomers}>
                        <i className="ri-refresh-line"></i>
                        Re-scan Data
                    </button>
                </div>
            </div>

            {discrepancies.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem' }}>
                    <div style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '1rem', opacity: 0.5 }}>
                        <i className="ri-shield-check-line"></i>
                    </div>
                    <h3>No Discrepancies Found</h3>
                    <p style={{ color: 'var(--text-muted)' }}>The system scanned all active connections and found no obvious duplicates.</p>
                </div>
            ) : (
                <div className="discrepancy-grid">
                    {discrepancies.map((group, idx) => (
                        <div key={idx} className="glass-panel animate-slide-up" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                            <div className="group-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--surface-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span className="status-badge status-active" style={{ fontSize: '0.7rem' }}>{group.type}</span>
                                    <strong style={{ fontSize: '1.1rem' }}>
                                        {group.type === 'Same Address' ? group.key.replace('|', ', ') : group.key}
                                    </strong>
                                </div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{group.members.length} Connections Found</span>
                            </div>
                            
                            <div className="table-responsive" style={{ padding: '0.5rem' }}>
                                <table className="data-table" style={{ background: 'transparent' }}>
                                    <tbody>
                                        {group.members.map(cust => (
                                            <tr key={cust.id} className={selectedCustomers.includes(cust.id) ? 'selected-row' : ''}>
                                                <td style={{ width: '40px' }}>
                                                    <input 
                                                        type="checkbox" 
                                                        className="custom-checkbox"
                                                        checked={selectedCustomers.includes(cust.id)}
                                                        onChange={() => handleSelectToggle(cust.id)}
                                                    />
                                                </td>
                                                <td style={{ fontWeight: 800, color: 'var(--primary)', width: '120px' }}>{cust.customer_id}</td>
                                                <td>
                                                    <div className="user-cell">
                                                        <div className="user-avatar" style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}>{cust.name[0]}</div>
                                                        <span style={{ fontWeight: 600 }}>{toTitleCase(cust.name)}</span>
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: '0.85rem' }}>{cust.mobile}</td>
                                                <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    {cust.house_no}, {cust.locality}
                                                </td>
                                                <td>
                                                    <span className={`status-badge status-${cust.status.toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                                                        {cust.status}
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <div className="action-buttons justify-end">
                                                        <button className="btn-action edit" onClick={() => openEditModal(cust)} title="Investigate Profile">
                                                            <i className="ri-external-link-line"></i>
                                                        </button>
                                                        <button className="btn-action delete" onClick={() => handleDelete(cust.id)} title="Delete Duplicate">
                                                            <i className="ri-delete-bin-line"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <CustomerForm 
                    customer={editingCustomer}
                    onClose={() => setIsModalOpen(false)}
                    onSave={() => {
                        setIsModalOpen(false);
                        fetchCustomers();
                    }}
                />
            )}
        </div>
    );
};

export default DiscrepancyList;
