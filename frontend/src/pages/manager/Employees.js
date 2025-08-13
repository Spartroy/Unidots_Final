import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [prepress, setPrepress] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');
  const viewModeParam = searchParams.get('view');
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  
  const [filter, setFilter] = useState(filterParam || 'all'); // all, active, inactive
  const [viewMode, setViewMode] = useState(viewModeParam || 'employees'); // employees, prepress, couriers
  const [pagination, setPagination] = useState({
    page: parseInt(pageParam) || 1,
    pages: 1,
    total: 0
  });
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(limitParam) || 10);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPrepressModal, setShowPrepressModal] = useState(false);
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    password: '',
    department: 'design',
    phone: '',
  });
  const [newPrepress, setNewPrepress] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingPrepress, setIsCreatingPrepress] = useState(false);
  const [isCreatingCourier, setIsCreatingCourier] = useState(false);
  const [newCourier, setNewCourier] = useState({ name: '', email: '', password: '', phone: '' });

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        // Fetch employees
        const role = viewMode === 'employees' ? 'employee' : (viewMode === 'prepress' ? 'prepress' : 'courier');
        let endpoint = `/api/users?role=${role}&page=${pagination.page}&limit=${itemsPerPage}`;
        
        // Add status filter if not "all"
        if (filter !== 'all') {
          // Convert filter to isActive boolean for backend
          const isActive = filter === 'active';
          endpoint += `&isActive=${isActive}`;
        }
        
        const response = await api.get(endpoint);
        
        if (viewMode === 'employees') {
          setEmployees(response.data.users || []);
        } else if (viewMode === 'prepress') {
          setPrepress(response.data.users || []);
        } else {
          setCouriers(response.data.users || []);
        }
        
        setPagination({
          page: response.data.page || 1,
          pages: response.data.pages || 1,
          total: response.data.total || 0
        });
      } catch (error) {
        toast.error('Failed to fetch staff');
        console.error('Error fetching staff:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [viewMode, filter, pagination.page, itemsPerPage]);

  // Set active filter and pagination based on URL parameters when component mounts
  useEffect(() => {
    if (filterParam) {
      setFilter(filterParam);
    }
    if (viewModeParam) {
      setViewMode(viewModeParam);
    }
    if (pageParam) {
      setPagination(prev => ({...prev, page: parseInt(pageParam) || 1}));
    }
    if (limitParam) {
      setItemsPerPage(parseInt(limitParam) || 10);
    }
  }, [filterParam, viewModeParam, pageParam, limitParam]);

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

  // Handle view mode change
  const handleViewModeChange = (newViewMode) => {
    setViewMode(newViewMode);
    setPagination(prev => ({...prev, page: 1})); // Reset to page 1 when changing view mode
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    newParams.set('view', newViewMode);
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
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePrepressInputChange = (e) => {
    const { name, value } = e.target;
    setNewPrepress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCourierInputChange = (e) => {
    const { name, value } = e.target;
    setNewCourier(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    
    if (!newEmployee.name || !newEmployee.email || !newEmployee.password) {
      toast.error('Please fill in all required fields (name, email, password)');
      return;
    }
    
    try {
      setIsCreating(true);
      
      // Always set department to 'design' for employees
      const employeeData = {
        ...newEmployee,
        department: 'design'
      };
      
      await api.post('/api/users/employees', employeeData);
      
      // Refresh employee list
      const response = await api.get('/api/users?role=employee');
      setEmployees(response.data.users || []);
      
      // Reset form and close modal
      setNewEmployee({
        name: '',
        email: '',
        password: '',
        department: 'design',
        phone: '',
      });
      setShowCreateModal(false);
      toast.success('Employee created successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create employee');
      console.error('Error creating employee:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreatePrepress = async (e) => {
    e.preventDefault();
    
    if (!newPrepress.name || !newPrepress.email || !newPrepress.password) {
      toast.error('Please fill in all required fields (name, email, password)');
      return;
    }
    
    try {
      setIsCreatingPrepress(true);
      
      // Create prepress user with role and department automatically assigned
      await api.post('/api/auth/register', {
        name: newPrepress.name,
        email: newPrepress.email,
        password: newPrepress.password,
        role: 'prepress',
        department: 'prepress',
        phone: newPrepress.phone,
      });
      
      // Reset form and close modal
      setNewPrepress({
        name: '',
        email: '',
        password: '',
        phone: '',
      });
      setShowPrepressModal(false);
      toast.success('Prepress staff created successfully');
      
      // Refresh staff lists
      const prepressResponse = await api.get('/api/users?role=prepress');
      setPrepress(prepressResponse.data.users || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create prepress staff');
      console.error('Error creating prepress staff:', error);
    } finally {
      setIsCreatingPrepress(false);
    }
  };

  const handleCreateCourier = async (e) => {
    e.preventDefault();
    if (!newCourier.name || !newCourier.email || !newCourier.password) {
      toast.error('Please fill in all required fields (name, email, password)');
      return;
    }
    try {
      setIsCreatingCourier(true);
      await api.post('/api/users/couriers', newCourier);
      setNewCourier({ name: '', email: '', password: '', phone: '' });
      setShowCourierModal(false);
      toast.success('Courier created successfully');
      const courierResponse = await api.get('/api/users?role=courier');
      setCouriers(courierResponse.data.users || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create courier');
      console.error('Error creating courier:', error);
    } finally {
      setIsCreatingCourier(false);
    }
  };

  const getDisplayData = () => {
    if (viewMode === 'employees') {
      return {
        title: 'Employees',
        data: employees, // No longer need filteredEmployees as filtering is done on the server
        emptyMessage: 'No employees found matching the selected filter.',
        addButton: {
          text: 'Add Employee',
          action: () => setShowCreateModal(true)
        }
      };
    } else if (viewMode === 'prepress') {
      return {
        title: 'Prepress Staff',
        data: prepress, // No longer need filteredPrepress as filtering is done on the server
        emptyMessage: 'No prepress staff found matching the selected filter.',
        addButton: {
          text: 'Register Prepress',
          action: () => setShowPrepressModal(true)
        }
      };
    } else {
      return {
        title: 'Couriers',
        data: couriers,
        emptyMessage: 'No couriers found matching the selected filter.',
        addButton: {
          text: 'Add Courier',
          action: () => setShowCourierModal(true)
        }
      };
    }
  };

  const displayData = getDisplayData();

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">{displayData.title}</h1>
          <div className="flex space-x-2">
            <button
              onClick={displayData.addButton.action}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {displayData.addButton.text}
            </button>
          </div>
        </div>

        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => handleViewModeChange('employees')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${viewMode === 'employees' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Designers
          </button>
          <button
            onClick={() => handleViewModeChange('prepress')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${viewMode === 'prepress' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Prepress Staff
          </button>
          <button
            onClick={() => handleViewModeChange('couriers')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${viewMode === 'couriers' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Couriers
          </button>
        </div>

        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            All Staff
          </button>
          <button
            onClick={() => handleFilterChange('active')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${filter === 'active' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Active
          </button>
          <button
            onClick={() => handleFilterChange('inactive')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${filter === 'inactive' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Inactive
          </button>
        </div>
        
        {/* Staff count display */}
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing {displayData.data.length} of {pagination.total} {viewMode === 'employees' ? 'employees' : viewMode === 'prepress' ? 'prepress staff' : 'couriers'}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : displayData.data.length === 0 ? (
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
            <p className="text-gray-500">{displayData.emptyMessage}</p>
          </div>
        ) : (
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {displayData.data.map((staff) => (
                <li key={staff._id}>
                  <Link to={`/manager/employees/${staff._id}`} className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                            <span className="text-white font-medium">{staff.name.charAt(0)}</span>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-primary-600">{staff.name}</p>
                            <p className="text-sm text-gray-500">{staff.email}</p>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${(staff.status === 'active' || staff.isActive === true) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {staff.status || (staff.isActive ? 'Active' : 'Inactive')}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <span className="mr-1.5 h-5 w-5 text-gray-400">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z" clipRule="evenodd" />
                              </svg>
                            </span>
                            <span className="capitalize">{staff.department || 'No department'}</span>
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <span className="mr-1.5 h-5 w-5 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                          </span>
                          Joined: {formatDate(staff.createdAt)}
                        </div>
                      </div>
                    </div>
                  </Link>
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

        {/* Create Employee Modal */}
        {showCreateModal && (
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
                        Create New Employee
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        New employees will be automatically assigned to the design department.
                      </p>
                      <div className="mt-4">
                        <form onSubmit={handleCreateEmployee}>
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
                                  value={newEmployee.name}
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
                                  value={newEmployee.email}
                                  onChange={handleInputChange}
                                  required
                                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-3">
                              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password *
                              </label>
                              <div className="mt-1">
                                <input
                                  type="password"
                                  name="password"
                                  id="password"
                                  value={newEmployee.password}
                                  onChange={handleInputChange}
                                  required
                                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-3">
                              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                                Department
                              </label>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  id="department"
                                  name="department"
                                  value="Design"
                                  disabled
                                  className="shadow-sm bg-gray-100 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md cursor-not-allowed"
                                />
                                <p className="mt-1 text-xs text-gray-500">All employees are assigned to Design department</p>
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
                                  value={newEmployee.phone}
                                  onChange={handleInputChange}
                                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                />
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
                    onClick={handleCreateEmployee}
                    disabled={isCreating}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Prepress Modal */}
        {showPrepressModal && (
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
                        Register Prepress Staff
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Prepress staff will be automatically assigned to the prepress department.
                      </p>
                      <div className="mt-4">
                        <form onSubmit={handleCreatePrepress}>
                          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                              <label htmlFor="prepress-name" className="block text-sm font-medium text-gray-700">
                                Name *
                              </label>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  name="name"
                                  id="prepress-name"
                                  value={newPrepress.name}
                                  onChange={handlePrepressInputChange}
                                  required
                                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-3">
                              <label htmlFor="prepress-email" className="block text-sm font-medium text-gray-700">
                                Email *
                              </label>
                              <div className="mt-1">
                                <input
                                  type="email"
                                  name="email"
                                  id="prepress-email"
                                  value={newPrepress.email}
                                  onChange={handlePrepressInputChange}
                                  required
                                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-3">
                              <label htmlFor="prepress-password" className="block text-sm font-medium text-gray-700">
                                Password *
                              </label>
                              <div className="mt-1">
                                <input
                                  type="password"
                                  name="password"
                                  id="prepress-password"
                                  value={newPrepress.password}
                                  onChange={handlePrepressInputChange}
                                  required
                                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-3">
                              <label htmlFor="prepress-phone" className="block text-sm font-medium text-gray-700">
                                Phone
                              </label>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  name="phone"
                                  id="prepress-phone"
                                  value={newPrepress.phone}
                                  onChange={handlePrepressInputChange}
                                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                />
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
                    onClick={handleCreatePrepress}
                    disabled={isCreatingPrepress}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingPrepress ? 'Creating...' : 'Register Prepress'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPrepressModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Courier Modal */}
        {showCourierModal && (
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
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Add Courier</h3>
                      <div className="mt-4">
                        <form onSubmit={handleCreateCourier}>
                          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                              <label className="block text-sm font-medium text-gray-700">Name *</label>
                              <input type="text" name="name" value={newCourier.name} onChange={handleCourierInputChange} required className="mt-1 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                            </div>
                            <div className="sm:col-span-3">
                              <label className="block text-sm font-medium text-gray-700">Email *</label>
                              <input type="email" name="email" value={newCourier.email} onChange={handleCourierInputChange} required className="mt-1 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                            </div>
                            <div className="sm:col-span-3">
                              <label className="block text-sm font-medium text-gray-700">Password *</label>
                              <input type="password" name="password" value={newCourier.password} onChange={handleCourierInputChange} required className="mt-1 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                            </div>
                            <div className="sm:col-span-3">
                              <label className="block text-sm font-medium text-gray-700">Phone</label>
                              <input type="text" name="phone" value={newCourier.phone} onChange={handleCourierInputChange} className="mt-1 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="button" onClick={handleCreateCourier} disabled={isCreatingCourier} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    {isCreatingCourier ? 'Creating...' : 'Create'}
                  </button>
                  <button type="button" onClick={() => setShowCourierModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Employees;