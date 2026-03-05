import { useState, useEffect } from 'react';
import axios from 'axios';
import '../Customers/CustomerForm.css';

const UserForm = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'Technician'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        password: '', // Don't populate password
        role: user.role || 'Technician'
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // If editing and password is empty, remove it from payload
    const payload = { ...formData };
    if (user && !payload.password) {
        delete payload.password;
    }

    try {
      if (user) {
        await axios.put(`${import.meta.env.VITE_API_URL}/users/${user.id}`, payload);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/users`, payload);
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
          <h3>{user ? 'Update Staff Member' : 'Register New Personnel'}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Define roles and credentials for administrative access.
          </p>
        </div>
        
        {error && <div className="error-alert animate-fade-in">{error}</div>}

        <form onSubmit={handleSubmit} className="customer-form">
          <div className="form-grid">
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <div className="input-with-icon">
                  <i className="ri-user-line"></i>
                  <input type="text" name="name" className="input-control" value={formData.name} onChange={handleChange} required placeholder="e.g. John Doe" />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Login ID (Username)</label>
              <div className="input-with-icon">
                  <i className="ri-at-line"></i>
                  <input type="text" name="username" className="input-control" value={formData.username} onChange={handleChange} required placeholder="system_admin" />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">{user ? 'Renew Password' : 'Secure Password'}</label>
              <div className="input-with-icon">
                  <i className="ri-lock-password-line"></i>
                  <input type="password" name="password" className="input-control" value={formData.password} onChange={handleChange} required={!user} placeholder={user ? 'Leave blank to keep current' : '••••••••'} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Authority Role</label>
              <div className="input-with-icon">
                  <i className="ri-shield-user-line"></i>
                  <select name="role" className="input-control" value={formData.role} onChange={handleChange}>
                    <option value="Super Admin">Super Admin (Full Access)</option>
                    <option value="Admin">Standard Admin</option>
                    <option value="Area Manager">Area Manager (Operations)</option>
                    <option value="Technician">Field Technician</option>
                  </select>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Discard</button>
            <button type="submit" className="btn-primary" disabled={loading}>
                <i className={user ? 'ri-save-line' : 'ri-user-follow-line'}></i>
                {loading ? 'Processing...' : user ? 'Update Credentials' : 'Add to Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
