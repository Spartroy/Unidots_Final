import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, DocumentTextIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import '../../utils/resizeObserverFix'; // Import ResizeObserver fix

const Claims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  const searchParam = searchParams.get('search');
  
  const [filter, setFilter] = useState(filterParam || 'all'); // all, pending, in-progress, resolved, rejected
  const [searchTerm, setSearchTerm] = useState(searchParam || '');
  const [pagination, setPagination] = useState({
    page: parseInt(pageParam) || 1,
    pages: 1,
    total: 0
  });
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(limitParam) || 10);
  const [employees, setEmployees] = useState([]);
  const [assigningClaim, setAssigningClaim] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true);
      let endpoint = `/api/claims?page=${pagination.page}&limit=${itemsPerPage}`;
      if (filter !== 'all') {
        const statusMap = {
          'pending': 'Submitted',
          'in-progress': 'In Progress',
          'resolved': 'Resolved',
          'rejected': 'Rejected'
        };
        const formattedStatus = statusMap[filter] || filter;
        endpoint += `&status=${formattedStatus}`;
      }
      if (searchTerm) endpoint += `&search=${encodeURIComponent(searchTerm)}`;
      const response = await api.get(endpoint);
      setClaims(response.data.claims || []);
      setPagination({
        page: response.data.page || 1,
        pages: response.data.pages || 1,
        total: response.data.total || 0
      });
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, pagination.page, itemsPerPage, searchTerm]);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await api.get('/api/users?role=employee');
      setEmployees(response.data.users || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
    fetchEmployees();
  }, [fetchClaims, fetchEmployees]);

  useAutoRefresh(fetchClaims, 60000, [fetchClaims]); // 60 seconds (1 minute)

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
  }, [filterParam, pageParam, limitParam, searchParam]);

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
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case 'Submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAssignClaim = async () => {
    if (!selectedEmployee || !assigningClaim) return;

    try {
      setIsAssigning(true);
      await api.put(`/api/claims/${assigningClaim}/assign`, { employeeId: selectedEmployee });
      
      // Refresh claims list
      const endpoint = `/api/claims?page=${pagination.page}&limit=${itemsPerPage}`;
      const response = await api.get(endpoint);
      setClaims(response.data.claims || []);
      
      toast.success('Claim assigned successfully');
      setAssigningClaim(null);
      setSelectedEmployee('');
    } catch (error) {
      toast.error('Failed to assign claim');
      console.error('Error assigning claim:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header and Filter buttons - Mobile responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Claims</h1>
        
        {/* Filter buttons - Horizontal scrollable on mobile */}
        <div className="flex overflow-x-auto scrollbar-hide space-x-2 pb-2 sm:pb-0">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
          >
            All Claims
          </button>
          <button
            onClick={() => handleFilterChange('pending')}
            className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 ${filter === 'pending' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
          >
            Pending
          </button>
          <button
            onClick={() => handleFilterChange('in-progress')}
            className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 ${filter === 'in-progress' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
          >
            In Progress
          </button>
          <button
            onClick={() => handleFilterChange('resolved')}
            className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 ${filter === 'resolved' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
          >
            Resolved
          </button>
          <button
            onClick={() => handleFilterChange('rejected')}
            className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap flex-shrink-0 ${filter === 'rejected' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Search, Claim count and filters - Mobile responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="text-sm text-gray-500">
            Showing {claims.length} of {pagination.total} claims
          </div>
          <div className="relative w-full sm:max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
              placeholder="Search claims by title or description..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        
        {/* Items per page - Stack on mobile */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
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
        ) : claims.length === 0 ? (
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
            <p className="text-gray-500">No claims found matching the selected filter.</p>
          </div>
        ) : (
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {claims.map((claim) => (
                <li key={claim._id}>
                  <div className="px-4 py-4 sm:px-6">
                    {/* Claim card layout with centered button */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      {/* Left side content - moved up slightly */}
                      <div className="flex-1 space-y-2">
                        {/* Claim header */}
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-primary-600 truncate">
                            {claim.title}
                          </p>
                          <div className="flex-shrink-0">
                            <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getStatusColor(claim.status)}`}>
                              {(claim.status || 'Unknown').toString().replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        {/* Claim details */}
                        <div className="space-y-1 sm:space-y-0 sm:flex sm:space-x-6">
                          <div className="flex items-center text-sm text-gray-500">
                            <DocumentTextIcon className="flex-shrink-0 mr-1.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" aria-hidden="true" />
                            <span className="truncate">{claim.title || 'Untitled Claim'}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <ExclamationCircleIcon className="flex-shrink-0 mr-1.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" aria-hidden="true" />
                            <span className="truncate">{claim.status || 'Unknown Status'}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <span>Client: {claim.client?.name || 'Unknown'}</span>
                          </div>
                        </div>
                        
                        {/* Additional details */}
                        <div className="space-y-1 sm:space-y-0 sm:flex sm:space-x-6">
                          <div className="flex items-center text-sm text-gray-500">
                            <span>Submitted: {formatDate(claim.createdAt)}</span>
                          </div>
                          {claim.order && (
                            <div className="flex items-center text-sm text-gray-500">
                              <span>Order: #{claim.order.orderNumber || ''}</span>
                            </div>
                          )}
                          {claim.assignedTo && (
                            <div className="flex items-center text-sm text-gray-500">
                              <span>Assigned to: {claim.assignedTo.name}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Description */}
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {claim.description}
                          </p>
                        </div>
                      </div>
                      
                      {/* Right side - centered button */}
                      <div className="flex-shrink-0 flex justify-end sm:justify-center sm:items-center space-x-2">
                        {claim.assignedTo ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            Assigned
                          </span>
                        ) : (
                          <button
                            onClick={() => setAssigningClaim(claim._id)}
                            className="px-2 py-1 text-xs font-medium rounded border border-primary-600 text-primary-600 hover:bg-primary-50"
                          >
                            Assign
                          </button>
                        )}
                        <Link
                          to={`/manager/claims/${claim._id}`}
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
        {assigningClaim && (
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
                        Assign Claim
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-4">
                          Select an employee to assign this claim to:
                        </p>
                        <select
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                          value={selectedEmployee}
                          onChange={(e) => setSelectedEmployee(e.target.value)}
                        >
                          <option value="">Select an employee</option>
                          {employees.map((employee) => (
                            <option key={employee._id} value={employee._id}>
                              {employee.name} - {employee.department || 'No department'}
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
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleAssignClaim}
                    disabled={isAssigning || !selectedEmployee}
                  >
                    {isAssigning ? 'Assigning...' : 'Assign'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => {
                      setAssigningClaim(null);
                      setSelectedEmployee('');
                    }}
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

export default Claims;