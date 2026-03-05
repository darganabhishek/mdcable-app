import { useState, useEffect } from 'react';
import axios from 'axios';

const PackageForm = ({ packageData, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    service_type: 'Cable',
    price: '',
    description: '',
    status: 'Active'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (packageData) {
      setFormData({
        name: packageData.name,
        service_type: packageData.service_type,
        price: packageData.price,
        description: packageData.description || '',
        status: packageData.status
      });
    }
  }, [packageData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (packageData) {
        await axios.put(`${import.meta.env.VITE_API_URL}/packages/${packageData.id}`, formData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/packages`, formData);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving package');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-fade-in" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3>{packageData ? 'Edit Package' : 'Add New Package'}</h3>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="customer-form">
          {error && <div className="error-alert">{error}</div>}
          
          <div className="input-group">
            <label>Package Name</label>
            <input type="text" name="name" className="input-control" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>Service Type</label>
            <select name="service_type" className="input-control" value={formData.service_type} onChange={handleChange}>
              <option value="Cable">Cable</option>
              <option value="Internet">Internet</option>
            </select>
          </div>

          <div className="input-group">
            <label>Monthly Price (₹)</label>
            <input type="number" step="0.01" name="price" className="input-control" value={formData.price} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>Description (Channels, Speed, etc)</label>
            <textarea name="description" className="input-control" value={formData.description} onChange={handleChange} rows="3" />
          </div>

          <div className="input-group">
            <label>Status</label>
            <select name="status" className="input-control" value={formData.status} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Package</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PackageForm;
