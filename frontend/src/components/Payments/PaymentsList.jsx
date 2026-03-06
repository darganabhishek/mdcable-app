import { useState, useEffect } from 'react';
import axios from 'axios';
import PaymentForm from './PaymentForm';
import '../Customers/Customers.css';
import './Payments.css';

const PaymentsList = () => {
  const [payments, setPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/payments`);
      setPayments(res.data);
    } catch (error) {
      console.error('Failed to fetch payments', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (payment) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this transaction? This will automatically adjust the customer balance.')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/payments/${id}`);
        fetchPayments();
      } catch (error) {
        console.error('Delete failed', error);
        alert('Failed to delete transaction.');
      }
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customer?.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="loading-state">Loading ledger...</div>;

  return (
    <div className="module-container">
      <div className="module-header">
        <h2>Revenue & Collections</h2>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <i className="ri-add-line"></i>
            Record Payment
        </button>
      </div>

      <div className="search-bar-container glass-panel" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
          <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
              <i className="ri-search-line" style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }}></i>
              <input 
                type="text" 
                placeholder="Search by customer name or phone..." 
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
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option value="All">All Transactions</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Payment Date</th>
              <th>Transaction ID</th>
              <th>Customer Details</th>
              <th>Amount Settled</th>
              <th>Transaction Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => (
              <tr key={payment.id}>
                <td>
                    <div className="user-cell">
                        <div className="user-avatar" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
                            <i className="ri-calendar-line"></i>
                        </div>
                        <span style={{ fontWeight: 600 }}>{new Date(payment.payment_date).toLocaleDateString()}</span>
                    </div>
                </td>
                <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                    {payment.transaction_id || 'LEGACY-TRX'}
                </td>
                <td>
                    <div className="customer-info">
                        <strong>{payment.customer?.name}</strong>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{payment.customer?.phone}</span>
                    </div>
                </td>
                <td className="amount-col">₹ {parseFloat(payment.amount).toLocaleString()}</td>
                <td>
                  <span className={`status-badge status-${payment.status.toLowerCase()}`}>
                    {payment.status}
                  </span>
                </td>
                <td>
                    <div className="action-buttons">
                        <button className="btn-action edit" onClick={() => handleEdit(payment)} title="Edit Transaction">
                            <i className="ri-edit-line"></i>
                        </button>
                        <button className="btn-action delete" onClick={() => handleDelete(payment.id)} title="Delete Transaction">
                            <i className="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </td>
              </tr>
            ))}
            {filteredPayments.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted">No payments found matching your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <PaymentForm 
          payment={selectedPayment}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPayment(null);
          }}
          onSave={() => {
            setIsModalOpen(false);
            setSelectedPayment(null);
            fetchPayments();
          }}
        />
      )}
    </div>
  );
};

export default PaymentsList;
