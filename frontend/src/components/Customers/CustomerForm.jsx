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
      <div className="modal-content glass-panel animate-fade-in">
        <div className="modal-header">
          <h3>{customer ? 'Edit Customer' : 'Add New Customer'}</h3>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>
        
        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="customer-form">
          <div className="form-grid">
            <div className="input-group">
              <label>Full Name</label>
              <input type="text" name="name" className="input-control" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Phone Number</label>
              <input type="text" name="phone" className="input-control" value={formData.phone} onChange={handleChange} required />
            </div>
            <div className="input-group full-width">
              <label>Address</label>
              <textarea name="address" className="input-control" rows="2" value={formData.address} onChange={handleChange} required></textarea>
            </div>
            <div className="input-group">
              <label>Service Area</label>
              <input type="text" name="area" className="input-control" value={formData.area} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Service Type</label>
              <select name="service_type" className="input-control" value={formData.service_type} onChange={handleChange}>
                <option value="Cable">Cable Only</option>
                <option value="Internet">Internet Only</option>
                <option value="Both">Both Services</option>
              </select>
            </div>
            
            {(formData.service_type === 'Cable' || formData.service_type === 'Both') && (
              <div className="input-group">
                <label>Cable Package</label>
                <select name="cable_package_id" className="input-control" value={formData.cable_package_id} onChange={handleChange}>
                  <option value="">-- Select Cable Package --</option>
                  {packages.filter(p => p.service_type === 'Cable').map(pkg => (
                    <option key={pkg.id} value={pkg.id}>{pkg.name} (₹{pkg.price})</option>
                  ))}
                </select>
              </div>
            )}

            {(formData.service_type === 'Internet' || formData.service_type === 'Both') && (
              <div className="input-group">
                <label>Internet Package</label>
                <select name="internet_package_id" className="input-control" value={formData.internet_package_id} onChange={handleChange}>
                  <option value="">-- Select Internet Package --</option>
                  {packages.filter(p => p.service_type === 'Internet').map(pkg => (
                    <option key={pkg.id} value={pkg.id}>{pkg.name} (₹{pkg.price})</option>
                  ))}
                </select>
              </div>
            )}
            <div className="input-group">
              <label>Installation Date</label>
              <input type="date" name="installation_date" className="input-control" value={formData.installation_date} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Status</label>
              <select name="status" className="input-control" value={formData.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;
