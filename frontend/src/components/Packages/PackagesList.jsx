import { useState, useEffect } from 'react';
import axios from 'axios';
import PackageForm from './PackageForm';
import '../Customers/Customers.css';

const PackagesList = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [selectedType, setSelectedType] = useState('All');

  const fetchPackages = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/packages`);
      setPackages(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching packages', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

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
        fetchPackages();
      } catch (err) {
        alert('Failed to delete package. Ensure it is not active on any accounts.');
      }
    }
  };

  const filteredPackages = selectedType === 'All' ? packages : packages.filter(p => p.service_type === selectedType);

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
        <button className="btn-primary btn-add" onClick={openAddModal}>
            <i className="ri-add-line"></i>
            New Package
        </button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Service Name</th>
              <th>Category</th>
              <th>Monthly Fee</th>
              <th>Service Description</th>
              <th>Availability</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPackages.map(pkg => (
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
                <td style={{ maxWidth: '300px' }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {pkg.description || 'No description provided.'}
                    </div>
                </td>
                <td>
                  <span className={`status-badge ${pkg.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                    {pkg.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons justify-end">
                    <button className="btn-icon-only" onClick={() => openEditModal(pkg)} title="Edit Package">
                        <i className="ri-edit-line"></i>
                    </button>
                    <button className="btn-icon-only danger" onClick={() => handleDelete(pkg.id)} title="Delete Package">
                        <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredPackages.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-4 text-muted">No packages found for {selectedType}.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <PackageForm 
          packageData={editingPackage} 
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            setIsModalOpen(false);
            fetchPackages();
          }}
        />
      )}
    </div>
  );
};

export default PackagesList;
