import { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './BulkImport.css';

const BulkImport = ({ onClose, onSave }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    setError('');
    const selectedFile = e.target.files[0];
    if (selectedFile) {
        if (!selectedFile.name.match(/\.(csv|xlsx|xls)$/)) {
            setError('Please upload a valid Excel or CSV file.');
            return;
        }
        setFile(selectedFile);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Customer Name": 'Rahul Sharma',
        "Mobile Number": '9876543210',
        "Service Type": 'Cable',
        "Package": 'Gold Plan',
        "Area": 'Kidwai Nagar',
        "Address": '11/28, Kidwai Nagar, Delhi 110023',
        "Username": 'rahul_123',
        "Installation Date": new Date().toISOString().split('T')[0],
        "Discount": '0',
        "Status": 'Active'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'Customer_Import_Template.xlsx');
  };

  const processFile = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
            setError('The uploaded file is empty.');
            setLoading(false);
            return;
        }

        // Send to backend bulk endpoint
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/customers/bulk`, jsonData);
        setSuccess(`Successfully imported ${res.data.count} customers!`);
        setTimeout(() => {
            onSave();
        }, 1500);

      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to process file. Ensure it matches the template format.');
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read file.');
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-slide-up bulk-modal">
        <button className="btn-close" onClick={onClose} disabled={loading}>
          <i className="ri-close-line"></i>
        </button>
        <div className="modal-header">
          <h3 className="text-gradient">Bulk Import Customers</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Upload an Excel or CSV file to import multiple customer records.
          </p>
        </div>
        
        {error && <div className="error-alert">{error}</div>}
        {success && <div className="success-alert">{success}</div>}

        <div className="bulk-import-container">
            <div className="template-section">
                <p className="text-muted">New to bulk import? Download our standard template to ensure your data is formatted correctly.</p>
                <button className="btn-secondary" onClick={handleDownloadTemplate} disabled={loading}>
                    Download Template
                </button>
            </div>

            <div className="upload-section">
                <label className="upload-box" htmlFor="file-upload">
                    <div className="upload-icon">📁</div>
                    <p>{file ? file.name : 'Click or Drag & Drop Excel/CSV File Here'}</p>
                    <input 
                        id="file-upload" 
                        type="file" 
                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                        onChange={handleFileChange} 
                        disabled={loading}
                        style={{ display: 'none' }}
                    />
                </label>
            </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="button" className="btn-primary" onClick={processFile} disabled={!file || loading}>
            {loading ? 'Processing...' : 'Start Import'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkImport;
