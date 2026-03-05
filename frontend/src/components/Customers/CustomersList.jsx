import { useState, useEffect } from 'react';
import axios from 'axios';
import CustomerForm from './CustomerForm';
import BulkImport from './BulkImport';
import './Customers.css';

const CustomersList = () => {
  const [customers, setCustomers] = useState([]);
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

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/customers/${id}`);
        fetchCustomers();
      } catch (error) {
        console.error('Failed to delete customer', error);
        alert('Failed to delete customer. Ensure you have Super Admin privileges.');
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

  if (loading) return <div className="loading-state">Loading customers...</div>;

  return (
    <div className="module-container animate-fade-in">
      <div className="module-header">
        <h2>Customer Management</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-secondary" onClick={() => setIsBulkModalOpen(true)}>Bulk Import</button>
            <button className="btn-primary" onClick={openAddModal}>Add New Customer</button>
        </div>
      </div>

      <div className="table-responsive glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Area</th>
              <th>Service</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((cust) => (
              <tr key={cust.id}>
                <td>{cust.name}</td>
                <td>{cust.phone}</td>
                <td>{cust.area || 'N/A'}</td>
                <td>
                  <span className={`status-badge ${cust.service_type === 'Both' ? 'status-active' : 'status-pending'}`}>
                    {cust.service_type}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${cust.status.toLowerCase()}`}>
                    {cust.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" onClick={() => openEditModal(cust)}>Edit</button>
                    <button className="btn-icon danger" onClick={() => handleDelete(cust.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted">No customers found.</td>
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
