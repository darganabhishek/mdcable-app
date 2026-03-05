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
      <div className="modal-content glass-panel animate-fade-in">
        <div className="modal-header">
          <h3>Record New Payment</h3>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>
        
        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="customer-form">
          <div className="form-grid">
            <div className="input-group full-width">
              <label>Select Customer</label>
              <select name="customer_id" className="input-control" value={formData.customer_id} onChange={handleChange} required>
                <option value="" disabled>-- Select a Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone}) - {c.plan}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Amount Recieved (₹)</label>
              <input type="number" name="amount" className="input-control" value={formData.amount} onChange={handleChange} min="0" step="0.01" required />
            </div>
            <div className="input-group">
              <label>Payment Date</label>
              <input type="date" name="payment_date" className="input-control" value={formData.payment_date} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Status</label>
              <select name="status" className="input-control" value={formData.status} onChange={handleChange}>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
            <div className="input-group full-width">
              <label>Remarks / Notes (Optional)</label>
              <textarea name="remarks" className="input-control" rows="2" value={formData.remarks} onChange={handleChange}></textarea>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Processing...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
