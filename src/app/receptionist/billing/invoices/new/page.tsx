'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Order {
  _id: string;
  orderId: string;
  patientName: string;
  patientId: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedOrderId = searchParams.get('orderId');

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState(preSelectedOrderId || '');
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // Fetch orders that don't have invoices yet
      const response = await fetch('/api/receptionist/orders');
      const data = await response.json();

      if (data.success) {
        // Filter orders that need invoicing (CONFIRMED status without invoices)
        const ordersList = data.data.orders.filter(
          (order: any) => ['CONFIRMED', 'SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED'].includes(order.status)
        );
        setOrders(ordersList);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrderId) {
      alert('Please select an order');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderId,
          discount: parseFloat(discount.toString()) || 0,
          taxRate: parseFloat(taxRate.toString()) || 0,
          dueDate: dueDate || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Invoice created successfully!');
        router.push(`/receptionist/billing/invoices/${data.data.invoiceId}`);
      } else {
        alert(data.error || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Failed to create invoice:', error);
      alert('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) =>
    order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOrder = orders.find((o) => o._id === selectedOrderId);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/receptionist/billing"
          className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
        >
          ← Back to Billing
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
        <p className="mt-2 text-gray-600">Generate invoice from order</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Select Order */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Order</h2>
          
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by Order ID, Patient Name, or Patient ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No orders available for invoicing
              </p>
            ) : (
              filteredOrders.map((order) => (
                <label
                  key={order._id}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    selectedOrderId === order._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="orderId"
                      value={order._id}
                      checked={selectedOrderId === order._id}
                      onChange={(e) => setSelectedOrderId(e.target.value)}
                      className="mr-4 h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{order.orderId}</div>
                      <div className="text-sm text-gray-600">
                        {order.patientName} ({order.patientId})
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">₹{order.total.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{order.status}</div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Invoice Details */}
        {selectedOrder && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
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
                placeholder="Additional notes or instructions..."
              />
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Invoice Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₹{selectedOrder.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-red-600">-₹{discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax ({taxRate}%):</span>
                  <span className="font-medium">
                    ₹{((selectedOrder.total - discount) * taxRate / 100).toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between">
                  <span className="font-semibold text-gray-900">Total Amount:</span>
                  <span className="font-bold text-xl text-blue-600">
                    ₹{(selectedOrder.total - discount + ((selectedOrder.total - discount) * taxRate / 100)).toFixed(2)}
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
            disabled={loading || !selectedOrderId}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Creating Invoice...' : 'Create Invoice'}
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
