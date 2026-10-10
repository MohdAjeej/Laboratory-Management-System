'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Invoice {
  _id: string;
  invoiceId: string;
  orderId: string;
  patientName: string;
  patientId: string;
  total: number;
  amountPaid: number;
  amountDue: number;
  status: string;
  createdAt: string;
}

export default function RecordPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedInvoiceId = searchParams.get('invoiceId');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(preSelectedInvoiceId || '');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<string>('CASH');
  const [transactionId, setTransactionId] = useState('');
  const [cardLast4, setCardLast4] = useState('');
  const [upiId, setUpiId] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (preSelectedInvoiceId) {
      const invoice = invoices.find((inv) => inv._id === preSelectedInvoiceId);
      if (invoice) {
        setAmount(invoice.amountDue.toString());
      }
    }
  }, [preSelectedInvoiceId, invoices]);

  const fetchInvoices = async () => {
    try {
      // Fetch pending invoices
      const response = await fetch('/api/billing/invoices?status=PENDING');
      const data = await response.json();

      if (data.success) {
        setInvoices(data.data.invoices.filter((inv: Invoice) => inv.amountDue > 0));
      }

      // If there's a pre-selected invoice, also fetch it specifically
      if (preSelectedInvoiceId) {
        const invoiceResponse = await fetch('/api/billing/invoices');
        const invoiceData = await invoiceResponse.json();
        if (invoiceData.success) {
          const allInvoices = invoiceData.data.invoices.filter((inv: Invoice) => inv.amountDue > 0);
          setInvoices(allInvoices);
        }
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedInvoiceId) {
      alert('Please select an invoice');
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const selectedInvoice = invoices.find((inv) => inv._id === selectedInvoiceId);
    if (selectedInvoice && paymentAmount > selectedInvoice.amountDue) {
      alert(`Payment amount cannot exceed amount due (₹${selectedInvoice.amountDue.toFixed(2)})`);
      return;
    }

    setLoading(true);

    try {
      const paymentData: any = {
        invoiceId: selectedInvoiceId,
        amount: paymentAmount,
        method: method,
        notes: notes || undefined,
      };

      if (transactionId) paymentData.transactionId = transactionId;
      if (method === 'CARD' && cardLast4) paymentData.cardLast4 = cardLast4;
      if (method === 'UPI' && upiId) paymentData.upiId = upiId;
      if (method === 'CHEQUE') {
        if (chequeNumber) paymentData.chequeNumber = chequeNumber;
        if (bankName) paymentData.bankName = bankName;
      }

      const response = await fetch('/api/billing/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (data.success) {
        alert('Payment recorded successfully!');
        router.push(`/receptionist/billing/payments/${data.data.paymentId}`);
      } else {
        alert(data.error || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Failed to record payment:', error);
      alert('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((invoice) =>
    invoice.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedInvoice = invoices.find((inv) => inv._id === selectedInvoiceId);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/receptionist/billing"
          className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
        >
          ← Back to Billing
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Record Payment</h1>
        <p className="mt-2 text-gray-600">Record a payment for an invoice</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Select Invoice */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Invoice</h2>
          
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by Invoice ID, Patient Name, or Patient ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredInvoices.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No pending invoices found
              </p>
            ) : (
              filteredInvoices.map((invoice) => (
                <label
                  key={invoice._id}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    selectedInvoiceId === invoice._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="invoiceId"
                      value={invoice._id}
                      checked={selectedInvoiceId === invoice._id}
                      onChange={(e) => {
                        setSelectedInvoiceId(e.target.value);
                        const inv = invoices.find((i) => i._id === e.target.value);
                        if (inv) setAmount(inv.amountDue.toString());
                      }}
                      className="mr-4 h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{invoice.invoiceId}</div>
                      <div className="text-sm text-gray-600">
                        {invoice.patientName} ({invoice.patientId})
                      </div>
                      <div className="text-xs text-gray-500">
                        Order: {invoice.orderId}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-red-600">₹{invoice.amountDue.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">Due</div>
                    <div className="text-xs text-gray-400">Total: ₹{invoice.total.toFixed(2)}</div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Payment Details */}
        {selectedInvoice && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedInvoice.amountDue}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum: ₹{selectedInvoice.amountDue.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="NET_BANKING">Net Banking</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="WALLET">Wallet</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Transaction reference number"
                />
              </div>

              {/* Method-specific fields */}
              {method === 'CARD' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Last 4 Digits (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={cardLast4}
                    onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1234"
                  />
                </div>
              )}

              {method === 'UPI' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    UPI ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="user@upi"
                  />
                </div>
              )}

              {method === 'CHEQUE' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cheque Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={chequeNumber}
                      onChange={(e) => setChequeNumber(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Cheque number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Bank name"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes..."
              />
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Invoice Total:</span>
                  <span className="font-medium">₹{selectedInvoice.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Already Paid:</span>
                  <span className="font-medium">₹{selectedInvoice.amountPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Due:</span>
                  <span className="font-medium text-red-600">₹{selectedInvoice.amountDue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">This Payment:</span>
                  <span className="font-medium text-green-600">₹{(parseFloat(amount) || 0).toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between">
                  <span className="font-semibold text-gray-900">Remaining Due:</span>
                  <span className="font-bold text-xl text-blue-600">
                    ₹{Math.max(0, selectedInvoice.amountDue - (parseFloat(amount) || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || !selectedInvoiceId || !amount}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Recording Payment...' : 'Record Payment'}
          </button>
          <Link
            href="/receptionist/billing"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
