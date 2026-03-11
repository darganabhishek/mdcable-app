import { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { AuthContext } from '../../context/AuthContext';
import CustomerForm from './CustomerForm';
import BulkImport from './BulkImport';
import { downloadCSV } from '../../utils/exportUtils';
import { exportQRsToPDF } from '../../utils/qrExportUtils';
import { generateInvoice, generateReceipt, bulkGenerateDocuments } from '../../utils/documentExportUtils';
import './Customers.css';

const STATUS_TABS = ['All', 'Active', 'Inactive', 'Suspended', 'Renewals Due'];

const ALL_COLUMNS = [
  { key: 'customer_id', label: 'Customer ID', default: true },
  { key: 'name',        label: 'Name',         default: true },
  { key: 'mobile',      label: 'Mobile',        default: true },
  { key: 'address',     label: 'Address',       default: true },
  { key: 'billing',     label: 'Next billing cycle', default: true },
  { key: 'balance',     label: 'Balance',       default: true },
  { key: 'actions',     label: 'Actions',       default: true },
  { key: 'service',     label: 'Service',       default: true },
];

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Newest First',     field: 'createdAt', dir: -1 },
  { value: 'createdAt_asc',  label: 'Oldest First',     field: 'createdAt', dir:  1 },
  { value: 'name_asc',       label: 'Name A→Z',         field: 'name',      dir:  1 },
  { value: 'name_desc',      label: 'Name Z→A',         field: 'name',      dir: -1 },
  { value: 'billing_asc',    label: 'Billing Date ↑',   field: 'next_billing_date', dir:  1 },
  { value: 'billing_desc',   label: 'Billing Date ↓',   field: 'next_billing_date', dir: -1 },
  { value: 'balance_asc',    label: 'Balance (Low)',     field: 'balance',   dir:  1 },
  { value: 'balance_desc',   label: 'Balance (High)',    field: 'balance',   dir: -1 },
];

const CustomersList = ({ initialAction, onActionComplete }) => {
  const [customers,         setCustomers]         = useState([]);
  const [renewalsDue,       setRenewalsDue]       = useState([]);
  const [activeTab,         setActiveTab]         = useState('All');
  const [searchQuery,       setSearchQuery]       = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('All');
  const [sortKey,           setSortKey]           = useState('createdAt_desc');
  const [showFilters,       setShowFilters]       = useState(false);
  const [showColumns,       setShowColumns]       = useState(false);
  const [visibleCols,       setVisibleCols]       = useState(() => {
    const saved = localStorage.getItem('customer_column_prefs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const initial = {};
        ALL_COLUMNS.forEach(c => initial[c.key] = parsed.hasOwnProperty(c.key) ? parsed[c.key] : c.default);
        return initial;
      } catch (e) { console.error("Parse prefs failed", e); }
    }
    const initial = {};
    ALL_COLUMNS.forEach(c => initial[c.key] = c.default);
    return initial;
  });
  const [loading,           setLoading]           = useState(true);
  const [isModalOpen,       setIsModalOpen]       = useState(false);
  const [isBulkModalOpen,   setIsBulkModalOpen]   = useState(false);
  const [isQRModalOpen,     setIsQRModalOpen]     = useState(false);
  const [editingCustomer,   setEditingCustomer]   = useState(null);
  const [qrCustomer,        setQrCustomer]        = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const colRef = useRef(null);
  const { user } = useContext(AuthContext);
  const isTechnician = user?.role === 'Technician';

  // --- Data Fetching ---
  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/customers`);
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRenewalsDue = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/customers/renewals-due`);
      setRenewalsDue(res.data);
    } catch (err) {
      console.error('Failed to fetch renewals', err);
    }
  };

  useEffect(() => { fetchCustomers(); fetchRenewalsDue(); }, []);

  useEffect(() => {
    if (initialAction === 'add') {
      openAddModal();
      if (onActionComplete) onActionComplete();
    }
    if (initialAction === 'renewals') {
      setActiveTab('Renewals Due');
      if (onActionComplete) onActionComplete();
    }
  }, [initialAction]);

  // Close column dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (colRef.current && !colRef.current.contains(e.target)) setShowColumns(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // --- Filtering & Sorting ---
  const sortFn = (arr) => {
    const opt = SORT_OPTIONS.find(o => o.value === sortKey);
    if (!opt) return arr;
    return [...arr].sort((a, b) => {
      const av = a[opt.field] ?? '';
      const bv = b[opt.field] ?? '';
      if (typeof av === 'number' || !isNaN(parseFloat(av))) {
        return (parseFloat(av) - parseFloat(bv)) * opt.dir;
      }
      return String(av).localeCompare(String(bv)) * opt.dir;
    });
  };

  const baseList = activeTab === 'Renewals Due' ? renewalsDue : customers;

  const filteredCustomers = sortFn(
    baseList.filter(c => {
      if (activeTab !== 'All' && activeTab !== 'Renewals Due' && c.status !== activeTab) return false;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        c.name?.toLowerCase().includes(q) ||
        c.mobile?.includes(q) ||
        c.customer_id?.toLowerCase().includes(q) ||
        c.locality?.toLowerCase().includes(q) ||
        c.house_no?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.pincode?.includes(q);
      const matchesService = serviceTypeFilter === 'All' || c.service_type === serviceTypeFilter;
      return matchesSearch && matchesService;
    })
  );

  // Tab counts
  const tabCount = (tab) => {
    if (tab === 'All')          return customers.length;
    if (tab === 'Renewals Due') return renewalsDue.length;
    return customers.filter(c => c.status === tab).length;
  };

  // --- Helpers ---
  const toTitleCase = (str) => {
    if (!str || str.toLowerCase() === 'null') return '';
    return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const renderAddress = (house_no, locality) => {
    const parts = [house_no, locality].filter(p => p && p.toLowerCase() !== 'null');
    return parts.length > 0 ? parts.map(toTitleCase).join(', ') : '-';
  };

  const getPaymentStatus = (cust) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const balance = parseFloat(cust.balance) || 0;
    const nextDate = cust.next_billing_date ? new Date(cust.next_billing_date) : null;
    if (balance > 0) return { label: `Credit ₹${balance.toFixed(0)}`, cls: 'active' };
    if (nextDate && nextDate <= today) return { label: 'Renewal Due', cls: 'warning' };
    return { label: 'Paid', cls: 'active' };
  };

  // --- Actions ---
  const handleDelete = async (id) => {
    if (isTechnician) return;
    if (window.confirm('Delete this customer record?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/customers/${id}`);
        setSelectedCustomers(p => p.filter(i => i !== id));
        fetchCustomers(); fetchRenewalsDue();
      } catch (err) { console.error('Delete failed', err); }
    }
  };

  const handleSelectAll = (e) =>
    setSelectedCustomers(e.target.checked ? filteredCustomers.map(c => c.id) : []);

  const handleSelectToggle = (id) =>
    setSelectedCustomers(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);

  const handleBulkDelete = async () => {
    if (isTechnician) return;
    if (window.confirm(`Delete ${selectedCustomers.length} customers?`)) {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/customers/bulk-delete`, { ids: selectedCustomers });
        setSelectedCustomers([]);
        fetchCustomers(); fetchRenewalsDue();
      } catch (err) { console.error('Bulk delete failed', err); }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/customers/${id}`, { status: newStatus });
      fetchCustomers(); fetchRenewalsDue();
    } catch (err) { console.error('Status update failed', err); }
  };

  const handleExport = () => {
    const headers = ['customer_id','name','mobile','email','house_no','locality','city','pincode','service_type','status','next_billing_date','balance'];
    downloadCSV(filteredCustomers, headers, `customers_${Date.now()}.csv`);
  };

  const openAddModal = () => { setEditingCustomer(null); setIsModalOpen(true); };
  const openEditModal = (c) => { setEditingCustomer(c); setIsModalOpen(true); };
  const toggleCol = (key) => {
    setVisibleCols(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('customer_column_prefs', JSON.stringify(next));
      return next;
    });
  };

  if (loading) return <div className="loading-state">Loading users…</div>;

  return (
    <div className="module-container">
      {/* ─── Header ─── */}
      <div className="module-header">
        <div>
          <h2 style={{ marginBottom: '0.25rem' }}>Customer Base</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage and monitor your subscriber network.</p>
        </div>
        <div className="action-buttons">
          {selectedCustomers.length > 0 && (
            <div className="bulk-actions-group animate-slide-up">
              <button className="btn-secondary" onClick={() => bulkGenerateDocuments(customers.filter(c=>selectedCustomers.includes(c.id)),'invoice')}>
                <i className="ri-file-list-3-line"/> Invoices
              </button>
              <button className="btn-secondary" onClick={() => bulkGenerateDocuments(customers.filter(c=>selectedCustomers.includes(c.id)),'receipt')}>
                <i className="ri-bill-line"/> Receipts
              </button>
              <button className="btn-secondary" onClick={() => exportQRsToPDF(customers.filter(c=>selectedCustomers.includes(c.id)))}>
                <i className="ri-qr-code-line"/> QR Cards
              </button>
              {!isTechnician && (
                <button className="btn-bulk-delete" onClick={handleBulkDelete}>
                  <i className="ri-delete-bin-line"/> Delete ({selectedCustomers.length})
                </button>
              )}
            </div>
          )}
          <button className="btn-secondary" onClick={handleExport}><i className="ri-download-line"/> Export CSV</button>
          <button className="btn-secondary" onClick={() => setIsBulkModalOpen(true)}><i className="ri-file-upload-line"/> Bulk Import</button>
          <button className="btn-primary btn-add" onClick={openAddModal}><i className="ri-add-line"/> New Customer</button>
        </div>
      </div>

      {/* ─── Status Tabs ─── */}
      <div className="status-tabs glass-panel" style={{ display:'flex', gap:'0.25rem', padding:'0.5rem', borderRadius:'1rem', marginBottom:'1rem', overflowX:'auto' }}>
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab)}
            style={{
              padding:'0.5rem 1rem', borderRadius:'0.75rem', border:'none',
              cursor:'pointer', whiteSpace:'nowrap', fontWeight: activeTab===tab ? 700 : 500,
              background: activeTab===tab ? 'var(--primary)' : 'transparent',
              color: activeTab===tab ? '#fff' : 'var(--text-muted)',
              transition:'all 0.2s',
            }}
          >
            {tab}
            <span style={{
              marginLeft:'0.5rem', fontSize:'0.7rem', fontWeight:700,
              background: activeTab===tab ? 'rgba(255,255,255,0.25)' : 'var(--surface-border)',
              padding:'0.1rem 0.4rem', borderRadius:'0.5rem',
            }}>{tabCount(tab)}</span>
          </button>
        ))}
      </div>

      {/* ─── Search + Controls ─── */}
      <div className="search-bar-container glass-panel" style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto auto', gap:'0.75rem', alignItems:'center' }}>
        <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
          <i className="ri-search-line" style={{ position:'absolute', left:'1rem', color:'var(--text-muted)' }}/>
          <input
            type="text"
            placeholder="Search name, ID, mobile, address, city or pincode…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-input"
            style={{ paddingLeft:'2.5rem', width:'100%' }}
          />
        </div>

        <select className="input-control" value={serviceTypeFilter} onChange={e => setServiceTypeFilter(e.target.value)} style={{ minWidth:'130px' }}>
          <option value="All">All Services</option>
          <option value="Cable">Cable TV</option>
          <option value="Internet">Internet</option>
        </select>

        <select className="input-control" value={sortKey} onChange={e => setSortKey(e.target.value)} style={{ minWidth:'160px' }}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Column chooser */}
        <div ref={colRef} style={{ position:'relative' }}>
          <button className="btn-secondary" onClick={() => setShowColumns(p=>!p)}>
            <i className="ri-layout-column-line"/> Columns
          </button>
          {showColumns && (
            <div style={{
              position:'absolute', right:0, top:'110%', zIndex:2147483647,
              backgroundColor:'#020617', border:'1px solid var(--surface-border)',
              borderRadius:'0.75rem', padding:'1rem', minWidth:'220px',
              boxShadow:'0 20px 60px rgba(0,0,0,0.9)',
              maxHeight: '400px', overflowY: 'auto',
              opacity: 1, pointerEvents: 'auto'
            }}>
              {ALL_COLUMNS.map(col => (
                <label key={col.key} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.3rem 0', cursor:'pointer', fontSize:'0.85rem' }}>
                  <input type="checkbox" checked={visibleCols[col.key]} onChange={() => toggleCol(col.key)} />
                  {col.label}
                </label>
              ))}
            </div>
          )}
        </div>

        <span style={{ color:'var(--text-muted)', fontSize:'0.85rem', whiteSpace:'nowrap' }}>
          {filteredCustomers.length} result{filteredCustomers.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ─── Table ─── */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width:'40px' }}>
                <input type="checkbox" className="custom-checkbox"
                  checked={filteredCustomers.length > 0 && selectedCustomers.length === filteredCustomers.length}
                  onChange={handleSelectAll}
                />
              </th>
              {visibleCols.customer_id && <th>Customer ID</th>}
              {visibleCols.name        && <th>Name</th>}
              {visibleCols.mobile      && <th>Mobile</th>}
              {visibleCols.address     && <th>Address</th>}
              {visibleCols.billing     && <th>Next billing cycle</th>}
              {visibleCols.balance     && <th>Balance</th>}
              {visibleCols.actions     && <th className="text-right">Actions</th>}
              {visibleCols.service     && <th>Service</th>}
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(cust => {
              const ps = getPaymentStatus(cust);
              return (
                <tr key={cust.id} className={selectedCustomers.includes(cust.id) ? 'selected-row' : ''}>
                  <td>
                    <input type="checkbox" className="custom-checkbox"
                      checked={selectedCustomers.includes(cust.id)}
                      onChange={() => handleSelectToggle(cust.id)}
                    />
                  </td>
                  {visibleCols.customer_id && (
                    <td style={{ fontWeight:800, color:'var(--primary)', fontSize:'0.85rem' }}>{cust.customer_id}</td>
                  )}
                  {visibleCols.name && (
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">{cust.name?.[0]?.toUpperCase()}</div>
                        <div className="user-info-stack">
                          <span className="user-name-text">{toTitleCase(cust.name)}</span>
                          {cust.username && <span className="user-subtext">@{cust.username}</span>}
                        </div>
                      </div>
                    </td>
                  )}
                  {visibleCols.mobile  && <td style={{ letterSpacing:'0.05em', fontWeight:600 }}>{cust.mobile}</td>}
                  {visibleCols.address && (
                    <td style={{ fontSize:'0.85rem' }}>
                      <div className="address-stack">
                        <span className="address-main">{renderAddress(cust.house_no, cust.locality)}</span>
                        {(cust.city || cust.pincode) && (
                          <span className="address-sub">{toTitleCase(cust.city)}{cust.pincode ? ` ${cust.pincode}` : ''}</span>
                        )}
                      </div>
                    </td>
                  )}
                  {visibleCols.billing && (
                    <td style={{ fontSize:'0.85rem' }}>
                      {cust.next_billing_date ? new Date(cust.next_billing_date).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) : '—'}
                    </td>
                  )}
                  {visibleCols.balance && (
                    <td style={{ 
                      fontWeight:700, 
                      color: parseFloat(cust.balance) >= 0 ? 'var(--success)' : 'var(--danger)' 
                    }}>
                      ₹{parseFloat(cust.balance || 0).toFixed(0)}
                    </td>
                  )}
                  {visibleCols.actions && (
                    <td>
                      <div className="action-buttons justify-end">
                        <button className="btn-action edit" onClick={() => generateInvoice(cust)} title="Invoice"><i className="ri-file-list-3-line"/></button>
                        <button className="btn-action edit" onClick={() => generateReceipt(cust)} title="Receipt"><i className="ri-bill-line"/></button>
                        <button className="btn-action edit" onClick={() => openQRModal(cust)} title="QR Code"><i className="ri-qr-code-line"/></button>
                        <button className="btn-action edit" onClick={() => openEditModal(cust)} title="Edit"><i className="ri-edit-line"/></button>
                        {!isTechnician && (
                          <button className="btn-action delete" onClick={() => handleDelete(cust.id)} title="Delete"><i className="ri-delete-bin-line"/></button>
                        )}
                      </div>
                    </td>
                  )}
                  {visibleCols.service && (
                    <td>
                      <span className={`status-badge status-${cust.service_type === 'Cable' ? 'info' : 'active'}`}>{cust.service_type}</span>
                    </td>
                  )}
                </tr>
              );
            })}
            {filteredCustomers.length === 0 && (
              <tr><td colSpan={Object.values(visibleCols).filter(Boolean).length + 1} className="text-center py-4 text-muted">
                No customers found.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Modals ─── */}
      {isModalOpen && (
        <CustomerForm
          customer={editingCustomer}
          onClose={() => setIsModalOpen(false)}
          onSave={() => { setIsModalOpen(false); fetchCustomers(); fetchRenewalsDue(); }}
        />
      )}
      {isBulkModalOpen && (
        <BulkImport
          onClose={() => setIsBulkModalOpen(false)}
          onSave={() => { setIsBulkModalOpen(false); fetchCustomers(); fetchRenewalsDue(); }}
        />
      )}
      {isQRModalOpen && qrCustomer && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-slide-up" style={{ maxWidth:'400px', textAlign:'center' }}>
            <button className="btn-close" onClick={() => setIsQRModalOpen(false)}><i className="ri-close-line"/></button>
            <div className="modal-header">
              <h3 className="text-gradient">Customer ID Card</h3>
              <p style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>Scan to record payments instantly.</p>
            </div>
            <div style={{ background:'white', padding:'1.5rem', borderRadius:'1rem', display:'inline-block', marginTop:'1.5rem' }}>
              <QRCodeSVG value={qrCustomer.id} size={200} level="H" includeMargin={true}/>
            </div>
            <div style={{ marginTop:'1.5rem', borderTop:'1px solid var(--surface-border)', paddingTop:'1.5rem' }}>
              <h4 style={{ margin:0 }}>{toTitleCase(qrCustomer.name)}</h4>
              <p style={{ color:'var(--primary)', fontWeight:800, margin:'0.25rem 0' }}>{qrCustomer.customer_id}</p>
              <p style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>{qrCustomer.mobile}</p>
            </div>
            <div className="modal-actions" style={{ justifyContent:'center' }}>
              <button className="btn-primary" onClick={() => window.print()}><i className="ri-printer-line"/> Print ID</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersList;
