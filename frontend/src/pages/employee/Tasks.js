import React, { useState, useEffect, useContext } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';
import { ClockIcon, DocumentTextIcon, ExclamationCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const EmployeeTasks = () => {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status');
  const searchParam = searchParams.get('search');
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(statusFilter || 'all');
  const [searchTerm, setSearchTerm] = useState(searchParam || '');
  
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        
        // Construct the API endpoint based on the filter and search
        let endpoint = '/api/tasks/assigned';
        const params = [];
        
        if (activeFilter !== 'all') {
          params.push(`status=${activeFilter}`);
        }
        
        if (searchTerm) {
          params.push(`search=${encodeURIComponent(searchTerm)}`);
        }
        
        if (params.length > 0) {
          endpoint += `?${params.join('&')}`;
        }
        
        const response = await api.get(endpoint);
        setTasks(response.data.tasks || []);
      } catch (error) {
        toast.error('Failed to load tasks');
        console.error('Tasks fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [activeFilter, searchTerm]);
  
  // Set active filter and search term based on URL parameters when component mounts
  useEffect(() => {
    if (statusFilter) {
      setActiveFilter(statusFilter);
    }
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [statusFilter, searchParam]);

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('search', value);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setActiveFilter(newFilter);
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (newFilter === 'all') {
      newParams.delete('status');
    } else {
      newParams.set('status', newFilter);
    }
    setSearchParams(newParams);
  };

  // Function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to determine task status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'On Hold':
        return 'bg-gray-100 text-gray-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Function to update task status
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/api/tasks/${taskId}`, { status: newStatus });
      
      // Update the task in the local state
      setTasks(tasks.map(task => 
        task._id === taskId ? { ...task, status: newStatus } : task
      ));
      
      toast.success('Task status updated successfully');
    } catch (error) {
      toast.error('Failed to update task status');
      console.error('Task update error:', error);
    }
  };
  
  // Function to complete task
  const completeTask = async (taskId) => {
    try {
      await api.put(`/api/tasks/${taskId}/complete`, { completionNotes: '' });
      
      // Update the task in the local state
      setTasks(tasks.map(task => 
        task._id === taskId ? { ...task, status: 'Completed', completedAt: new Date() } : task
      ));
      
      toast.success('Task marked as completed');
    } catch (error) {
      toast.error('Failed to complete task');
      console.error('Task completion error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">My Tasks</h1>
        <div className="relative max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Search tasks by title..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => handleFilterChange('all')}
            className={`${
              activeFilter === 'all'
                ? 'border-secondary-500 text-secondary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            All Tasks
          </button>
          <button
            onClick={() => handleFilterChange('Pending')}
            className={`${
              activeFilter === 'Pending'
                ? 'border-secondary-500 text-secondary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Pending
          </button>
          <button
            onClick={() => handleFilterChange('In Progress')}
            className={`${
              activeFilter === 'In Progress'
                ? 'border-secondary-500 text-secondary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            In Progress
          </button>
          <button
            onClick={() => handleFilterChange('Completed')}
            className={`${
              activeFilter === 'Completed'
                ? 'border-secondary-500 text-secondary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Completed
          </button>
          <button
            onClick={() => handleFilterChange('On Hold')}
            className={`${
              activeFilter === 'On Hold'
                ? 'border-secondary-500 text-secondary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            On Hold
          </button>
        </nav>
      </div>

      {/* Tasks list */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <li key={task._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-secondary-600 truncate">{task.title}</p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <Link
                        to={`/employee/tasks/${task._id}`}
                        className="font-medium text-secondary-600 hover:text-secondary-500 text-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {task.order ? (
                          <>
                            <DocumentTextIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                            Order: {task.order.orderNumber}
                          </>
                        ) : (
                          <>
                            <DocumentTextIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                            General Task
                          </>
                        )}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        <ClockIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                        Due: {formatDate(task.dueDate)}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      {/* Status update buttons */}
                      <div className="flex space-x-2">
                        {task.status !== 'In Progress' && task.status !== 'Completed' && (
                          <button
                            onClick={() => updateTaskStatus(task._id, 'In Progress')}
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Start
                          </button>
                        )}
                        
                        {task.status !== 'Completed' && (
                          <button
                            onClick={() => completeTask(task._id)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-5 sm:px-6 text-center text-gray-500">
              No tasks found for the selected filter.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default EmployeeTasks;