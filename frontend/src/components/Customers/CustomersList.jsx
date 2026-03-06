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
        fetchCustomers();
      } catch (error) {
        console.error('Failed to delete customer', error);
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

  if (loading) return <div className="loading-state">Loading users...</div>;

  return (
    <div className="module-container">
      <div className="module-header">
        <h2>Customer Base</h2>
        <div className="action-buttons">
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
              <tr key={cust.id}>
                <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--primary)' }}>
                    {cust.customer_id}
                </td>
                <td>
                    <div className="user-cell">
                        <div className="user-avatar">{cust.name[0]}</div>
                        <span>{cust.name}</span>
                    </div>
                </td>
                <td>{cust.mobile}</td>
                <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cust.house_no}, {cust.locality}, {cust.city}
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
                    <button className="btn-icon-only" onClick={() => openEditModal(cust)} title="Edit">
                        <i className="ri-edit-line"></i>
                    </button>
                    <button className="btn-icon-only danger" onClick={() => handleDelete(cust.id)} title="Delete">
                        <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-4 text-muted">
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
