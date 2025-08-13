import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const EmployeeDetail = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    department: '',
    phone: '',
    status: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await api.get(`/api/users/${id}`);
        setEmployee(response.data);
        setEditData({
          name: response.data.name,
          email: response.data.email,
          department: response.data.department || '',
          phone: response.data.phone || '',
          status: response.data.status || 'active'
        });
      } catch (error) {
        toast.error('Failed to fetch employee details');
        console.error('Error fetching employee:', error);
        // Redirect back to employees list if employee not found
        if (error.response?.status === 404) {
          navigate('/manager/employees');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id, navigate]);

  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    
    if (!editData.name || !editData.email || !editData.department) {
      toast.error('Name, email, and department are required');
      return;
    }

    try {
      setUpdating(true);
      await api.put(`/api/users/${id}`, editData);
      
      // Refresh employee data
      const response = await api.get(`/api/users/${id}`);
      setEmployee(response.data);
      
      setShowEditModal(false);
      toast.success('Employee updated successfully');
    } catch (error) {
      toast.error('Failed to update employee');
      console.error('Error updating employee:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      await api.put(`/api/users/${id}`, { isActive: newStatus === 'active' });
      
      // Refresh employee data
      const response = await api.get(`/api/users/${id}`);
      setEmployee(response.data);
      
      toast.success(`Employee status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update employee status');
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

  if (!employee) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
            <p className="text-gray-500">Employee not found</p>
            <Link
              to="/manager/employees"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Back to Employees
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
          <h1 className="text-2xl font-semibold text-gray-900">{employee.name}</h1>
          <Link
            to="/manager/employees"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Back to Employees
          </Link>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Employee Information</h3>
              <div className="flex space-x-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {employee.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{employee.name}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{employee.email}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Department</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 capitalize">{employee.department || 'Not specified'}</dd>
              </div>
              {/* Position removed as per request */}
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{employee.phone || 'Not specified'}</dd>
              </div>
              {/* Specialization removed as per request */}
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Joined on</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(employee.createdAt)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Employee Management Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Employee Management</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Edit Employee
              </button>
              {!employee.isActive && (
                <button
                  type="button"
                  onClick={() => handleStatusChange('active')}
                  disabled={updating}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Updating...' : 'Activate Employee'}
                </button>
              )}
              {employee.isActive && (
                <button
                  type="button"
                  onClick={() => handleStatusChange('inactive')}
                  disabled={updating}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Updating...' : 'Deactivate Employee'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tasks Assigned Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Assigned Tasks</h3>
          </div>
          <div className="border-t border-gray-200">
            {employee.tasks && employee.tasks.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {employee.tasks.map((task) => (
                  <li key={task._id} className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link to={`/manager/tasks/${task._id}`} className="text-primary-600 hover:text-primary-900">
                          {task.title}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                      </div>
                      <div>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${task.status === 'Completed' ? 'bg-green-100 text-green-800' : task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-5 sm:p-6 text-center">
                <p className="text-gray-500">No tasks assigned to this employee</p>
              </div>
            )}
          </div>
        </div>

        {/* Orders Assigned Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Assigned Orders</h3>
          </div>
          <div className="border-t border-gray-200">
            {employee.orders && employee.orders.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {employee.orders.map((order) => (
                  <li key={order._id} className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link to={`/manager/orders/${order._id}`} className="text-primary-600 hover:text-primary-900">
                          {order.orderNumber}: {order.title}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">
                          Client: {order.client ? order.client.name : 'Unknown'} 
                          {order.client && order.client.company ? ` (${order.client.company})` : ''}
                        </p>
                      </div>
                      <div>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${order.status === 'Completed' || order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 
                            order.status === 'In Production' || order.status === 'In Prepress' || order.status === 'In Review' ? 'bg-blue-100 text-blue-800' : 
                            order.status === 'Submitted' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'On Hold' ? 'bg-gray-100 text-gray-800' :
                            order.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-5 sm:p-6 text-center">
                <p className="text-gray-500">No orders assigned to this employee</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Employee Modal */}
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
                      Edit Employee
                    </h3>
                    <div className="mt-2">
                      <form onSubmit={handleUpdateEmployee}>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                          <div className="sm:col-span-3">
                            <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                              Name *
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="name"
                                id="edit-name"
                                value={editData.name}
                                onChange={handleInputChange}
                                required
                                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>

                          <div className="sm:col-span-3">
                            <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700">
                              Email *
                            </label>
                            <div className="mt-1">
                              <input
                                type="email"
                                name="email"
                                id="edit-email"
                                value={editData.email}
                                onChange={handleInputChange}
                                required
                                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>

                          <div className="sm:col-span-3">
                            <label htmlFor="edit-department" className="block text-sm font-medium text-gray-700">
                              Department *
                            </label>
                            <div className="mt-1">
                              <select
                                id="edit-department"
                                name="department"
                                value={editData.department}
                                onChange={handleInputChange}
                                required
                                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              >
                                <option value="">Select department</option>
                                <option value="design">Design</option>
                                <option value="prepress">Prepress</option>
                                <option value="production">Production</option>
                                <option value="sales">Sales</option>
                                <option value="management">Management</option>
                                <option value="none">None</option>
                              </select>
                            </div>
                          </div>

                          {/* Position edit removed */}

                          <div className="sm:col-span-3">
                            <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700">
                              Phone
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="phone"
                                id="edit-phone"
                                value={editData.phone}
                                onChange={handleInputChange}
                                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>

                          {/* Specialization edit removed */}

                          <div className="sm:col-span-3">
                            <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700">
                              Status
                            </label>
                            <div className="mt-1">
                              <select
                                id="edit-status"
                                name="isActive"
                                value={editData.isActive ? "true" : "false"}
                                onChange={(e) => setEditData({
                                  ...editData,
                                  isActive: e.target.value === "true"
                                })}
                                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
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
                  onClick={handleUpdateEmployee}
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

export default EmployeeDetail;