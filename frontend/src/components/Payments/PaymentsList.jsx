import { useState, useEffect } from 'react';
import axios from 'axios';
import PaymentForm from './PaymentForm';
import './Payments.css';

const PaymentsList = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/payments`);
      setPayments(res.data);
    } catch (error) {
      console.error('Failed to fetch payments', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  if (loading) return <div className="loading-state">Loading payments...</div>;

  return (
    <div className="module-container animate-fade-in">
      <div className="module-header">
        <h2>Collections & Payments</h2>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>Record Payment</button>
      </div>

      <div className="table-responsive glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Collected By</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                <td>
                    <div className="customer-info">
                        <strong>{payment.customer?.name}</strong>
                        <span className="text-muted text-sm">{payment.customer?.phone}</span>
                    </div>
                </td>
                <td className="amount-col">₹ {payment.amount}</td>
                <td>
                  <span className={`status-badge status-${payment.status.toLowerCase()}`}>
                    {payment.status}
                  </span>
                </td>
                <td>{payment.collector?.name}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted">No payments recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <PaymentForm 
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            setIsModalOpen(false);
            fetchPayments();
          }}
        />
      )}
    </div>
  );
};

export default PaymentsList;
