import { useState, useEffect } from 'react';
import axios from 'axios';
import UserForm from './UserForm';
import '../Customers/Customers.css';
import './Users.css';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/users`);
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/users/${id}`);
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user', error);
        alert(error.response?.data?.message || 'Failed to delete user.');
      }
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  if (loading) return <div className="loading-state">Authenticating access...</div>;

  return (
    <div className="module-container">
      <div className="module-header">
        <div>
          <h2>Personnel & Authority</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Manage administrative roles and staff access levels.</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
            <i className="ri-user-add-line"></i>
            Add Staff Member
        </button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>System Username</th>
              <th>Access Role</th>
              <th>Joined Date</th>
              <th className="text-right">Management</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                    <div className="user-cell">
                        <div className="user-avatar">
                            {user.name.charAt(0)}
                        </div>
                        <strong>{user.name}</strong>
                    </div>
                </td>
                <td>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>@{user.username}</span>
                </td>
                <td>
                  <span className={`role-badge role-${user.role.replace(/\s+/g, '-').toLowerCase()}`}>
                    {user.role}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons justify-end">
                    <button className="btn-icon-only" onClick={() => openEditModal(user)} title="Edit Privileges">
                        <i className="ri-settings-3-line"></i>
                    </button>
                    {user.role !== 'Super Admin' && (
                        <button className="btn-icon-only danger" onClick={() => handleDelete(user.id)} title="Revoke Access">
                            <i className="ri-user-unfollow-line"></i>
                        </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted">No tactical personal found in records.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <UserForm 
          user={editingUser}
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            setIsModalOpen(false);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
};

export default UsersList;
