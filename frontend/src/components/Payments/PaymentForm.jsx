import { useState, useEffect } from 'react';
import axios from 'axios';
import '../Customers/CustomerForm.css'; // Reusing modal CSS

const PaymentForm = ({ onClose, onSave }) => {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    status: 'Completed',
    remarks: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/customers`);
        setCustomers(res.data.filter(c => c.status !== 'Suspended'));
      } catch (err) {
        console.error('Failed to load customers for payment form');
      }
    };
    fetchCustomers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/payments`, formData);
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-slide-up">
        <button className="btn-close" onClick={onClose}>
            <i className="ri-close-line"></i>
        </button>
        <div className="modal-header">
          <h3>Record New Payment</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Select a customer and enter the settlement amount.
          </p>
        </div>
        
        {error && <div className="error-alert animate-fade-in">{error}</div>}

        <form onSubmit={handleSubmit} className="customer-form">
          <div className="form-grid">
            <div className="input-group full-width">
              <label className="input-label">Select Customer</label>
              <div className="input-with-icon">
                  <i className="ri-user-search-line"></i>
                  <select name="customer_id" className="input-control" value={formData.customer_id} onChange={handleChange} required>
                    <option value="" disabled>-- Search & Select Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
              </div>
            </div>
            
            <div className="input-group">
              <label className="input-label">Amount Recieved (₹)</label>
              <div className="input-with-icon">
                  <i className="ri-money-rupee-circle-line"></i>
                  <input type="number" name="amount" className="input-control" value={formData.amount} onChange={handleChange} min="0" step="0.01" required placeholder="0.00" />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Payment Date</label>
              <div className="input-with-icon">
                  <i className="ri-calendar-check-line"></i>
                  <input type="date" name="payment_date" className="input-control" value={formData.payment_date} onChange={handleChange} required />
              </div>
            </div>

            <div className="input-group full-width">
              <label className="input-label">Transaction Status</label>
              <div className="input-with-icon">
                  <i className="ri-shield-flash-line"></i>
                  <select name="status" className="input-control" value={formData.status} onChange={handleChange}>
                    <option value="Completed">Completed / Success</option>
                    <option value="Pending">Pending / In-Process</option>
                    <option value="Failed">Failed / Declined</option>
                  </select>
              </div>
            </div>

            <div className="input-group full-width">
              <label className="input-label">Remarks & Reference</label>
              <div className="input-with-icon">
                  <i className="ri-sticky-note-line"></i>
                  <textarea name="remarks" className="input-control" rows="2" value={formData.remarks} onChange={handleChange} placeholder="Transaction ID, mode of payment, or internal notes..."></textarea>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Discard</button>
            <button type="submit" className="btn-primary" disabled={loading}>
                <i className="ri-save-3-line"></i>
                {loading ? 'Processing...' : 'Secure Settlement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
