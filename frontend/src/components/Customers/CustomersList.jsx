import { useState, useEffect } from 'react';
import axios from 'axios';
import CustomerForm from './CustomerForm';
import BulkImport from './BulkImport';
import './Customers.css';

const CustomersList = () => {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState([]);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/customers`);
      setCustomers(res.data);
    } catch (error) {
      console.error('Failed to fetch customers', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.mobile && c.mobile.includes(searchQuery)) ||
      (c.customer_id && c.customer_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.locality && c.locality.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesService = serviceTypeFilter === 'All' || c.service_type === serviceTypeFilter;

    return matchesSearch && matchesStatus && matchesService;
  });

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer record?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/customers/${id}`);
        setSelectedCustomers(prev => prev.filter(item => item !== id));
        fetchCustomers();
      } catch (error) {
        console.error('Failed to delete customer', error);
      }
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    } else {
      setSelectedCustomers([]);
    }
  };

  const handleSelectToggle = (id) => {
    setSelectedCustomers(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedCustomers.length} selected customers? This action cannot be undone.`)) {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/customers/bulk-delete`, { ids: selectedCustomers });
        setSelectedCustomers([]);
        fetchCustomers();
      } catch (error) {
        console.error('Failed to bulk delete customers', error);
      }
    }
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) return <div className="loading-state">Loading users...</div>;

  return (
    <div className="module-container">
      <div className="module-header">
        <div>
          <h2 style={{ marginBottom: '0.25rem' }}>Customer Base</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage and monitor your subscriber network.</p>
        </div>
        <div className="action-buttons">
            {selectedCustomers.length > 0 && (
              <button 
                  className="btn-action delete" 
                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.4rem 1rem', border: '1px solid rgba(239, 68, 68, 0.2)' }} 
                  onClick={handleBulkDelete}
              >
                  <i className="ri-delete-bin-line"></i>
                  Delete Selected ({selectedCustomers.length})
              </button>
            )}
            <button className="btn-secondary" onClick={() => setIsBulkModalOpen(true)}>
                <i className="ri-file-upload-line"></i>
                Bulk Import
            </button>
            <button className="btn-primary btn-add" onClick={openAddModal}>
                <i className="ri-add-line"></i>
                New Customer
            </button>
        </div>
      </div>

      <div className="search-bar-container glass-panel" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem', alignItems: 'center' }}>
          <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
              <i className="ri-search-line" style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }}></i>
              <input 
                type="text" 
                placeholder="Search name, ID, mobile or locality..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '2.5rem', width: '100%' }}
              />
          </div>
          <select 
            className="input-control" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '140px' }}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
            <option value="Suspended">Suspended</option>
          </select>
          <select 
            className="input-control" 
            value={serviceTypeFilter} 
            onChange={(e) => setServiceTypeFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '140px' }}
          >
            <option value="All">All Services</option>
            <option value="Cable">Cable TV</option>
            <option value="Internet">Internet</option>
          </select>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input 
                  type="checkbox" 
                  className="custom-checkbox"
                  checked={filteredCustomers.length > 0 && selectedCustomers.length === filteredCustomers.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Customer ID</th>
              <th>Customer Name</th>
              <th>Mobile Number</th>
              <th>Installation Address</th>
              <th>Service</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((cust) => (
              <tr key={cust.id} className={selectedCustomers.includes(cust.id) ? 'selected-row' : ''}>
                <td>
                  <input 
                    type="checkbox" 
                    className="custom-checkbox"
                    checked={selectedCustomers.includes(cust.id)}
                    onChange={() => handleSelectToggle(cust.id)}
                  />
                </td>
                <td style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--primary)', fontSize: '0.85rem' }}>
                    {cust.customer_id}
                </td>
                <td>
                    <div className="user-cell">
                        <div className="user-avatar">{cust.name[0]?.toUpperCase()}</div>
                        <div className="user-info-stack">
                            <span className="user-name-text">{toTitleCase(cust.name)}</span>
                            {cust.username && <span className="user-subtext">@{cust.username}</span>}
                        </div>
                    </div>
                </td>
                <td style={{ letterSpacing: '0.05em', fontWeight: 600 }}>{cust.mobile}</td>
                <td>
                    <div className="address-stack">
                        <span className="address-main">{toTitleCase(`${cust.house_no}, ${cust.locality}`)}</span>
                        <span className="address-sub">{toTitleCase(cust.city)} {cust.pincode}</span>
                    </div>
                </td>
                <td>
                  <span className={`status-badge status-${cust.service_type === 'Cable' ? 'info' : 'active'}`}>
                    {cust.service_type}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${cust.status.toLowerCase()}`}>
                    {cust.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons justify-end">
                    <button className="btn-action edit" onClick={() => openEditModal(cust)} title="Edit Customer">
                        <i className="ri-edit-line"></i>
                    </button>
                    <button className="btn-action delete" onClick={() => handleDelete(cust.id)} title="Delete Customer">
                        <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-4 text-muted">
                    No customers found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

      {isBulkModalOpen && (
        <BulkImport 
          onClose={() => setIsBulkModalOpen(false)}
          onSave={() => {
            setIsBulkModalOpen(false);
            fetchCustomers();
          }}
        />
      )}
    </div>
  );
};

export default CustomersList;
