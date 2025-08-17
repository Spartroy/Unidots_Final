import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';
import { UsersIcon, DocumentTextIcon, TrophyIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement, TimeScale } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import 'chartjs-adapter-date-fns';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, TimeScale, Title, Tooltip, Legend);

const ManagerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalEmployees: 0,
    totalClients: 0,
    totalClaims: 0,
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    assignedOrders: 0,
    // Detailed order status counts
    ordersByStatus: {},
    // Monthly order trends
    monthlyOrderTrends: []
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentClaims, setRecentClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

        // Initialize with empty data to prevent errors
        let dashboardStats = {
          totalOrders: 0,
          pendingOrders: 0,
          completedOrders: 0,
          totalEmployees: 0,
          totalClients: 0,
          totalClaims: 0,
          totalTasks: 0,
          pendingTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          assignedOrders: 0,
          ordersByStatus: {},
          monthlyOrderTrends: []
        };

        try {
          // Fetch manager stats from the new endpoint
          const statsResponse = await api.get('/api/users/dashboard-stats');
          if (statsResponse.data) {
            dashboardStats = statsResponse.data;
          }
        } catch (error) {
          console.error('Stats fetch error:', error);
          // Continue with default empty stats
        }

        // Fetch assigned orders count
        try {
          const assignedOrdersResponse = await api.get('/api/orders?assignedTo=not_null');
          dashboardStats.assignedOrders = assignedOrdersResponse.data.total || 0;
        } catch (error) {
          console.error('Assigned orders fetch error:', error);
        }

        setStats(dashboardStats);

        try {
          // Fetch recent orders
          const ordersResponse = await api.get('/api/orders/recent');
          if (ordersResponse.data) {
            setRecentOrders(ordersResponse.data);
          }
        } catch (error) {
          console.error('Recent orders fetch error:', error);
          // Keep empty orders array
        }

        try {
          // Fetch recent tasks
          const tasksResponse = await api.get('/api/tasks/recent');
          if (tasksResponse.data) {
            setRecentTasks(tasksResponse.data);
          }
        } catch (error) {
          console.error('Recent tasks fetch error:', error);
          // Keep empty tasks array
        }

        try {
          // Fetch recent claims
          const claimsResponse = await api.get('/api/claims/recent');
          if (claimsResponse.data) {
            setRecentClaims(claimsResponse.data);
          }
        } catch (error) {
          console.error('Recent claims fetch error:', error);
          // Keep empty claims array
        }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useAutoRefresh(fetchDashboardData, 60000, [fetchDashboardData]); // 60 seconds (1 minute)

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';

    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  // Function to determine status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Production':
        return 'bg-blue-100 text-blue-800';
      case 'Prepressing':
        return 'bg-purple-100 text-purple-800';
      case 'Designing':
        return 'bg-indigo-100 text-indigo-800';
      case 'Submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'On Hold':
        return 'bg-gray-100 text-gray-800';
      // For tasks
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to get prepress progress and employee info
  const getPrepressInfo = (order) => {
    if (!order?.stages?.prepress?.subProcesses) return { progress: 0, lastUpdatedBy: null };

    const subProcesses = order.stages.prepress.subProcesses;
    let completedCount = 0;
    let lastCompletedProcess = null;

    // Check each subprocess
    if (subProcesses.ripping?.status === 'Completed') {
      completedCount++;
      if (!lastCompletedProcess ||
        new Date(subProcesses.ripping.completedAt) > new Date(lastCompletedProcess.completedAt)) {
        lastCompletedProcess = subProcesses.ripping;
      }
    }
    if (subProcesses.laserImaging?.status === 'Completed') {
      completedCount++;
      if (!lastCompletedProcess ||
        new Date(subProcesses.laserImaging.completedAt) > new Date(lastCompletedProcess.completedAt)) {
        lastCompletedProcess = subProcesses.laserImaging;
      }
    }
    if (subProcesses.exposure?.status === 'Completed') {
      completedCount++;
      if (!lastCompletedProcess ||
        new Date(subProcesses.exposure.completedAt) > new Date(lastCompletedProcess.completedAt)) {
        lastCompletedProcess = subProcesses.exposure;
      }
    }
    if (subProcesses.washout?.status === 'Completed') {
      completedCount++;
      if (!lastCompletedProcess ||
        new Date(subProcesses.washout.completedAt) > new Date(lastCompletedProcess.completedAt)) {
        lastCompletedProcess = subProcesses.washout;
      }
    }
    if (subProcesses.drying?.status === 'Completed') {
      completedCount++;
      if (!lastCompletedProcess ||
        new Date(subProcesses.drying.completedAt) > new Date(lastCompletedProcess.completedAt)) {
        lastCompletedProcess = subProcesses.drying;
      }
    }
    if (subProcesses.finishing?.status === 'Completed') {
      completedCount++;
      if (!lastCompletedProcess ||
        new Date(subProcesses.finishing.completedAt) > new Date(lastCompletedProcess.completedAt)) {
        lastCompletedProcess = subProcesses.finishing;
      }
    }

    return {
      progress: (completedCount / 6) * 100,
      lastUpdatedBy: lastCompletedProcess?.completedBy || null
    };
  };

  // Enhanced order status data for pie chart
  const getOrderStatusData = () => {
    const statusOrder = ['Submitted', 'Designing', 'Design Done', 'In Prepress', 'Ready for Delivery', 'Delivering', 'Completed', 'Cancelled', 'On Hold'];
    const statusColors = {
      'Submitted': '#FBBF24',      // Yellow
      'Designing': '#8B5CF6',      // Purple
      'Design Done': '#06B6D4',    // Cyan
      'In Prepress': '#EC4899',    // Pink
      'Ready for Delivery': '#10B981', // Green
      'Delivering': '#F59E0B',     // Orange
      'Completed': '#059669',      // Dark Green
      'Cancelled': '#EF4444',      // Red
      'On Hold': '#6B7280'         // Gray
    };

    const labels = [];
    const data = [];
    const backgroundColor = [];

    statusOrder.forEach(status => {
      const count = stats.ordersByStatus[status] || 0;
      if (count > 0) {
        labels.push(status);
        data.push(count);
        backgroundColor.push(statusColors[status]);
      }
    });

    return {
      labels,
      datasets: [{
        data,
        backgroundColor,
        borderWidth: 0,
        hoverOffset: 4
      }]
    };
  };

  // Monthly order trends data for line chart
  const getMonthlyTrendsData = () => {
    const labels = [];
    const data = [];

    stats.monthlyOrderTrends.forEach(trend => {
      const monthYear = `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`;
      labels.push(monthYear);
      data.push(trend.count);
    });

    // Fill missing months with 0 if needed
    const currentDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11);

    const allLabels = [];
    const allData = [];

    for (let i = 0; i < 12; i++) {
      const date = new Date(startDate);
      date.setMonth(startDate.getMonth() + i);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      allLabels.push(new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      
      const dataIndex = labels.indexOf(monthYear);
      allData.push(dataIndex >= 0 ? data[dataIndex] : 0);
    }

    return {
      labels: allLabels,
      datasets: [{
        label: 'Orders',
        data: allData,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5
      }]
    };
  };

  // Chart options
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed * 100) / total).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    },
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  if (loading) {
    return (
      <div className="flex items-center mx-auto justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tertiary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <h2 className="text-lg text-center font-bold text-gray-900">Welcome, {user?.name}!</h2>
        <p className="mt-1 text-sm text-center text-gray-500">
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Orders */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.totalOrders}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/manager/orders" className="font-medium text-tertiary-600 hover:text-tertiary-500">
                View all orders
              </Link>
            </div>
          </div>
        </div>

        {/* Assigned Orders */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-6 w-6 text-blue-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Assigned Orders</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.assignedOrders}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/manager/orders?filter=assigned" className="font-medium text-tertiary-600 hover:text-tertiary-500">
                View assigned orders
              </Link>
            </div>
          </div>
        </div>

        {/* Total Tasks */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrophyIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Tasks</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.totalTasks}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/manager/tasks" className="font-medium text-tertiary-600 hover:text-tertiary-500">
                View all tasks
              </Link>
            </div>
          </div>
        </div>

        {/* Total Employees */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Employees</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.totalEmployees}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/manager/employees" className="font-medium text-tertiary-600 hover:text-tertiary-500">
                View employees
              </Link>
            </div>
          </div>
        </div>

        {/* Total Clients */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Clients</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.totalClients}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/manager/clients" className="font-medium text-tertiary-600 hover:text-tertiary-500">
                View clients
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Order Status Chart */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Order Status Distribution</h3>
            <span className="text-sm text-gray-500">Current Status Breakdown</span>
          </div>
          <div className="h-64">
            <Pie data={getOrderStatusData()} options={pieChartOptions} />
          </div>
        </div>

        {/* Monthly Order Trends Chart */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Monthly Order Trends</h3>
            <span className="text-sm text-gray-500">Last 12 Months</span>
          </div>
          <div className="h-64">
            <Line data={getMonthlyTrendsData()} options={lineChartOptions} />
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Orders</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Latest orders across all clients</p>
          </div>
          <Link to="/manager/orders" className="text-sm font-medium text-tertiary-600 hover:text-tertiary-500">
            View all
          </Link>
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-hidden overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>

                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.client?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>





                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Link to={`/manager/orders/${order._id}`} className="text-tertiary-600 hover:text-tertiary-900">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No recent orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Tasks</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Latest tasks across all employees</p>
          </div>
          <Link to="/manager/tasks" className="text-sm font-medium text-tertiary-600 hover:text-tertiary-500">
            View all
          </Link>
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-hidden overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>

                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTasks.length > 0 ? (
                  recentTasks.map((task) => (
                    <tr key={task._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {task.title}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.assignedTo?.name || 'Unassigned'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(task.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Link to={`/manager/tasks/${task._id}`} className="text-tertiary-600 hover:text-tertiary-900">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      No tasks found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Claims */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Claims</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Latest claims across all clients</p>
          </div>
          <Link to="/manager/claims" className="text-sm font-medium text-tertiary-600 hover:text-tertiary-500">
            View all
          </Link>
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-hidden overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Claim Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentClaims.length > 0 ? (
                  recentClaims.map((claim) => (
                    <tr key={claim._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {claim.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {claim.client?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {claim.claimType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          claim.priority === 'High' ? 'bg-red-100 text-red-800' :
                          claim.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {claim.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(claim.status)}`}>
                          {claim.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(claim.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Link to={`/manager/claims/${claim._id}`} className="text-tertiary-600 hover:text-tertiary-900">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      No recent claims found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;