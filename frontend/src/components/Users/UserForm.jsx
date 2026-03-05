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
      <div className="modal-content glass-panel animate-fade-in">
        <div className="modal-header">
          <h3>{user ? 'Edit Staff Member' : 'Add New Staff'}</h3>
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
              <label>Login ID (Username)</label>
              <input type="text" name="username" className="input-control" value={formData.username} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>{user ? 'New Password (leave blank to keep current)' : 'Password'}</label>
              <input type="password" name="password" className="input-control" value={formData.password} onChange={handleChange} required={!user} />
            </div>
            <div className="input-group">
              <label>Role</label>
              <select name="role" className="input-control" value={formData.role} onChange={handleChange}>
                <option value="Super Admin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Area Manager">Area Manager</option>
                <option value="Technician">Technician</option>
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
