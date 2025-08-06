import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const ClientDetail = () => {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    },
    status: ''
  });
  const [orders, setOrders] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await api.get(`/api/users/${id}`);
        setClient(response.data);
        setEditData({
          name: response.data.name,
          email: response.data.email,
          company: response.data.company || '',
          phone: response.data.phone || '',
          address: {
            street: response.data.address?.street || '',
            city: response.data.address?.city || '',
            state: response.data.address?.state || '',
            postalCode: response.data.address?.postalCode || '',
            country: response.data.address?.country || ''
          },
          status: response.data.status || 'active'
        });
      } catch (error) {
        toast.error('Failed to fetch client details');
        console.error('Error fetching client:', error);
        // Redirect back to clients list if client not found
        if (error.response?.status === 404) {
          navigate('/manager/clients');
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchRelatedData = async () => {
      try {
        setLoadingRelated(true);
        // Fetch client orders - using the correct parameter name for client filtering
        const ordersResponse = await api.get(`/api/orders?client=${id}`);
        setOrders(ordersResponse.data.orders || []);
        
        // Fetch client claims
        const claimsResponse = await api.get(`/api/claims?client=${id}`);
        setClaims(claimsResponse.data.claims || []);
      } catch (error) {
        console.error('Error fetching related data:', error);
        // Set empty arrays if fetch fails to prevent undefined errors
        setOrders([]);
        setClaims([]);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchClient();
    fetchRelatedData();
  }, [id, navigate]);

  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format address into a readable string
  const formatAddress = (address) => {
    if (!address) return 'Not specified';
    if (typeof address === 'string') return address;
    
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city && address.state) parts.push(`${address.city}, ${address.state}`);
    else if (address.city) parts.push(address.city);
    else if (address.state) parts.push(address.state);
    if (address.postalCode) parts.push(address.postalCode);
    if (address.country) parts.push(address.country);
    
    return parts.length > 0 ? parts.join(', ') : 'Not specified';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    
    if (!editData.name || !editData.email) {
      toast.error('Name and email are required');
      return;
    }

    try {
      setUpdating(true);
      await api.put(`/api/users/${id}`, editData);
      
      // Refresh client data
      const response = await api.get(`/api/users/${id}`);
      setClient(response.data);
      
      setShowEditModal(false);
      toast.success('Client updated successfully');
    } catch (error) {
      toast.error('Failed to update client');
      console.error('Error updating client:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      await api.put(`/api/users/${id}/status`, { status: newStatus });
      
      // Refresh client data
      const response = await api.get(`/api/users/${id}`);
      setClient(response.data);
      
      toast.success(`Client status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update client status');
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
            <p className="text-gray-500">Client not found</p>
            <Link
              to="/manager/clients"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Back to Clients
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{client.name}</h1>
          <Link
            to="/manager/clients"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Back to Clients
          </Link>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Client Information</h3>
              <div className="flex space-x-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${(client.status === 'active' || client.isActive) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {client.status || (client.isActive ? 'Active' : 'Inactive')}
                </span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{client.name}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{client.email}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Company</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{client.company || 'Not specified'}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{client.phone || 'Not specified'}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Shipping Address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatAddress(client.address)}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Joined on</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(client.createdAt)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Client Management Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Client Management</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Edit Client
              </button>
              {client.status !== 'active' && (
                <button
                  type="button"
                  onClick={() => handleStatusChange('active')}
                  disabled={updating}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Updating...' : 'Activate Client'}
                </button>
              )}
              {client.status !== 'inactive' && (
                <button
                  type="button"
                  onClick={() => handleStatusChange('inactive')}
                  disabled={updating}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Updating...' : 'Deactivate Client'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Client Orders Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Orders</h3>
          </div>
          <div className="border-t border-gray-200">
            {loadingRelated ? (
              <div className="px-4 py-5 sm:p-6 text-center">
                <div className="animate-spin inline-block rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : orders.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <li key={order._id} className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link to={`/manager/orders/${order._id}`} className="text-primary-600 hover:text-primary-900">
                          Order #{order.orderNumber}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="flex items-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-800' : order.status === 'in progress' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-5 sm:p-6 text-center">
                <p className="text-gray-500">No orders found for this client</p>
              </div>
            )}
          </div>
        </div>

        {/* Client Claims Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Claims</h3>
          </div>
          <div className="border-t border-gray-200">
            {loadingRelated ? (
              <div className="px-4 py-5 sm:p-6 text-center">
                <div className="animate-spin inline-block rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : claims.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {claims.map((claim) => (
                  <li key={claim._id} className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link to={`/manager/claims/${claim._id}`} className="text-primary-600 hover:text-primary-900">
                          {claim.title}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">{formatDate(claim.createdAt)}</p>
                      </div>
                      <div>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${claim.status === 'resolved' ? 'bg-green-100 text-green-800' : claim.status === 'in progress' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {claim.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-5 sm:p-6 text-center">
                <p className="text-gray-500">No claims found for this client</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Client Modal */}
      {showEditModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Edit Client
                    </h3>
                    <div className="mt-2">
                      <form onSubmit={handleUpdateClient}>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                          <div className="sm:col-span-3">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                              Name *
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="name"
                                id="name"
                                value={editData.name}
                                onChange={handleInputChange}
                                required
                                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>

                          <div className="sm:col-span-3">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                              Email *
                            </label>
                            <div className="mt-1">
                              <input
                                type="email"
                                name="email"
                                id="email"
                                value={editData.email}
                                onChange={handleInputChange}
                                required
                                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>

                          <div className="sm:col-span-3">
                            <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                              Company
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="company"
                                id="company"
                                value={editData.company}
                                onChange={handleInputChange}
                                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>

                          <div className="sm:col-span-3">
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                              Phone
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="phone"
                                id="phone"
                                value={editData.phone}
                                onChange={handleInputChange}
                                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>

                          <div className="sm:col-span-6">
                            <label htmlFor="address.street" className="block text-sm font-medium text-gray-700">
                              Street Address
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="address.street"
                                id="address.street"
                                value={editData.address?.street || ''}
                                onChange={(e) => setEditData({
                                  ...editData,
                                  address: {
                                    ...editData.address,
                                    street: e.target.value
                                  }
                                })}
                                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                          
                          <div className="sm:col-span-3">
                            <label htmlFor="address.city" className="block text-sm font-medium text-gray-700">
                              City
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="address.city"
                                id="address.city"
                                value={editData.address?.city || ''}
                                onChange={(e) => setEditData({
                                  ...editData,
                                  address: {
                                    ...editData.address,
                                    city: e.target.value
                                  }
                                })}
                                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                          
                          <div className="sm:col-span-3">
                            <label htmlFor="address.state" className="block text-sm font-medium text-gray-700">
                              State / Province
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="address.state"
                                id="address.state"
                                value={editData.address?.state || ''}
                                onChange={(e) => setEditData({
                                  ...editData,
                                  address: {
                                    ...editData.address,
                                    state: e.target.value
                                  }
                                })}
                                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                          
                          <div className="sm:col-span-3">
                            <label htmlFor="address.postalCode" className="block text-sm font-medium text-gray-700">
                              ZIP / Postal Code
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="address.postalCode"
                                id="address.postalCode"
                                value={editData.address?.postalCode || ''}
                                onChange={(e) => setEditData({
                                  ...editData,
                                  address: {
                                    ...editData.address,
                                    postalCode: e.target.value
                                  }
                                })}
                                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                          
                          <div className="sm:col-span-3">
                            <label htmlFor="address.country" className="block text-sm font-medium text-gray-700">
                              Country
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="address.country"
                                id="address.country"
                                value={editData.address?.country || ''}
                                onChange={(e) => setEditData({
                                  ...editData,
                                  address: {
                                    ...editData.address,
                                    country: e.target.value
                                  }
                                })}
                                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>

                          <div className="sm:col-span-3">
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                              Status
                            </label>
                            <div className="mt-1">
                              <select
                                id="status"
                                name="status"
                                value={editData.status}
                                onChange={handleInputChange}
                                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleUpdateClient}
                  disabled={updating}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Updating...' : 'Update'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetail;