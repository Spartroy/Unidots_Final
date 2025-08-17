import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import AuthContext from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { ChevronLeftIcon, ChevronRightIcon, DocumentTextIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import '../../utils/resizeObserverFix'; // Import ResizeObserver fix

const PrepressOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');

  const [filter, setFilter] = useState(filterParam || 'active');
  const [pagination, setPagination] = useState({
    page: parseInt(pageParam) || 1,
    pages: 1,
    total: 0
  });
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(limitParam) || 10);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      let endpoint = `/api/orders?page=${pagination.page}&limit=${itemsPerPage}`;
      if (filter === 'active') endpoint += '&status=In Prepress';
      else if (filter === 'completed') endpoint += '&status=Completed';
      else if (filter === 'all') endpoint += '&status[$in]=In Prepress,Completed';
      const response = await api.get(endpoint);
      setOrders(response.data.orders || []);
      setPagination({
        page: response.data.page || 1,
        pages: response.data.pages || 1,
        total: response.data.total || 0
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filter, pagination.page, itemsPerPage]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useAutoRefresh(fetchOrders, 60000, [fetchOrders]); // 60 seconds (1 minute)

  // Set active filter and pagination based on URL parameters when component mounts
  useEffect(() => {
    if (filterParam) {
      setFilter(filterParam);
    }
    if (pageParam) {
      setPagination(prev => ({...prev, page: parseInt(pageParam) || 1}));
    }
    if (limitParam) {
      setItemsPerPage(parseInt(limitParam) || 10);
    }
  }, [filterParam, pageParam, limitParam]);

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPagination(prev => ({...prev, page: 1})); // Reset to page 1 when changing filters
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    newParams.set('filter', newFilter);
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

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  // Get the count of completed prepress sub-processes for an order
  const getCompletedProcessCount = (order) => {
    if (!order.stages?.prepress?.subProcesses) return 0;
    
    let count = 0;
    const subProcesses = order.stages.prepress.subProcesses;
    
    if (subProcesses.positioning?.status === 'Completed') count++;
    if (subProcesses.laserImaging?.status === 'Completed') count++;
    if (subProcesses.exposure?.status === 'Completed') count++;
    if (subProcesses.washout?.status === 'Completed') count++;
    if (subProcesses.drying?.status === 'Completed') count++;
    if (subProcesses.finishing?.status === 'Completed') count++;
    
    return count;
  };

  // Get total number of sub-processes for an order
  const getTotalProcessCount = (order) => {
    // Always return 6 since there are 6 prepress sub-processes
    return 6;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header and Filter buttons - Mobile responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Prepress Orders</h1>
        
        {/* Filter buttons - Horizontal scrollable on mobile */}
        <div className="flex overflow-x-auto scrollbar-hide space-x-2 pb-2 sm:pb-0">
          <button
            onClick={() => handleFilterChange('active')}
            className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 ${filter === 'active' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
          >
            Active
          </button>
          <button
            onClick={() => handleFilterChange('completed')}
            className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 ${filter === 'completed' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
          >
            Completed
          </button>
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
          >
            All Orders
          </button>
        </div>
      </div>

      {/* Order count display - Mobile responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <div className="text-sm text-gray-500">
          Showing {orders.length} of {pagination.total} orders
        </div>
      </div>
      
      {orders.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {orders.map((order) => (
              <li key={order._id}>
                <div className="px-4 py-4 sm:px-6">
                  {/* Order card layout with centered button */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    {/* Left side content */}
                    <div className="flex-1 space-y-2">
                      {/* Order header */}
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium text-primary-600 truncate">
                          Order #{order.orderNumber}: {order.title}
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {order.status === 'Completed' ? 'Completed' : `${getCompletedProcessCount(order)}/${getTotalProcessCount(order)} Processes Done`}
                          </span>
                        </div>
                      </div>
                      
                      {/* Order details */}
                      <div className="space-y-1 sm:space-y-0 sm:flex sm:space-x-6">
                        <div className="flex items-center text-sm text-gray-500">
                          <DocumentTextIcon className="flex-shrink-0 mr-1.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" aria-hidden="true" />
                          <span className="truncate">{order.title || 'Untitled Order'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <ArrowTrendingUpIcon className="flex-shrink-0 mr-1.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" aria-hidden="true" />
                          <span className="truncate">{order.status || 'Unknown Status'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <span>Client: {order.client?.name || 'Unknown'}</span>
                        </div>
                      </div>
                      
                      {/* Additional details */}
                      <div className="space-y-1 sm:space-y-0 sm:flex sm:space-x-6">
                        <div className="flex items-center text-sm text-gray-500">
                          <span>Submitted: {formatDate(order.createdAt)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <span>Priority: {order.priority}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right side - centered button */}
                    <div className="flex-shrink-0 flex justify-end sm:justify-center sm:items-center">
                      <Link
                        to={`/prepress/orders/${order._id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6 text-center">
            <p className="text-sm text-gray-500">No orders found for the selected filter.</p>
          </div>
        </div>
      )}
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6 text-center">
            <p className="text-sm text-gray-500">No orders found for the selected filter.</p>
          </div>
        </div>
      )}

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

export default PrepressOrders; 