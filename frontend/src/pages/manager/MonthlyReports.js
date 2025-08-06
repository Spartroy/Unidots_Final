import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { 
  CalendarIcon, 
  DocumentArrowDownIcon, 
  ClipboardDocumentListIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const MonthlyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredReports, setFilteredReports] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });
  const [itemsPerPage] = useState(25);
  const [downloadingCSV, setDownloadingCSV] = useState(false);
  const [acidSolutionData, setAcidSolutionData] = useState(null);

  // Generate month and year options
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchMonthlyReports();
    fetchAcidSolutionData();
  }, [selectedMonth, selectedYear, pagination.page]);

  useEffect(() => {
    // Filter reports based on search term
    if (!searchTerm) {
      setFilteredReports(reports);
    } else {
      const filtered = reports.filter(report =>
        report.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.material?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredReports(filtered);
    }
  }, [reports, searchTerm]);

  const fetchMonthlyReports = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/orders/monthly-reports`, {
        params: {
          month: selectedMonth + 1, // API expects 1-12, state uses 0-11
          year: selectedYear,
          page: pagination.page,
          limit: itemsPerPage
        }
      });

      setReports(response.data.orders || []);
      setPagination({
        page: response.data.page || 1,
        pages: response.data.pages || 1,
        total: response.data.total || 0
      });
    } catch (error) {
      toast.error('Failed to fetch monthly reports');
      console.error('Error fetching monthly reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcidSolutionData = async () => {
    try {
      const response = await api.get('/api/acid-solution/monthly-report', {
        params: {
          month: selectedMonth + 1,
          year: selectedYear
        }
      });
      setAcidSolutionData(response.data);
    } catch (error) {
      console.error('Error fetching acid solution data:', error);
      setAcidSolutionData(null);
    }
  };

  const downloadCSV = async () => {
    try {
      setDownloadingCSV(true);
      const response = await api.get(`/api/orders/monthly-reports/csv`, {
        params: {
          month: selectedMonth + 1,
          year: selectedYear
        },
        responseType: 'blob'
      });

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `monthly-report-${months[selectedMonth].toLowerCase()}-${selectedYear}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to download report');
      console.error('Error downloading CSV:', error);
    } finally {
      setDownloadingCSV(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatPrice = (price) => {
    if (!price) return 'Not specified';
    return `$${price.toFixed(2)}`;
  };

  const formatDimensions = (dimensions) => {
    if (!dimensions) return 'Not specified';
    const { width, height, widthRepeatCount = 1, heightRepeatCount = 1, unit = 'mm' } = dimensions;
    return `${width}×${height} ${unit} (${widthRepeatCount}×${heightRepeatCount} repeat)`;
  };

  const calculateAcidSolutionCost = (order) => {
    // Check if dimensions exist in the order data structure
    if (!order.dimensions) return 0;
    
    const dims = order.dimensions;
    const totalLengthCm = dims.width * (dims.widthRepeatCount || 1);
    const totalWidthCm = dims.height * (dims.heightRepeatCount || 1);
    const totalAreaM2 = (totalLengthCm * totalWidthCm) / 10000;
    const estimatedCost = totalAreaM2 * 424.44; // Cost per m²
    
    return estimatedCost;
  };

  const getTotalProcessingCosts = () => {
    return acidSolutionData?.processingCosts || 
           reports.reduce((sum, order) => sum + (order.dimensions ? calculateAcidSolutionCost(order) : 0), 0);
  };

  const calculateTotalProfit = () => {
    const totalRevenue = reports.reduce((sum, order) => sum + (order.estimatedPrice || 0), 0);
    const totalProcessingCosts = getTotalProcessingCosts();
    const monthlyAcidCosts = acidSolutionData?.acidSolutionCosts || 0;
    
    return totalRevenue - totalProcessingCosts - monthlyAcidCosts;
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (pagination.page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReports = filteredReports.slice(startIndex, endIndex);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <ClipboardDocumentListIcon className="h-8 w-8 text-primary-600" />
            <h1 className="text-2xl font-semibold text-gray-900">Monthly Reports</h1>
          </div>
          <button
            onClick={downloadCSV}
            disabled={downloadingCSV || reports.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            {downloadingCSV ? 'Downloading...' : 'Download CSV'}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Month Selector */}
            <div>
              <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">
                Month
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  id="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 w-full"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Year Selector */}
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 w-full"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Orders
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="search"
                  placeholder="Search by order number, title, client, or material..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Report Summary - {months[selectedMonth]} {selectedYear}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {pagination.total} completed orders found
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-700">
                ${reports.reduce((sum, order) => sum + (order.estimatedPrice || 0), 0).toFixed(2)}
              </p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Processing Costs</p>
              <p className="text-2xl font-bold text-purple-700">
                ${getTotalProcessingCosts().toFixed(2)}
              </p>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-600 font-medium">Monthly Acid Costs</p>
              <p className="text-2xl font-bold text-yellow-700">
                ${acidSolutionData?.acidSolutionCosts?.toFixed(2) || '0.00'}
              </p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Net Profit</p>
              <p className="text-2xl font-bold text-green-700">
                ${calculateTotalProfit().toFixed(2)}
              </p>
            </div>
          </div>
          
          {acidSolutionData && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Acid Solution Details:</strong> {acidSolutionData.ordersProcessed} orders processed, {acidSolutionData.litersUsed?.toFixed(1)}L used</p>
                <p><strong>Area Processed:</strong> {acidSolutionData.totalAreaProcessed?.toFixed(1)} m² | <strong>Efficiency:</strong> {acidSolutionData.efficiency?.recyclingRate * 100}% recycling rate</p>
              </div>
            </div>
          )}
        </div>

        {/* Reports Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-gray-600">Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No completed orders found</p>
              <p className="text-sm text-gray-500 mt-1">
                Try selecting a different month or year
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Material
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thickness
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dimensions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Colors
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acid Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Profit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedReports.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.orderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.title || 'Untitled'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.clientName || 'Unknown Client'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.material || 'Not specified'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.materialThickness ? `${order.materialThickness}mm` : 'Not specified'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDimensions(order.dimensions)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.colors || 'Not specified'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                          ${order.dimensions ? calculateAcidSolutionCost(order).toFixed(2) : '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {formatPrice(order.estimatedPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          ${((order.estimatedPrice || 0) - (order.dimensions ? calculateAcidSolutionCost(order) : 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(endIndex, filteredReports.length)}</span> of{' '}
                        <span className="font-medium">{filteredReports.length}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page <= 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === pagination.page
                                ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}

                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page >= totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyReports; 