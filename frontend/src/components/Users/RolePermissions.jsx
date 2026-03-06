import { useState, useEffect } from 'react';
import axios from 'axios';
import './Users.css';

const RolePermissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState('Admin');
  const [saving, setSaving] = useState(false);

  const roles = ['Admin', 'Area Manager', 'Technician'];

  const permissionGroups = {
    'Customer Management': [
      { name: 'customers:view', label: 'View Customers' },
      { name: 'customers:create', label: 'Add New Customer' },
      { name: 'customers:edit', label: 'Edit Customer Details' },
      { name: 'customers:delete', label: 'Remove Customer Record' },
      { name: 'customers:bulk_import', label: 'Bulk Import Data' },
    ],
    'Service Packages': [
      { name: 'packages:view', label: 'View Packages' },
      { name: 'packages:create', label: 'Create New Package' },
      { name: 'packages:edit', label: 'Modify Package Rates/Details' },
      { name: 'packages:delete', label: 'Delete Package' },
    ],
    'Area/Subgroups': [
      { name: 'areas:view', label: 'View Areas' },
      { name: 'areas:create', label: 'Define New Area' },
      { name: 'areas:delete', label: 'Remove Area' },
    ],
    'Financials': [
      { name: 'payments:view', label: 'View Payment History' },
      { name: 'payments:create', label: 'Collect/Log Payment' },
      { name: 'renewals:view', label: 'View Renewal Logs' },
      { name: 'renewals:create', label: 'Process Service Renewal' },
    ],
    'Analytics & System': [
      { name: 'reports:view', label: 'Access Reports & Analytics' },
      { name: 'users:manage', label: 'System Staff Management' },
    ]
  };

  const fetchPermissions = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/permissions`);
      setPermissions(res.data);
    } catch (error) {
      console.error('Failed to fetch permissions', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleToggle = async (permissionName) => {
    const perm = permissions.find(p => p.role === activeRole && p.permission === permissionName);
    if (!perm) return;

    try {
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/permissions/${perm.id}`, {
        enabled: !perm.enabled
      });
      
      setPermissions(prev => prev.map(p => p.id === perm.id ? res.data : p));
    } catch (error) {
      console.error('Failed to update permission', error);
      alert('Failed to update permission.');
    }
  };

  const isEnabled = (permissionName) => {
    return permissions.find(p => p.role === activeRole && p.permission === permissionName)?.enabled || false;
  };

  if (loading) return <div className="loading-state">Loading Security Protocols...</div>;

  return (
    <div className="module-container">
      <div className="module-header">
        <div>
          <h2>Operational Authorizations</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Define granular access control for each system role.</p>
        </div>
      </div>

      <div className="permission-layout">
        <aside className="role-selector">
          {roles.map(role => (
            <button 
              key={role}
              className={`role-btn ${activeRole === role ? 'active' : ''}`}
              onClick={() => setActiveRole(role)}
            >
              <i className="ri-shield-keyhole-line"></i>
              {role}
            </button>
          ))}
          <div className="super-admin-note">
            <i className="ri-information-line"></i>
            Super Admin has absolute authority and cannot be restricted.
          </div>
        </aside>

        <main className="permission-grid">
          {Object.entries(permissionGroups).map(([groupName, groupPerms]) => (
            <div key={groupName} className="permission-group glass-panel">
              <h3>{groupName}</h3>
              <div className="permission-list">
                {groupPerms.map(perm => (
                  <div key={perm.name} className="permission-item">
                    <label className="permission-label">
                      <span>{perm.label}</span>
                      <div className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={isEnabled(perm.name)}
                          onChange={() => handleToggle(perm.name)}
                        />
                        <span className="slider round"></span>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .permission-layout {
          display: grid;
          grid-template-columns: 250px 1fr;
          gap: 2rem;
          margin-top: 1.5rem;
        }

        .role-selector {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .role-btn {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: all 0.3s ease;
        }

        .role-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .role-btn.active {
          background: var(--primary-gradient);
          border-color: transparent;
          box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
        }

        .super-admin-note {
          margin-top: auto;
          padding: 1rem;
          background: rgba(40, 167, 69, 0.1);
          border-radius: 12px;
          color: #28a745;
          font-size: 0.85rem;
          display: flex;
          gap: 0.5rem;
          line-height: 1.4;
        }

        .permission-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          max-height: calc(100vh - 250px);
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .permission-group {
          padding: 1.25rem;
        }

        .permission-group h3 {
          font-size: 1rem;
          margin-bottom: 1.25rem;
          color: var(--text-gradient);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 0.75rem;
        }

        .permission-item {
          margin-bottom: 1rem;
        }

        .permission-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 20px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.1);
          transition: .4s;
          border-radius: 34px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: #28a745;
        }

        input:checked + .slider:before {
          transform: translateX(20px);
        }
      ` }} />
    </div>
  );
};

export default RolePermissions;
