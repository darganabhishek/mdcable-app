import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Html5QrcodeScanner } from 'html5-qrcode';
import '../Customers/CustomerForm.css'; // Reusing modal CSS

const PaymentForm = ({ onClose, onSave, payment }) => {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    customer_id: payment?.customer_id || '',
    amount: payment?.amount || '',
    payment_date: payment?.payment_date ? new Date(payment.payment_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    status: payment?.status || 'Completed',
    remarks: payment?.remarks || ''
  });
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);

  const isEdit = !!payment;

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/customers`);
        setCustomers(res.data.filter(c => c.status !== 'Suspended'));
      } catch (err) {
        console.error('Failed to load customers for payment form');
      }
    };
    if (!isEdit) fetchCustomers();
  }, [isEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const startScanner = () => {
    setIsScanning(true);
    setError('');
    
    // Use a timeout to ensure the container is rendered
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner("qr-reader", { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      });

      scanner.render((decodedText) => {
        setFormData(prev => ({ ...prev, customer_id: decodedText }));
        setIsScanning(false);
        scanner.clear();
      }, (err) => {
        // Silently ignore scan errors (they happen constantly while looking for a code)
      });
      
      scannerRef.current = scanner;
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
        scannerRef.current.clear();
    }
    setIsScanning(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEdit) {
        await axios.put(`${import.meta.env.VITE_API_URL}/payments/${payment.id}`, formData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/payments`, formData);
      }
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
          <h3>{isEdit ? 'Update Transaction' : 'Record New Payment'}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {isEdit ? `Modifying Transaction ID: ${payment.transaction_id || 'Legacy'}` : 'Select a customer and enter the settlement amount.'}
          </p>
        </div>
        
        {error && <div className="error-alert animate-fade-in">{error}</div>}

        <form onSubmit={handleSubmit} className="customer-form">
          <div className="form-grid">
            <div className="input-group full-width">
              <label className="input-label">Select Customer</label>
              <div className="input-with-icon">
                  <i className="ri-user-search-line"></i>
                  <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                    <select 
                        name="customer_id" 
                        className="input-control" 
                        value={formData.customer_id} 
                        onChange={handleChange} 
                        required 
                        disabled={isEdit}
                        style={{ flex: 1 }}
                    >
                        {isEdit ? (
                        <option value={payment.customer_id}>{payment.customer?.name} ({payment.customer?.phone})</option>
                        ) : (
                        <>
                            <option value="" disabled>-- Search & Select Customer --</option>
                            {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                            ))}
                        </>
                        )}
                    </select>
                    {!isEdit && (
                        <button 
                            type="button" 
                            className="btn-secondary" 
                            onClick={startScanner}
                            style={{ height: 'auto', padding: '0 1rem' }}
                            title="Scan Customer QR"
                        >
                            <i className="ri-qr-scan-2-line"></i>
                        </button>
                    )}
                  </div>
              </div>
            </div>

            {isScanning && (
                <div className="input-group full-width animate-fade-in" style={{ textAlign: 'center' }}>
                    <div id="qr-reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto', borderRadius: '1rem', overflow: 'hidden' }}></div>
                    <button type="button" className="btn-secondary mt-2" onClick={stopScanner}>
                        Cancel Scan
                    </button>
                </div>
            )}
            
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
                {loading ? 'Processing...' : (isEdit ? 'Update Transaction' : 'Secure Settlement')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
