import { useState, useEffect } from 'react';
import axios from 'axios';
import '../Customers/CustomerForm.css';

const PackageForm = ({ packageData, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    service_type: 'Cable',
    price: '',
    description: '',
    status: 'Active',
    area_id: ''
  });
  const [areas, setAreas] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/areas`);
        setAreas(res.data);
      } catch (err) {
        console.error('Error fetching areas', err);
      }
    };
    fetchAreas();

    if (packageData) {
      setFormData({
        name: packageData.name,
        service_type: packageData.service_type,
        price: packageData.price,
        description: packageData.description || '',
        status: packageData.status,
        area_id: packageData.area_id || ''
      });
    }
  }, [packageData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submissionData = { ...formData };
      if (submissionData.service_type === 'Cable') {
        submissionData.area_id = null;
      } else if (!submissionData.area_id) {
        delete submissionData.area_id;
      }

      if (packageData) {
        await axios.put(`${import.meta.env.VITE_API_URL}/packages/${packageData.id}`, submissionData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/packages`, submissionData);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving package');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-slide-up" style={{ maxWidth: '500px' }}>
        <button className="btn-close" onClick={onClose}>
            <i className="ri-close-line"></i>
        </button>
        <div className="modal-header">
          <h3 className="text-gradient">{packageData ? 'Update Service' : 'Create New Service'}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Configure your service package details below.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="customer-form">
          {error && <div className="error-alert animate-fade-in">{error}</div>}
          
          <div className="input-group">
            <label className="input-label">Package Name</label>
            <div className="input-with-icon">
                <i className="ri-box-3-line"></i>
                <input type="text" name="name" className="input-control" value={formData.name} onChange={handleChange} required placeholder="e.g. Fiber Ultra 100" />
            </div>
          </div>

          <div className="form-grid">
              <div className="input-group">
                <label className="input-label">Service Type</label>
                <div className="input-with-icon">
                    <i className={formData.service_type === 'Cable' ? 'ri-tv-2-line' : 'ri-router-line'}></i>
                    <select name="service_type" className="input-control" value={formData.service_type} onChange={handleChange}>
                        <option value="Cable">Cable TV</option>
                        <option value="Internet">Internet Service</option>
                    </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Monthly Price (₹)</label>
                <div className="input-with-icon">
                    <i className="ri-money-rupee-circle-line"></i>
                    <input type="number" step="0.01" name="price" className="input-control" value={formData.price} onChange={handleChange} required placeholder="0.00" />
                </div>
              </div>
          </div>

          {formData.service_type !== 'Cable' && (
            <div className="input-group">
              <label className="input-label">Target Area (Subgroup)</label>
              <div className="input-with-icon">
                  <i className="ri-map-pin-line"></i>
                  <select name="area_id" className="input-control" value={formData.area_id} onChange={handleChange}>
                      <option value="">General (No Area)</option>
                      {areas.map(area => (
                          <option key={area.id} value={area.id}>{area.name}</option>
                      ))}
                  </select>
              </div>
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Description & Features</label>
            <textarea name="description" className="input-control" value={formData.description} onChange={handleChange} rows="3" placeholder="List channels, speed, or other features..." />
          </div>

          <div className="input-group">
            <label className="input-label">Availability Status</label>
            <div className="input-with-icon">
                <i className="ri-checkbox-circle-line"></i>
                <select name="status" className="input-control" value={formData.status} onChange={handleChange}>
                    <option value="Active">Active / Public</option>
                    <option value="Inactive">Inactive / Hidden</option>
                </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Discard</button>
            <button type="submit" className="btn-primary">
                {packageData ? 'Update Package' : 'Create Package'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PackageForm;
