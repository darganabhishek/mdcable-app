import { useState, useEffect } from 'react';
import axios from 'axios';
import './CustomerForm.css';

const CustomerForm = ({ customer, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    area: '',
    service_type: 'Cable',
    cable_package_id: '',
    internet_package_id: '',
    installation_date: new Date().toISOString().split('T')[0],
    status: 'Active'
  });
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch available packages for dropdowns
    axios.get(`${import.meta.env.VITE_API_URL}/packages`).then(res => {
        setPackages(res.data.filter(p => p.status === 'Active'));
    }).catch(err => console.error("Failed to load packages", err));

    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        address: customer.address || '',
        area: customer.area || '',
        service_type: customer.service_type || 'Cable',
        cable_package_id: customer.cable_package_id || '',
        internet_package_id: customer.internet_package_id || '',
        installation_date: customer.installation_date || '',
        status: customer.status || 'Active'
      });
    }
  }, [customer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (customer) {
        await axios.put(`${import.meta.env.VITE_API_URL}/customers/${customer.id}`, formData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/customers`, formData);
      }
      onSave(); // Trigger data refresh and close modal
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-slide-up" style={{ background: 'white' }}>
        <button className="btn-close" onClick={onClose}>
            <i className="ri-close-line"></i>
        </button>
        <div className="modal-header">
          <h3>{customer ? 'Update Customer Profile' : 'Register New Customer'}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Ensure all details are accurate for billing and service tracking.
          </p>
        </div>
        
        {error && <div className="error-alert animate-fade-in">{error}</div>}

        <form onSubmit={handleSubmit} className="customer-form">
          <div className="form-grid">
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <div className="input-with-icon">
                  <i className="ri-user-smile-line"></i>
                  <input type="text" name="name" className="input-control" value={formData.name} onChange={handleChange} required placeholder="e.g. Rahul Sharma" />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <div className="input-with-icon">
                  <i className="ri-phone-fill"></i>
                  <input type="text" name="phone" className="input-control" value={formData.phone} onChange={handleChange} required placeholder="10-digit mobile" />
              </div>
            </div>
            <div className="input-group full-width">
              <label className="input-label">Installation Address</label>
              <div className="input-with-icon">
                  <i className="ri-map-pin-2-line"></i>
                  <textarea name="address" className="input-control" rows="2" value={formData.address} onChange={handleChange} required placeholder="Full street address and landmarks..."></textarea>
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Service Area</label>
              <div className="input-with-icon">
                  <i className="ri-community-line"></i>
                  <input type="text" name="area" className="input-control" value={formData.area} onChange={handleChange} required placeholder="e.g. Model Town" />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Service Access</label>
              <div className="input-with-icon">
                  <i className="ri-settings-4-line"></i>
                  <select name="service_type" className="input-control" value={formData.service_type} onChange={handleChange}>
                    <option value="Cable">Cable Only</option>
                    <option value="Internet">Internet Only</option>
                    <option value="Both">Both Services</option>
                  </select>
              </div>
            </div>
            
            {(formData.service_type === 'Cable' || formData.service_type === 'Both') && (
              <div className="input-group">
                <label className="input-label">Cable Package</label>
                <div className="input-with-icon">
                    <i className="ri-tv-2-line"></i>
                    <select name="cable_package_id" className="input-control" value={formData.cable_package_id} onChange={handleChange}>
                      <option value="">-- Select Cable Package --</option>
                      {packages.filter(p => p.service_type === 'Cable').map(pkg => (
                        <option key={pkg.id} value={pkg.id}>{pkg.name} (₹{pkg.price})</option>
                      ))}
                    </select>
                </div>
              </div>
            )}

            {(formData.service_type === 'Internet' || formData.service_type === 'Both') && (
              <div className="input-group">
                <label className="input-label">Internet Package</label>
                <div className="input-with-icon">
                    <i className="ri-router-line"></i>
                    <select name="internet_package_id" className="input-control" value={formData.internet_package_id} onChange={handleChange}>
                      <option value="">-- Select Internet Package --</option>
                      {packages.filter(p => p.service_type === 'Internet').map(pkg => (
                        <option key={pkg.id} value={pkg.id}>{pkg.name} (₹{pkg.price})</option>
                      ))}
                    </select>
                </div>
              </div>
            )}
            <div className="input-group">
              <label className="input-label">Installation Date</label>
              <div className="input-with-icon">
                  <i className="ri-calendar-event-line"></i>
                  <input type="date" name="installation_date" className="input-control" value={formData.installation_date} onChange={handleChange} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Customer Status</label>
              <div className="input-with-icon">
                  <i className="ri-shield-user-line"></i>
                  <select name="status" className="input-control" value={formData.status} onChange={handleChange}>
                    <option value="Active">Active / Working</option>
                    <option value="Inactive">Inactive / Expired</option>
                    <option value="Suspended">Suspended / Blocked</option>
                  </select>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Discard</button>
            <button type="submit" className="btn-primary" disabled={loading}>
                <i className={customer ? 'ri-save-line' : 'ri-user-add-line'}></i>
                {loading ? 'Processing...' : customer ? 'Update Profile' : 'Register Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;
