import React, { useState, useEffect, useContext } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import AuthContext from '../../context/AuthContext';
import { DocumentTextIcon, ArrowTrendingUpIcon, ExclamationCircleIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const ClientOrders = () => {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status');
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  const searchParam = searchParams.get('search');
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(statusFilter || 'all');
  const [searchTerm, setSearchTerm] = useState(searchParam || '');
  const [pagination, setPagination] = useState({
    page: parseInt(pageParam) || 1,
    pages: 1,
    total: 0
  });
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(limitParam) || 10);
  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        
        // Construct the API endpoint based on the filter and pagination
        let endpoint = `/api/orders?page=${pagination.page}&limit=${itemsPerPage}`;
        if (activeFilter === 'all') {
          // Explicitly exclude cancelled orders from 'all' view
          endpoint += '&status[ne]=Cancelled';
        } else if (activeFilter !== 'all') {
          endpoint += `&status=${activeFilter}`;
        }

        // Add search parameter
        if (searchTerm) {
          endpoint += `&search=${encodeURIComponent(searchTerm)}`;
        }
        
        const response = await api.get(endpoint);
        // Update orders and pagination information
        setOrders(response.data.orders || []);
        setPagination({
          page: response.data.page || 1,
          pages: response.data.pages || 1,
          total: response.data.total || 0
        });
      } catch (error) {
        toast.error('Failed to load orders');
        console.error('Orders fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [activeFilter, pagination.page, itemsPerPage, searchTerm]);
  
  // Set active filter and pagination based on URL parameters when component mounts
  useEffect(() => {
    if (statusFilter) {
      setActiveFilter(statusFilter);
    }
    if (pageParam) {
      setPagination(prev => ({...prev, page: parseInt(pageParam) || 1}));
    }
    if (limitParam) {
      setItemsPerPage(parseInt(limitParam) || 10);
    }
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [statusFilter, pageParam, limitParam, searchParam]);

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setPagination(prev => ({...prev, page: 1})); // Reset to page 1 when searching
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('search', value);
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Handle filter change
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setPagination(prev => ({...prev, page: 1})); // Reset to page 1 when changing filters
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (filter === 'all') {
      newParams.delete('status');
    } else {
      newParams.set('status', filter);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    
    setPagination(prev => ({...prev, page: newPage}));
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  // Handle page size change
  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setItemsPerPage(newSize);
    setPagination(prev => ({...prev, page: 1})); // Reset to page 1 when changing page size
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    newParams.set('limit', newSize.toString());
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  // Function to determine order status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Production':
      case 'In Prepress':
      case 'In Review':
        return 'bg-blue-100 text-blue-800';
      case 'Submitted':
      case 'Ready for Production':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'On Hold':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter buttons */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">My Orders</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${activeFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            All Orders
          </button>
          <button
            onClick={() => handleFilterChange('Submitted')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${activeFilter === 'Submitted' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Submitted
          </button>
          <button
            onClick={() => handleFilterChange('Designing')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${activeFilter === 'Designing' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Designing
          </button>
          <button
            onClick={() => handleFilterChange('In Prepress')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${activeFilter === 'In Prepress' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            In Prepress
          </button>
          <button
            onClick={() => handleFilterChange('Completed')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${activeFilter === 'Completed' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Completed
          </button>
          <button
            onClick={() => handleFilterChange('Cancelled')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${activeFilter === 'Cancelled' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Search, Order count and Create new order button */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Showing {orders.length} of {pagination.total} orders
          </div>
          <div className="relative max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Search orders by number or title..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        <Link
          to="/client/orders/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Create New Order
        </Link>
      </div>

      {/* Orders list */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {orders.length > 0 ? (
            orders.map((order) => (
              <li key={order._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-primary-600 truncate">
                        Order #{order.orderNumber}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {(order.status || 'Unknown').toString().replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <Link
                        to={`/client/orders/${order._id}`}
                        className="font-medium text-primary-600 hover:text-primary-500 text-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <DocumentTextIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                        {order.title || 'Untitled Order'}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        <ArrowTrendingUpIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                        {order.printType ? `${order.printType.charAt(0).toUpperCase() + order.printType.slice(1)} Printing` : 'Printing Order'}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        Ordered on {formatDate(order.createdAt)}
                      </p>
                      <p className="ml-6 font-medium">
                        {order.cost && typeof order.cost.estimatedCost === 'number'
                          ? `$${order.cost.estimatedCost.toFixed(0)}`
                          : '$0.00'}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-5 sm:px-6 text-center text-gray-500">
              {activeFilter === 'all' ? (
                <>
                  <p>You don't have any orders yet.</p>
                  <div className="mt-4">
                    <Link
                      to="/client/orders/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Create Your First Order
                    </Link>
                  </div>
                </>
              ) : activeFilter === 'Submitted' ? (
                <p>You don't have any submitted orders waiting for review.</p>
              ) : activeFilter === 'Designing' ? (
                <p>You don't have any orders currently in the design phase.</p>
              ) : activeFilter === 'In Prepress' ? (
                <p>You don't have any orders currently in prepress.</p>
              ) : activeFilter === 'Completed' ? (
                <p>You don't have any completed orders yet.</p>
              ) : activeFilter === 'Cancelled' ? (
                <p>You don't have any cancelled orders yet.</p>
              ) : (
                <p>No orders found for the selected filter.</p>
              )}
            </li>
          )}
        </ul>
      </div>

      {/* Pagination controls */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-md shadow">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${pagination.page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${pagination.page === pagination.pages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((pagination.page - 1) * itemsPerPage) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(pagination.page * itemsPerPage, pagination.total)}</span> of{' '}
                <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div className="flex items-center">
              <div className="mr-4">
                <label htmlFor="pageSize" className="mr-2 text-sm text-gray-700">
                  Show:
                </label>
                <select
                  id="pageSize"
                  value={itemsPerPage}
                  onChange={handlePageSizeChange}
                  className="rounded border-gray-300 py-1 text-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${pagination.page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {/* Optimized page numbers with ellipsis for many pages */}
                {pagination.pages <= 7 ? (
                  // Show all pages if 7 or fewer
                  Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${pagination.page === page ? 'bg-primary-600 text-white' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'}`}
                    >
                      {page}
                    </button>
                  ))
                ) : (
                  // Complex pagination with ellipsis
                  <>
                    {/* First page */}
                    <button
                      onClick={() => handlePageChange(1)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${pagination.page === 1 ? 'bg-primary-600 text-white' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'}`}
                    >
                      1
                    </button>
                    
                    {/* Left ellipsis */}
                    {pagination.page > 3 && (
                      <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                        ...
                      </span>
                    )}
                    
                    {/* Pages around current page */}
                    {Array.from(
                      { length: pagination.pages },
                      (_, i) => i + 1
                    )
                      .filter(page => {
                        if (page === 1 || page === pagination.pages) return false;
                        return Math.abs(page - pagination.page) <= 1;
                      })
                      .map(page => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${pagination.page === page ? 'bg-primary-600 text-white' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'}`}
                        >
                          {page}
                        </button>
                      ))
                    }
                    
                    {/* Right ellipsis */}
                    {pagination.page < pagination.pages - 2 && (
                      <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                        ...
                      </span>
                    )}
                    
                    {/* Last page */}
                    <button
                      onClick={() => handlePageChange(pagination.pages)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${pagination.page === pagination.pages ? 'bg-primary-600 text-white' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'}`}
                    >
                      {pagination.pages}
                    </button>
                  </>
                )}
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${pagination.page === pagination.pages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientOrders;