import { useState, useEffect } from 'react';
import axios from 'axios';
import PackageForm from './PackageForm';

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

  if (loading) return <div>Loading Packages...</div>;

  return (
    <div className="module-container animate-fade-in">
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2>Service Packages</h2>
          <div className="report-tabs mt-2" style={{ display: 'inline-flex' }}>
            {['All', 'Cable', 'Internet'].map(type => (
              <button 
                key={type}
                className={`tab-btn ${selectedType === type ? 'active' : ''}`}
                onClick={() => setSelectedType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <button className="btn-primary" onClick={openAddModal} style={{ width: 'auto' }}>Add New Package</button>
      </div>

      <div className="table-responsive glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>PACKAGE NAME</th>
              <th>TYPE</th>
              <th>PRICE (₹)</th>
              <th>DESCRIPTION</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredPackages.map(pkg => (
              <tr key={pkg.id}>
                <td><strong>{pkg.name}</strong></td>
                <td>
                  <span className={`status-badge ${pkg.service_type === 'Cable' ? 'status-active' : 'status-pending'}`}>
                    {pkg.service_type}
                  </span>
                </td>
                <td>₹{parseFloat(pkg.price).toFixed(2)}</td>
                <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pkg.description || 'N/A'}
                </td>
                <td>
                  <span className={`status-badge ${pkg.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                    {pkg.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" onClick={() => openEditModal(pkg)}>✏️</button>
                    <button className="btn-icon" style={{color: 'var(--danger)'}} onClick={() => handleDelete(pkg.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredPackages.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No packages found for {selectedType}.</td>
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
