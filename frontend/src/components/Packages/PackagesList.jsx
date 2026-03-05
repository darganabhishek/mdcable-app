import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import PackageForm from './PackageForm';
import '../Customers/Customers.css';

const PackagesList = () => {
  const [packages, setPackages] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [selectedType, setSelectedType] = useState('All');
  const [newAreaName, setNewAreaName] = useState('');
  const [error, setError] = useState('');

  const fetchPackagesAndAreas = async () => {
    try {
      setLoading(true);
      const [pkgRes, areaRes] = await [
        axios.get(`${import.meta.env.VITE_API_URL}/packages`),
        axios.get(`${import.meta.env.VITE_API_URL}/areas`)
      ];
      setPackages((await pkgRes).data);
      setAreas((await areaRes).data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackagesAndAreas();
  }, []);

  const handleAddArea = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/areas`, { name: newAreaName });
      setNewAreaName('');
      setIsAreaModalOpen(false);
      fetchPackagesAndAreas();
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding area');
    }
  };

  const handleDeleteArea = async (id) => {
    if (window.confirm('Delete this area? Packages assigned to it will become "General".')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/areas/${id}`);
        fetchPackagesAndAreas();
      } catch (err) {
        alert('Error deleting area');
      }
    }
  };

  const openAddModal = () => {
    setEditingPackage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (pkg) => {
    setEditingPackage(pkg);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/packages/${id}`);
        fetchPackagesAndAreas();
      } catch (err) {
        alert('Failed to delete package.');
      }
    }
  };

  const filteredPackages = selectedType === 'All' ? packages : packages.filter(p => p.service_type === selectedType);

  const groupedPackages = useMemo(() => {
    const groups = {
      'General / All Areas': []
    };
    
    areas.forEach(area => {
      groups[area.name] = [];
    });

    filteredPackages.forEach(pkg => {
      const groupName = pkg.area?.name || 'General / All Areas';
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(pkg);
    });

    return groups;
  }, [filteredPackages, areas]);

  if (loading) return <div className="loading-state">Loading inventory...</div>;

  return (
    <div className="module-container">
      <div className="module-header">
        <div>
          <h2>Service Inventory</h2>
          <div className="search-bar-container glass-panel mt-4" style={{ marginBottom: 0 }}>
            {['All', 'Cable', 'Internet'].map(type => (
              <button 
                key={type}
                className={`nav-item ${selectedType === type ? 'active' : ''}`}
                onClick={() => setSelectedType(type)}
                style={{ height: 'auto', padding: '0.5rem 1.5rem', flex: 'none' }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div className="action-buttons">
          <button className="btn-secondary" onClick={() => setIsAreaModalOpen(true)}>
              <i className="ri-map-pin-line"></i>
              Manage Areas
          </button>
          <button className="btn-primary" onClick={openAddModal}>
              <i className="ri-add-line"></i>
              New Package
          </button>
        </div>
      </div>

      <div className="table-responsive">
        {Object.entries(groupedPackages).map(([areaName, pkgs]) => (
          (pkgs.length > 0 || areaName !== 'General / All Areas') && (
            <div key={areaName} className="area-group mb-8">
              <div className="flex justify-between items-center mb-4 px-4 py-2 glass-panel" style={{ borderRadius: 'var(--radius-md)', background: 'var(--primary-light)' }}>
                <h4 className="m-0 flex items-center gap-2">
                  <i className="ri-map-pin-2-fill text-indigo-400"></i>
                  {areaName}
                  <span className="text-xs py-1 px-2 rounded-full" style={{ background: 'var(--surface)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', border: '1px solid var(--surface-border)' }}>
                    {pkgs.length} {pkgs.length === 1 ? 'Plan' : 'Plans'}
                  </span>
                </h4>
                {areaName !== 'General / All Areas' && (
                   <button 
                    className="btn-icon-only danger" 
                    style={{ background: 'transparent', width: '24px', height: '24px' }}
                    onClick={() => handleDeleteArea(areas.find(a => a.name === areaName)?.id)}
                   >
                     <i className="ri-delete-bin-7-line" style={{ fontSize: '0.9rem' }}></i>
                   </button>
                )}
              </div>
              
              {pkgs.length > 0 ? (
                <table className="data-table mb-4">
                  <thead>
                    <tr>
                      <th>Service Name</th>
                      <th>Category</th>
                      <th>Monthly Fee</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pkgs.map(pkg => (
                      <tr key={pkg.id}>
                        <td>
                            <div className="user-cell">
                                <div className="user-avatar" style={{ background: pkg.service_type === 'Cable' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: pkg.service_type === 'Cable' ? 'var(--info)' : 'var(--success)' }}>
                                    <i className={pkg.service_type === 'Cable' ? 'ri-tv-2-line' : 'ri-router-line'}></i>
                                </div>
                                <strong>{pkg.name}</strong>
                            </div>
                        </td>
                        <td>
                          <span className={`status-badge ${pkg.service_type === 'Cable' ? 'status-info' : 'status-active'}`}>
                            {pkg.service_type}
                          </span>
                        </td>
                        <td>
                            <span style={{ fontWeight: 800 }}>₹{parseFloat(pkg.price).toFixed(2)}</span>
                        </td>
                        <td style={{ maxWidth: '250px' }}>
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                {pkg.description || 'No features listed.'}
                            </div>
                        </td>
                        <td>
                          <span className={`status-badge ${pkg.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                            {pkg.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons justify-end">
                            <button className="btn-icon-only" onClick={() => openEditModal(pkg)}>
                                <i className="ri-edit-line"></i>
                            </button>
                            <button className="btn-icon-only danger" onClick={() => handleDelete(pkg.id)}>
                                <i className="ri-delete-bin-line"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center py-4 text-muted" style={{ fontSize: '0.85rem' }}>No plans created for this area yet.</p>
              )}
            </div>
          )
        ))}
      </div>

      {isModalOpen && (
        <PackageForm 
          packageData={editingPackage} 
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            setIsModalOpen(false);
            fetchPackagesAndAreas();
          }}
        />
      )}

      {isAreaModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-slide-up" style={{ maxWidth: '400px', background: 'var(--bg-main)', border: '1px solid var(--surface-border)' }}>
            <button className="btn-close" onClick={() => setIsAreaModalOpen(false)}>
                <i className="ri-close-line"></i>
            </button>
            <div className="modal-header">
              <h3 className="text-gradient">Add New Area</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Create a subgroup to organize your plans by location.</p>
            </div>
            <form onSubmit={handleAddArea} className="customer-form mt-4">
              {error && <div className="error-alert">{error}</div>}
              <div className="input-group">
                <label className="input-label">Area Name</label>
                <div className="input-with-icon">
                    <i className="ri-map-pin-add-line"></i>
                    <input 
                      type="text" 
                      className="input-control" 
                      value={newAreaName} 
                      onChange={(e) => setNewAreaName(e.target.value)}
                      placeholder="e.g. Model Town"
                      required
                    />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsAreaModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Area</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagesList;
