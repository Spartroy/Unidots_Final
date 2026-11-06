import React, { useCallback, useEffect, useState } from 'react';
import api from '../../utils/api';
import { Link } from 'react-router-dom';

const VIEW_BUTTON = 'inline-flex items-center justify-center min-h-[44px] px-5 py-2 rounded-md bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex-shrink-0';

const CourierDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('handover');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all orders that have delivery method chosen (not just Ready for Delivery)
      const res = await api.get('/api/orders?hasDeliveryMethod=true');
      setOrders(res.data.orders || []);
    } catch (e) {
      console.error('Error fetching orders:', e);
      setError(e.response?.data?.message || 'We could not load your deliveries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filter orders by delivery method and status
  const handoverOrders = orders.filter(order => 
    (order.stages?.delivery?.courierInfo?.mode === 'direct' || 
     order.stages?.delivery?.courierInfo?.mode === 'client-collection') &&
    order.status !== 'Completed'
  );
  
  const shippingOrders = orders.filter(order => 
    order.stages?.delivery?.courierInfo?.mode === 'shipping-company' &&
    order.status !== 'Completed'
  );

  const deliveredOrders = orders.filter(order => 
    order.status === 'Completed'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        <span className="sr-only">Loading deliveries</span>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-sm text-red-700 mb-4">{error}</p>
        <button type="button" onClick={fetchOrders} className={VIEW_BUTTON}>Try again</button>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <h2 className="text-lg font-semibold mb-4">My Deliveries</h2>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hide">
        <nav className="-mb-px flex space-x-6 min-w-max">
          <button
            onClick={() => setActiveTab('handover')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'handover'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Handover ({handoverOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'shipping'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Shipping Company ({shippingOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('delivered')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'delivered'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Delivered ({deliveredOrders.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'handover' && (
        <div>
          {handoverOrders.length === 0 ? (
            <p className="text-gray-500">No handover orders ready for delivery</p>
          ) : (
            <ul className="divide-y divide-gray-200 bg-white rounded-md shadow">
              {handoverOrders.map((o) => (
                <li key={o._id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{o.orderNumber} - {o.title}</div>
                    <div className="text-sm text-gray-500">Client: {o.client?.name}</div>
                    <div className="text-xs text-gray-400">
                      {o.stages?.delivery?.courierInfo?.mode === 'direct' ? 'Direct Handover' : 'Client Self-Collection'}
                    </div>
                  </div>
                  <Link to={`/courier/orders/${o._id}`} className={VIEW_BUTTON}>View</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'shipping' && (
        <div>
          {shippingOrders.length === 0 ? (
            <p className="text-gray-500">No shipping company orders ready for delivery</p>
          ) : (
            <ul className="divide-y divide-gray-200 bg-white rounded-md shadow">
              {shippingOrders.map((o) => (
                <li key={o._id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{o.orderNumber} - {o.title}</div>
                    <div className="text-sm text-gray-500">Client: {o.client?.name}</div>
                    <div className="text-xs text-gray-400">
                      Shipping Company: {o.stages?.delivery?.courierInfo?.shipmentCompany || 'Middle East'}
                    </div>
                  </div>
                  <Link to={`/courier/orders/${o._id}`} className={VIEW_BUTTON}>View</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'delivered' && (
        <div>
          {deliveredOrders.length === 0 ? (
            <p className="text-gray-500">No delivered orders found</p>
          ) : (
            <ul className="divide-y divide-gray-200 bg-white rounded-md shadow">
              {deliveredOrders.map((o) => (
                <li key={o._id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{o.orderNumber} - {o.title}</div>
                    <div className="text-sm text-gray-500">Client: {o.client?.name}</div>
                    <div className="text-xs text-gray-400">
                      {o.stages?.delivery?.courierInfo?.mode === 'direct' ? 'Direct Handover' : 
                       o.stages?.delivery?.courierInfo?.mode === 'client-collection' ? 'Client Self-Collection' :
                       o.stages?.delivery?.courierInfo?.mode === 'shipping-company' ? 'Shipping Company' : 'Unknown'}
                      {o.stages?.delivery?.courierInfo?.mode === 'shipping-company' && 
                        ` (${o.stages?.delivery?.courierInfo?.shipmentCompany || 'Middle East'})`}
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                      Delivered on {new Date(o.stages?.delivery?.completionDate || o.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Link to={`/courier/orders/${o._id}`} className={VIEW_BUTTON}>View</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default CourierDashboard;


