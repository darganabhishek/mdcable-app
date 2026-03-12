import { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import PaymentForm from './PaymentForm';
import { downloadCSV } from '../../utils/exportUtils';
import '../Customers/Customers.css';
import './Payments.css';

const ALL_COLS = [
  { key: 'date',          label: 'Date',           default: true  },
  { key: 'transaction_id',label: 'Transaction ID', default: true  },
  { key: 'customer',      label: 'Customer',        default: true  },
  { key: 'amount',        label: 'Amount',          default: true  },
  { key: 'method',        label: 'Method',          default: true  },
  { key: 'status',        label: 'Status',          default: true  },
  { key: 'collector',     label: 'Collected By',    default: false },
  { key: 'remarks',       label: 'Remarks',         default: false },
  { key: 'actions',       label: 'Actions',         default: true  },
];

const SORT_OPTIONS = [
  { value: 'date_desc',    label: 'Newest First',  field: 'payment_date', dir: -1 },
  { value: 'date_asc',     label: 'Oldest First',  field: 'payment_date', dir:  1 },
  { value: 'amount_desc',  label: 'Amount (High)',  field: 'amount',       dir: -1 },
  { value: 'amount_asc',   label: 'Amount (Low)',   field: 'amount',       dir:  1 },
  { value: 'customer_asc', label: 'Customer A→Z',  field: '_custName',    dir:  1 },
  { value: 'customer_desc',label: 'Customer Z→A',  field: '_custName',    dir: -1 },
];

const PaymentsList = () => {
  const [payments,       setPayments]       = useState([]);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [statusFilter,   setStatusFilter]   = useState('All');
  const [methodFilter,   setMethodFilter]   = useState('All');
  const [dateFrom,       setDateFrom]       = useState('');
  const [dateTo,         setDateTo]         = useState('');
  const [sortKey,        setSortKey]        = useState('date_desc');
  const [showColumns,    setShowColumns]    = useState(false);
  const [visibleCols,    setVisibleCols]    = useState(
    () => Object.fromEntries(ALL_COLS.map(c => [c.key, c.default]))
  );
  const [loading,        setLoading]        = useState(true);
  const [isModalOpen,    setIsModalOpen]    = useState(false);
  const [selectedPayment,setSelectedPayment]= useState(null);
  const colRef = useRef(null);
  const { user } = useContext(AuthContext);
  const isTechnician = user?.role === 'Technician';

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/payments`);
      setPayments(res.data);
    } catch (err) {
      console.error('Failed to fetch payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  useEffect(() => {
    const handler = (e) => { if (colRef.current && !colRef.current.contains(e.target)) setShowColumns(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Derive unique methods
  const methods = ['All', ...new Set(payments.map(p => p.payment_method).filter(Boolean))];

  // Filtering + sorting
  const sortFn = (arr) => {
    const opt = SORT_OPTIONS.find(o => o.value === sortKey);
    if (!opt) return arr;
    return [...arr].sort((a, b) => {
      const av = opt.field === '_custName' ? (a.customer?.name || '') : (a[opt.field] ?? '');
      const bv = opt.field === '_custName' ? (b.customer?.name || '') : (b[opt.field] ?? '');
      if (!isNaN(parseFloat(av)) && !isNaN(parseFloat(bv))) return (parseFloat(av) - parseFloat(bv)) * opt.dir;
      return String(av).localeCompare(String(bv)) * opt.dir;
    });
  };

  const filteredPayments = sortFn(
    payments.filter(p => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        p.customer?.name?.toLowerCase().includes(q) ||
        p.customer?.mobile?.includes(q) ||
        p.customer?.customer_id?.toLowerCase().includes(q) ||
        p.transaction_id?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchMethod = methodFilter === 'All' || p.payment_method === methodFilter;
      const pd = p.payment_date ? new Date(p.payment_date) : null;
      const matchFrom = !dateFrom || (pd && pd >= new Date(dateFrom));
      const matchTo   = !dateTo   || (pd && pd <= new Date(dateTo + 'T23:59:59'));
      return matchSearch && matchStatus && matchMethod && matchFrom && matchTo;
    })
  );

  const totalFiltered = filteredPayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  const handleExport = () => {
    const headers = ['payment_date','transaction_id','amount','payment_method','status','customer.name','customer.customer_id'];
    downloadCSV(filteredPayments, headers, `payments_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const handleEdit = (p) => { setSelectedPayment(p); setIsModalOpen(true); };

  const handleDelete = async (id) => {
    if (isTechnician) return;
    if (window.confirm('Remove this transaction? Customer balance and billing cycle will be adjusted.')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/payments/${id}`);
        fetchPayments();
      } catch (err) {
        console.error('Delete failed', err);
        alert('Failed to delete transaction.');
      }
    }
  };

  const toggleCol = (key) => setVisibleCols(p => ({ ...p, [key]: !p[key] }));

  if (loading) return <div className="loading-state">Loading ledger…</div>;

  return (
    <div className="module-container">
      {/* ─── Header ─── */}
      <div className="module-header">
        <div>
          <h2 style={{ marginBottom:'0.25rem' }}>Revenue & Collections</h2>
          <p style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>Full transaction ledger with advanced filters.</p>
        </div>
        <div className="action-buttons">
          <button className="btn-secondary" onClick={handleExport}><i className="ri-download-line"/> Export CSV</button>
          <button className="btn-primary"   onClick={() => { setSelectedPayment(null); setIsModalOpen(true); }}>
            <i className="ri-add-line"/> Record Payment
          </button>
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div className="search-bar-container glass-panel" style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto auto auto auto', gap:'0.75rem', alignItems:'center', flexWrap:'wrap' }}>
        {/* Search */}
        <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
          <i className="ri-search-line" style={{ position:'absolute', left:'1rem', color:'var(--text-muted)' }}/>
          <input
            type="text"
            placeholder="Search customer, mobile, transaction…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-input"
            style={{ paddingLeft:'2.5rem', width:'100%' }}
          />
        </div>

        <select className="input-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ minWidth:'140px' }}>
          <option value="All">All Statuses</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>

        <select className="input-control" value={methodFilter} onChange={e => setMethodFilter(e.target.value)} style={{ minWidth:'130px' }}>
          {methods.map(m => <option key={m} value={m}>{m === 'All' ? 'All Methods' : m}</option>)}
        </select>

        <input type="date" className="input-control" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From date" style={{ minWidth:'140px' }}/>
        <input type="date" className="input-control" value={dateTo}   onChange={e => setDateTo(e.target.value)}   title="To date"   style={{ minWidth:'140px' }}/>

        <select className="input-control" value={sortKey} onChange={e => setSortKey(e.target.value)} style={{ minWidth:'155px' }}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Column chooser */}
        <div ref={colRef} style={{ position:'relative' }}>
          <button className="btn-secondary" onClick={() => setShowColumns(p=>!p)}>
            <i className="ri-layout-column-line"/> Columns
          </button>
          {showColumns && (
            <div style={{
              position:'absolute', right:0, top:'110%', zIndex:100,
              background:'var(--surface)', border:'1px solid var(--surface-border)',
              borderRadius:'0.75rem', padding:'1rem', minWidth:'180px',
              boxShadow:'0 8px 32px rgba(0,0,0,0.3)'
            }}>
              {ALL_COLS.map(col => (
                <label key={col.key} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.3rem 0', cursor:'pointer', fontSize:'0.85rem' }}>
                  <input type="checkbox" checked={visibleCols[col.key]} onChange={() => toggleCol(col.key)} />
                  {col.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display:'flex', gap:'2rem', padding:'0.75rem 1rem', background:'var(--surface)', borderRadius:'0.75rem', marginBottom:'1rem', fontSize:'0.85rem' }}>
        <span style={{ color:'var(--text-muted)' }}>{filteredPayments.length} transaction{filteredPayments.length !== 1 ? 's' : ''}</span>
        <span style={{ color:'var(--success)', fontWeight:700 }}>Total: ₹{totalFiltered.toLocaleString('en-IN')}</span>
      </div>

      {/* ─── Table ─── */}
      <div className="table-responsive">
        <table className="data-table mobile-card-view">
          <thead>
            <tr>
              {visibleCols.date           && <th>Date</th>}
              {visibleCols.transaction_id && <th>Transaction ID</th>}
              {visibleCols.customer       && <th>Customer</th>}
              {visibleCols.amount         && <th>Amount</th>}
              {visibleCols.method         && <th>Method</th>}
              {visibleCols.status         && <th>Status</th>}
              {visibleCols.collector      && <th>Collected By</th>}
              {visibleCols.remarks        && <th>Remarks</th>}
              {visibleCols.actions        && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map(payment => (
              <tr key={payment.id}>
                {visibleCols.date && (
                  <td data-label="Date">
                    <div className="user-cell">
                      <div className="user-avatar" style={{ background:'rgba(99,102,241,0.1)' }}>
                        <i className="ri-calendar-line"/>
                      </div>
                      <span style={{ fontWeight:600 }}>
                        {new Date(payment.payment_date).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </td>
                )}
                {visibleCols.transaction_id && (
                  <td data-label="Transaction ID" style={{ fontFamily:'monospace', fontWeight:600, color:'var(--primary)', fontSize:'0.8rem' }}>
                    {payment.transaction_id || 'LEGACY-TRX'}
                  </td>
                )}
                {visibleCols.customer && (
                  <td data-label="Customer">
                    <div className="user-cell">
                      <div className="user-avatar">{payment.customer?.name?.[0]?.toUpperCase()}</div>
                      <div className="user-info-stack">
                        <span className="user-name-text">{payment.customer?.name}</span>
                        <span className="user-subtext">{payment.customer?.customer_id} · {payment.customer?.mobile}</span>
                      </div>
                    </div>
                  </td>
                )}
                {visibleCols.amount && (
                  <td data-label="Amount" className="amount-col">₹{parseFloat(payment.amount).toLocaleString('en-IN')}</td>
                )}
                {visibleCols.method && (
                  <td data-label="Method" style={{ fontSize:'0.85rem' }}>{payment.payment_method || '—'}</td>
                )}
                {visibleCols.status && (
                  <td data-label="Status">
                    <span className={`status-badge status-${payment.status?.toLowerCase()}`}>{payment.status}</span>
                  </td>
                )}
                {visibleCols.collector && (
                  <td style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>{payment.collector?.name || '—'}</td>
                )}
                {visibleCols.remarks && (
                  <td style={{ fontSize:'0.82rem', color:'var(--text-muted)', maxWidth:'160px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {payment.remarks || '—'}
                  </td>
                )}
                {visibleCols.actions && (
                  <td data-label="Actions">
                    <div className="action-buttons">
                      <button className="btn-action edit"   onClick={() => handleEdit(payment)}      title="Edit"><i className="ri-edit-line"/></button>
                      {!isTechnician && (
                        <button className="btn-action delete" onClick={() => handleDelete(payment.id)} title="Delete"><i className="ri-delete-bin-line"/></button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filteredPayments.length === 0 && (
              <tr><td colSpan={Object.values(visibleCols).filter(Boolean).length} className="text-center py-4 text-muted">
                No payments found matching your filters.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <PaymentForm
          payment={selectedPayment}
          onClose={() => { setIsModalOpen(false); setSelectedPayment(null); }}
          onSave={() => { setIsModalOpen(false); setSelectedPayment(null); fetchPayments(); }}
        />
      )}
    </div>
  );
};

export default PaymentsList;
