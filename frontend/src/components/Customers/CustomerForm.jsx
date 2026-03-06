import { useState, useEffect } from 'react';
import axios from 'axios';
import './CustomerForm.css';

const CustomerForm = ({ customer, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    mobile: '',
    email: '',
    house_no: '',
    locality: '',
    city: 'Kanpur',
    pincode: '',
    area: '',
    area_id: '',
    service_type: 'Cable',
    cable_package_id: '',
    internet_package_id: '',
    installation_date: new Date().toISOString().split('T')[0],
    status: 'Active',
    discount: 0
  });
  const [packages, setPackages] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch available packages and areas
    const fetchData = async () => {
      try {
        const [pkgRes, areaRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/packages`),
          axios.get(`${import.meta.env.VITE_API_URL}/areas`)
        ]);
        setPackages(pkgRes.data.filter(p => p.status === 'Active'));
        setAreas(areaRes.data);
      } catch (err) {
        console.error("Failed to load dependency data", err);
      }
    };
    fetchData();

    if (customer) {
      setFormData({
        username: customer.username || '',
        name: customer.name || '',
        mobile: customer.mobile || '',
        email: customer.email || '',
        house_no: customer.house_no || '',
        locality: customer.locality || '',
        city: customer.city || 'Kanpur',
        pincode: customer.pincode || '',
        area: customer.area || '',
        area_id: customer.area_id || '',
        service_type: customer.service_type === 'Both' ? 'Both' : 
                      (customer.service_type?.includes('Cable') ? 'Cable' : 
                       customer.service_type?.includes('Internet') ? 'Internet' : 'Cable'),
        cable_package_id: customer.package_id && (customer.service_type?.includes('Cable') || customer.service_type === 'Both') ? customer.package_id : '',
        internet_package_id: customer.package_id && (customer.service_type?.includes('Internet') || customer.service_type === 'Both') ? customer.package_id : '',
        installation_date: customer.installation_date || '',
        status: customer.status || 'Active',
        discount: customer.discount || 0
      });
    }
  }, [customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Reset packages if area changes
    if (name === 'area_id') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        cable_package_id: '',
        internet_package_id: ''
      }));
    } else if (name === 'service_type') {
      // If switching to Cable, we might want to clear area_id if that's the business rule
      setFormData(prev => ({
        ...prev,
        [name]: value,
        ...(value === 'Cable' ? { area_id: '' } : {})
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submissionData = {
        ...formData,
        discount: parseFloat(formData.discount) || 0
      };

      if (customer) {
        await axios.put(`${import.meta.env.VITE_API_URL}/customers/${customer.id}`, submissionData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/customers`, submissionData);
      }
      onSave(); // Trigger data refresh and close modal
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Filter packages based on selected area
  const filteredPackages = packages.filter(p => {
    // If user is selecting Cable Only, show all Cable packages (since area is irrelevant/hidden)
    if (formData.service_type === 'Cable' && p.service_type === 'Cable') return true;
    
    // Otherwise, show global packages OR area-specific packages
    return !p.area_id || p.area_id === formData.area_id;
  });
  
  // Calculate total monthly committed amount
  const calculateTotal = () => {
    let total = 0;
    if (formData.cable_package_id) {
        const pkg = packages.find(p => p.id === formData.cable_package_id);
        if (pkg) total += parseFloat(pkg.price);
    }
    if (formData.internet_package_id) {
        const pkg = packages.find(p => p.id === formData.internet_package_id);
        if (pkg) total += parseFloat(pkg.price);
    }
    
    const discount = parseFloat(formData.discount) || 0;
    return Math.max(0, total - discount).toFixed(2);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-slide-up">
        <button className="btn-close" onClick={onClose} title="Close Form">
            <i className="ri-close-line"></i>
        </button>
        <div className="modal-header">
          <h3 className="text-gradient">{customer ? 'Update Customer Profile' : 'Register New Customer'}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Select an area to view available plans and auto-calculated pricing.
          </p>
        </div>
        
        {error && <div className="error-alert animate-fade-in">{error}</div>}

        <form onSubmit={handleSubmit} className="customer-form">
          <div className="form-grid">
            <div className="input-group">
              <label className="input-label">Username / Account ID</label>
              <div className="input-with-icon">
                  <i className="ri-shield-user-line"></i>
                  <input type="text" name="username" className="input-control" value={formData.username} onChange={handleChange} placeholder="e.g. rahul_123" />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <div className="input-with-icon">
                  <i className="ri-user-smile-line"></i>
                  <input type="text" name="name" className="input-control" value={formData.name} onChange={handleChange} required placeholder="e.g. Rahul Sharma" />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Mobile Number (10 Digits)</label>
              <div className="input-with-icon">
                  <i className="ri-phone-fill"></i>
                  <input type="text" name="mobile" className="input-control" value={formData.mobile} onChange={handleChange} required placeholder="9876543210" maxLength="10" />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Email Address (Optional)</label>
              <div className="input-with-icon">
                  <i className="ri-mail-line"></i>
                  <input type="email" name="email" className="input-control" value={formData.email} onChange={handleChange} placeholder="rahul@example.com" />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">House / Flat No.</label>
              <div className="input-with-icon">
                  <i className="ri-home-4-line"></i>
                  <input type="text" name="house_no" className="input-control" value={formData.house_no} onChange={handleChange} required placeholder="e.g. 11/28" />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Locality / Street</label>
              <div className="input-with-icon">
                  <i className="ri-map-pin-2-line"></i>
                  <input type="text" name="locality" className="input-control" value={formData.locality} onChange={handleChange} required placeholder="e.g. Kidwai Nagar" />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">City</label>
              <div className="input-with-icon">
                  <i className="ri-building-4-line"></i>
                  <input type="text" name="city" className="input-control" value={formData.city} onChange={handleChange} required placeholder="Kanpur" />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Pincode</label>
              <div className="input-with-icon">
                  <i className="ri-compass-3-line"></i>
                  <input type="text" name="pincode" className="input-control" value={formData.pincode} onChange={handleChange} placeholder="208011" maxLength="6" />
              </div>
            </div>

            {formData.service_type !== 'Cable' && (
              <div className="input-group">
                <label className="input-label">Service Area</label>
                <div className="input-with-icon">
                    <i className="ri-community-line"></i>
                    <select 
                      name="area_id" 
                      className="input-control" 
                      value={formData.area_id} 
                      onChange={handleChange} 
                      required={formData.service_type !== 'Cable'}
                    >
                      <option value="">-- Select Service Area --</option>
                      {areas.map(area => (
                          <option key={area.id} value={area.id}>{area.name}</option>
                      ))}
                    </select>
                </div>
              </div>
            )}
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
                    <select name="cable_package_id" className="input-control" value={formData.cable_package_id} onChange={handleChange} style={{ paddingRight: '2rem' }}>
                      <option value="">-- Choose Cable Plan --</option>
                      {/* Group Cable Packages by Area */}
                      {Object.entries(
                        filteredPackages
                          .filter(p => p.service_type === 'Cable')
                          .reduce((acc, p) => {
                            const areaName = p.area?.name || 'General / All Areas';
                            if (!acc[areaName]) acc[areaName] = [];
                            acc[areaName].push(p);
                            return acc;
                          }, {})
                      ).map(([areaName, pkgs]) => (
                        <optgroup key={areaName} label={areaName}>
                          {pkgs.map(pkg => (
                            <option key={pkg.id} value={pkg.id}>{pkg.name} (₹{pkg.price})</option>
                          ))}
                        </optgroup>
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
                      {/* Group Internet Packages by Area */}
                      {Object.entries(
                        filteredPackages
                          .filter(p => p.service_type === 'Internet')
                          .reduce((acc, p) => {
                            const areaName = p.area?.name || 'General / All Areas';
                            if (!acc[areaName]) acc[areaName] = [];
                            acc[areaName].push(p);
                            return acc;
                          }, {})
                      ).map(([areaName, pkgs]) => (
                        <optgroup key={areaName} label={areaName}>
                          {pkgs.map(pkg => (
                            <option key={pkg.id} value={pkg.id}>{pkg.name} (₹{pkg.price})</option>
                          ))}
                        </optgroup>
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
              <label className="input-label">Monthly Discount (₹)</label>
              <div className="input-with-icon">
                  <i className="ri-price-tag-3-line"></i>
                  <input type="number" name="discount" className="input-control" value={formData.discount} onChange={handleChange} placeholder="0" min="0" step="1" />
              </div>
            </div>
            <div className="input-group full-width">
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

          <div className="price-estimation glass-panel" style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid var(--surface-border)', background: 'var(--primary-light)' }}>
            <div className="flex justify-between items-center">
                <div>
                   <h4 style={{ margin: 0, color: 'var(--text-main)' }}>Monthly Commitment</h4>
                   <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Automated total for selected plans</p>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                    ₹{calculateTotal()}
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
