import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import AuthContext from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { ChevronLeftIcon, ChevronRightIcon, DocumentTextIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import useApiRequest from '../../hooks/useApiRequest';

const PrepressOrders = () => {
  const [orders, setOrders] = useState([]);
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

  // Use the new API request hook
  const { loading, error, execute: executeRequest } = useApiRequest();

  const fetchOrders = useCallback(async () => {
    try {
      let endpoint = `/api/orders?page=${pagination.page}&limit=${itemsPerPage}`;
      if (filter === 'active') endpoint += '&status=In Prepress';
      else if (filter === 'completed') endpoint += '&status=Completed';
      else if (filter === 'all') endpoint += '&status[$in]=In Prepress,Completed';
      
      const data = await executeRequest({
        method: 'GET',
        url: endpoint
      });
      
      setOrders(data.orders || []);
      setPagination({
        page: data.page || 1,
        pages: data.pages || 1,
        total: data.total || 0
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error('Failed to fetch orders');
      }
    }
  }, [filter, pagination.page, itemsPerPage, executeRequest]);

  useEffect(() => { 
    fetchOrders(); 
  }, [fetchOrders]);

  // Use auto-refresh with proper cleanup
  const { stopAutoRefresh } = useAutoRefresh(fetchOrders, 60000, [fetchOrders]);

  // Cleanup auto-refresh on unmount
  useEffect(() => {
    return () => {
      stopAutoRefresh();
    };
  }, [stopAutoRefresh]);

  // Set active filter and pagination based on URL parameters when component mounts
  useEffect(() => {
    if (filterParam) {
      setFilter(filterParam);
    }
    if (pageParam) {
      setPagination(prev => ({ ...prev, page: parseInt(pageParam) || 1 }));
    }
    if (limitParam) {
      setItemsPerPage(parseInt(limitParam) || 10);
    }
  }, [filterParam, pageParam, limitParam]);

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 when changing filters

    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    newParams.set('filter', newFilter);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;

    setPagination(prev => ({ ...prev, page: newPage }));

    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  // Handle page size change
  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setItemsPerPage(newSize);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 when changing page size

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
    if (subProcesses.backExposure?.status === 'Completed') count++;
    if (subProcesses.laserImaging?.status === 'Completed') count++;
    if (subProcesses.mainExposure?.status === 'Completed') count++;
    if (subProcesses.washout?.status === 'Completed') count++;
    if (subProcesses.drying?.status === 'Completed') count++;
    if (subProcesses.postExposure?.status === 'Completed') count++;
    if (subProcesses.uvcExposure?.status === 'Completed') count++;
    if (subProcesses.finishing?.status === 'Completed') count++;

    return count;
  };

  // Get total number of sub-processes for an order
  const getTotalProcessCount = (order) => {
    // Always return 9 since there are 9 prepress sub-processes
    return 9;
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
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900"></h1>

        {/* Filter buttons - Enhanced styling with better visual hierarchy */}
        <div className="flex overflow-x-auto scrollbar-hide space-x-3 pb-2 sm:pb-0">
          <button
            onClick={() => handleFilterChange('active')}
            className={`px-6 py-3 text-sm font-semibold rounded-lg whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
              filter === 'active' 
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 transform scale-105' 
                : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-primary-600 border-2 border-gray-200 hover:border-primary-300'
            }`}
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className={`w-2 h-2 rounded-full ${filter === 'active' ? 'bg-white' : 'bg-blue-500'}`}></div>
              <span>الحالية</span>
            </div>
          </button>
          <button
            onClick={() => handleFilterChange('completed')}
            className={`px-6 py-3 text-sm font-semibold rounded-lg whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
              filter === 'completed' 
                ? 'bg-green-600 text-white shadow-lg shadow-green-200 transform scale-105' 
                : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-green-600 border-2 border-gray-200 hover:border-green-300'
            }`}
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className={`w-2 h-2 rounded-full ${filter === 'completed' ? 'bg-white' : 'bg-green-500'}`}></div>
              <span>المكتملة</span>
            </div>
          </button>
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-6 py-3 text-sm font-semibold rounded-lg whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
              filter === 'all' 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 transform scale-105' 
                : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-purple-600 border-2 border-gray-200 hover:border-purple-300'
            }`}
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className={`w-2 h-2 rounded-full ${filter === 'all' ? 'bg-white' : 'bg-purple-500'}`}></div>
              <span>الكل</span>
            </div>
          </button>
        </div>
      </div>

      {/* Order count display - Enhanced styling */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100 rounded-lg p-4 mb-6" dir="rtl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
          <div className="text-center sm:text-right">
            <div className="text-2xl font-bold text-primary-700 mb-1">
              {orders.length}
            </div>
            <div className="text-sm text-primary-600 font-medium">
              من {pagination.total} أوردر
            </div>
          </div>
          <div className="flex items-center justify-center sm:justify-start">
            <ArrowTrendingUpIcon className="w-8 h-8 text-primary-500 mr-2" />
            <div className="text-sm text-primary-600">
              {filter === 'active' ? 'أوردرات نشطة' : filter === 'completed' ? 'أوردرات مكتملة' : 'جميع الأوردرات'}
            </div>
          </div>
        </div>
      </div>

      {orders.length > 0 ? (
        <div className="bg-white shadow-lg overflow-hidden sm:rounded-lg border border-gray-100" dir="rtl">
          <ul className="divide-y divide-gray-100">
            {orders.map((order) => (
              <li key={order._id} className="hover:bg-gray-50 transition-colors duration-150">
                <div className="px-6 py-6 sm:px-8">
                  {/* Order card layout with improved spacing and alignment */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0" dir="rtl">
                    {/* Main content area with better text hierarchy */}
                    <div className="flex-1 space-y-4">
                      {/* Order header with improved spacing */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
                            {order.orderNumber}: {order.title}
                          </h3>
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${order.status === 'Completed' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                              {order.status === 'Completed' ? 'مكتمل' : `${getCompletedProcessCount(order)}/${getTotalProcessCount(order)} عمليات مكتملة`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Order details with improved layout and typography */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-right">
                        <div className="space-y-1">
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">اسم الأوردر</dt>
                          <dd className="text-sm font-medium text-gray-900 truncate">{order.title || 'Untitled Order'}</dd>
                        </div>
                        <div className="space-y-1">
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">اسم العميل</dt>
                          <dd className="text-sm font-medium text-gray-900">{order.client?.name || 'Unknown'}</dd>
                        </div>
                        <div className="space-y-1">
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">يوم الإستلام</dt>
                          <dd className="text-sm font-medium text-gray-900">{formatDate(order.createdAt)}</dd>
                        </div>
                      </div>
                    </div>

                    {/* Action button with improved styling */}
                    <div className="flex-shrink-0 flex justify-start lg:justify-center lg:items-center">
                      <Link
                        to={`/prepress/orders/${order._id}`}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                      >
                        <DocumentTextIcon className="w-4 h-4 ml-2" />
                        تفاصيل الأوردر
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white shadow-lg overflow-hidden sm:rounded-lg border border-gray-100">
          <div className="px-6 py-12 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد أوردرات</h3>
            <p className="text-sm text-gray-500">لم يتم العثور على أوردرات للفلتر المحدد.</p>
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