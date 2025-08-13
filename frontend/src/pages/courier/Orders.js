import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Link } from 'react-router-dom';

const CourierOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('handover');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/orders?status=Ready for Delivery');
        setOrders(res.data.orders || []);
      } catch (e) {
        console.error('Error fetching orders:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Filter orders by delivery method
  const handoverOrders = orders.filter(order => 
    order.stages?.delivery?.courierInfo?.mode === 'direct' || 
    order.stages?.delivery?.courierInfo?.mode === 'client-collection'
  );
  
  const shippingOrders = orders.filter(order => 
    order.stages?.delivery?.courierInfo?.mode === 'shipping-company'
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Orders</h2>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
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
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'handover' && (
        <div>
          {handoverOrders.length === 0 ? (
            <p className="text-gray-500">No handover orders ready for delivery</p>
          ) : (
            <ul className="divide-y divide-gray-200 bg-white rounded-md shadow">
              {handoverOrders.map(o => (
                <li key={o._id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{o.orderNumber} - {o.title}</div>
                    <div className="text-sm text-gray-500">Client: {o.client?.name}</div>
                    <div className="text-xs text-gray-400">
                      {o.stages?.delivery?.courierInfo?.mode === 'direct' ? 'Direct Handover' : 'Client Self-Collection'}
                    </div>
                  </div>
                  <Link to={`/courier/orders/${o._id}`} className="text-primary-600">Open</Link>
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
              {shippingOrders.map(o => (
                <li key={o._id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{o.orderNumber} - {o.title}</div>
                    <div className="text-sm text-gray-500">Client: {o.client?.name}</div>
                    <div className="text-xs text-gray-400">
                      Shipping Company: {o.stages?.delivery?.courierInfo?.shipmentCompany || 'Middle East'}
                    </div>
                  </div>
                  <Link to={`/courier/orders/${o._id}`} className="text-primary-600">Open</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default CourierOrders;


