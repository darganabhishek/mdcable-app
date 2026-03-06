import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-panel animate-slide-up">
        <div className="login-header">
          <div className="logo-icon">
            <i className="ri-broadcast-line"></i>
          </div>
          <h1 className="text-gradient">M.D. Cable Networks</h1>
          <p>Unified Management Portal</p>
        </div>

        {error && <div className="error-alert animate-fade-in">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username" className="input-label">Login ID</label>
            <div className="input-with-icon">
              <i className="ri-user-line"></i>
              <input
                type="text"
                id="username"
                className="input-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your Login ID"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password" className="input-label">Password</label>
            <div className="input-with-icon">
              <i className="ri-lock-line"></i>
              <input
                type="password"
                id="password"
                className="input-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary login-btn">
            Sign In
            <i className="ri-arrow-right-line"></i>
          </button>
        </form>
      </div>
      <div className="developer-footer">
        Designed & Developed by <strong>Abhishek Dargan</strong>
      </div>
    </div>
  );
};

export default Login;
