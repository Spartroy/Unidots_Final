import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, DocumentTextIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import useAutoRefresh from '../../hooks/useAutoRefresh';


const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  const searchParam = searchParams.get('search');
  const employeeParam = searchParams.get('employee');
  
  const [filter, setFilter] = useState(filterParam || 'all'); // all, pending, in-prepress, completed
  const [searchTerm, setSearchTerm] = useState(searchParam || '');
  const [selectedEmployee, setSelectedEmployee] = useState(employeeParam || '');
  const [pagination, setPagination] = useState({
    page: parseInt(pageParam) || 1,
    pages: 1,
    total: 0
  });
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(limitParam) || 10);
  const [employees, setEmployees] = useState([]);
  const [assigningOrder, setAssigningOrder] = useState(null);
  const [selectedEmployeeForAssign, setSelectedEmployeeForAssign] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      let endpoint = `/api/orders?page=${pagination.page}&limit=${itemsPerPage}`;
      if (filter === 'all') {
        endpoint += '&status[ne]=Cancelled';
      } else if (filter === 'assigned') {
        endpoint += '&assignedTo[ne]=null';
      } else if (filter !== 'all') {
        const statusMap = {
          'pending': 'Submitted',
          'designing': 'Designing',
          'in-prepress': 'In Prepress',
          'completed': 'Completed',
          'cancelled': 'Cancelled'
        };
        const formattedStatus = statusMap[filter] || filter;
        endpoint += `&status=${formattedStatus}`;
      }
      if (searchTerm) endpoint += `&search=${encodeURIComponent(searchTerm)}`;
      if (selectedEmployee) endpoint += `&assignedTo=${selectedEmployee}`;
      const response = await api.get(endpoint);
      setOrders(response.data.orders || []);
      setPagination({
        page: response.data.page || 1,
        pages: response.data.pages || 1,
        total: response.data.total || 0
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, pagination.page, itemsPerPage, searchTerm, selectedEmployee]);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await api.get('/api/users?role=employee');
      setEmployees(response.data.users || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchEmployees();
  }, [fetchOrders, fetchEmployees]);

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
    if (searchParam) {
      setSearchTerm(searchParam);
    }
    if (employeeParam) {
      setSelectedEmployee(employeeParam);
    }
  }, [filterParam, pageParam, limitParam, searchParam, employeeParam]);

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

  // Handle employee filter
  const handleEmployeeFilter = (e) => {
    const value = e.target.value;
    setSelectedEmployee(value);
    setPagination(prev => ({...prev, page: 1})); // Reset to page 1 when filtering
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('employee', value);
    } else {
      newParams.delete('employee');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

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
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  // Get status badge color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case 'Submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'Designing':
      case 'In Production':
      case 'In Prepress': 
      case 'In Review':
      case 'Ready for Production':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'On Hold':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // We're now using server-side filtering, so we don't need client-side filtering
  // Just display the orders directly
  const filteredOrders = orders;

  const handleAssignOrder = async () => {
    if (!selectedEmployeeForAssign || !assigningOrder) return;

    try {
      setIsAssigning(true);
      await api.put(`/api/orders/${assigningOrder}/assign`, { employeeId: selectedEmployeeForAssign });
      
      // Refresh orders list
      const response = await api.get(`/api/orders?page=${pagination.page}&limit=${itemsPerPage}`);
      setOrders(response.data.orders || []);
      
      toast.success('Order assigned successfully');
      setAssigningOrder(null);
      setSelectedEmployeeForAssign('');
    } catch (error) {
      toast.error('Failed to assign order');
      console.error('Error assigning order:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header and Filter buttons - Mobile responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Orders</h1>
        
        {/* Filter buttons - Horizontal scrollable on mobile */}
        <div className="flex overflow-x-auto scrollbar-hide space-x-2 pb-2 sm:pb-0">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
          >
            All Orders
          </button>
          <button
            onClick={() => handleFilterChange('assigned')}
            className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 ${filter === 'assigned' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
          >
            Assigned Orders
          </button>
          <button
            onClick={() => handleFilterChange('pending')}
            className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 ${filter === 'pending' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
          >
            Pending
          </button>
          <button
            onClick={() => handleFilterChange('designing')}
            className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 ${filter === 'designing' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
          >
            Designing
          </button>
          <button
            onClick={() => handleFilterChange('in-prepress')}
            className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 ${filter === 'in-prepress' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
          >
            In Prepress
          </button>
          <button
            onClick={() => handleFilterChange('completed')}
            className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 ${filter === 'completed' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Search, Order count and filters - Mobile responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="text-sm text-gray-500">
            Showing {orders.length} of {pagination.total} orders
          </div>
          <div className="relative w-full sm:max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
              placeholder="Search orders by number or title..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        
        {/* Employee Filter and Items per page - Stack on mobile */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <select
            value={selectedEmployee}
            onChange={handleEmployeeFilter}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
          >
            <option value="">All Employees</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.name}
              </option>
            ))}
          </select>
          
          <select
            value={itemsPerPage}
            onChange={handlePageSizeChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
                </div>
      </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
            <p className="text-gray-500">No orders found matching the selected filter.</p>
          </div>
        ) : (
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <li key={order._id}>
                  <div className="px-4 py-4 sm:px-6">
                    {/* Order card layout with centered button */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      {/* Left side content - moved up slightly */}
                      <div className="flex-1 space-y-2">
                        {/* Order header */}
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-primary-600 truncate">
                            Order #{order.orderNumber}
                          </p>
                          <div className="flex-shrink-0">
                            <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                              {(order.status || 'Unknown').toString().replace('_', ' ').toUpperCase()}
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
                            <span className="truncate">{order.orderType || 'Standard'}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <span>Client: {order.client?.name || 'Unknown'}</span>
                          </div>
                        </div>
                        
                        {/* Additional details */}
                        <div className="space-y-1 sm:space-y-0 sm:flex sm:space-x-6">
                          <div className="flex items-center text-sm text-gray-500">
                            <span>Due: {formatDate(order.deadline)}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <span>Priority: {order.priority || 'Normal'}</span>
                          </div>
                          {order.assignedTo && (
                            <div className="flex items-center text-sm text-gray-500">
                              <span>Assigned to: {order.assignedTo.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Right side - centered button */}
                      <div className="flex-shrink-0 flex justify-end sm:justify-center sm:items-center">
                        <Link
                          to={`/manager/orders/${order._id}`}
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
        )}

        {/* Pagination controls */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-md shadow mt-6">
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

        {/* Assignment Modal */}
        {assigningOrder && (
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
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Assign Order to Employee</h3>
                      <div className="mt-2">
                        <select
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                          value={selectedEmployeeForAssign}
                          onChange={(e) => setSelectedEmployeeForAssign(e.target.value)}
                        >
                          <option value="">Select an employee</option>
                          {employees.map((employee) => (
                            <option key={employee._id} value={employee._id}>
                              {employee.name} - {employee.department}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm ${isAssigning ? 'opacity-75 cursor-not-allowed' : ''}`}
                    onClick={handleAssignOrder}
                    disabled={isAssigning || !selectedEmployeeForAssign}
                  >
                    {isAssigning ? 'Assigning...' : 'Assign'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => {
                      setAssigningOrder(null);
                      setSelectedEmployeeForAssign('');
                    }}
                    disabled={isAssigning}
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

export default Orders;