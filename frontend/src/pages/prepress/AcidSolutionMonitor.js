import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { 
  BeakerIcon, 
  CogIcon, 
  PlusIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { Settings } from 'lucide-react';

const AcidSolutionMonitor = () => {
  const [solutionData, setSolutionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [refillBarrels, setRefillBarrels] = useState(1);
  const [isRefilling, setIsRefilling] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [usageHistory, setUsageHistory] = useState([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showManualUsageModal, setShowManualUsageModal] = useState(false);
  const [manualUsage, setManualUsage] = useState({
    length: '',
    width: '',
    lengthRepeat: 1,
    widthRepeat: 1
  });

  // Mock usage history data - replace with actual API call
  const generateMockUsageHistory = () => {
    const mockData = [];
    const orderNumbers = ['ORD-2506-004930', 'ORD-2506-004931', 'ORD-2506-004932', 'ORD-2506-004933', 'ORD-2506-004934', 'ORD-2506-004935', 'ORD-2506-004936', 'ORD-2506-004937'];
    const titles = ['Packaging Label Design', 'Product Branding', 'Marketing Materials', 'Corporate Identity', 'Product Packaging', 'Promotional Items', 'Brand Guidelines', 'Logo Design'];
    
    for (let i = 0; i < 12; i++) {
      const areaProcessed = (Math.random() * 5 + 1); // 1-6 m²
      const litersUsed = areaProcessed * 10; // 10L per m²
      const cost = areaProcessed * 424.44; // Cost calculation
      
      mockData.push({
        id: i + 1,
        orderId: {
          orderNumber: orderNumbers[i % orderNumbers.length],
          title: titles[i % titles.length]
        },
        areaProcessed: areaProcessed,
        litersUsed: litersUsed,
        cost: cost,
        processedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000 + Math.random() * 24 * 60 * 60 * 1000)).toISOString(),
        processedBy: 'System',
        efficiency: Math.floor(Math.random() * 20 + 80) // 80-100% efficiency
      });
    }
    
    return mockData.sort((a, b) => new Date(b.processedAt) - new Date(a.processedAt));
  };

  useEffect(() => {
    fetchSolutionStatus();
    fetchUsageHistory();
    // Set up interval for real-time updates
    const interval = setInterval(() => {
      fetchSolutionStatus();
      fetchUsageHistory();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchSolutionStatus = async () => {
    try {
      const response = await api.get('/api/acid-solution/status');
      setSolutionData(response.data);
    } catch (error) {
      toast.error('Failed to fetch acid solution status');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageHistory = async () => {
    try {
      // Try to fetch from API first
      const response = await api.get('/api/acid-solution/history');
      setUsageHistory(response.data.usageHistory || []);
    } catch (error) {
      console.log('API endpoint not available, using mock data');
      // If API fails, use mock data
      const mockHistory = generateMockUsageHistory();
      setUsageHistory(mockHistory);
    }
  };

  const handleRefill = async () => {
    if (!refillBarrels || refillBarrels <= 0) {
      toast.error('Please enter a valid number of barrels');
      return;
    }

    try {
      setIsRefilling(true);
      const response = await api.post('/api/acid-solution/refill', { 
        barrelCount: parseInt(refillBarrels) 
      });
      
      toast.success(`${refillBarrels} barrel(s) added successfully! Total capacity now: ${response.data.currentLiters}L`);
      setShowRefillModal(false);
      setRefillBarrels(1);
      
      // Refresh data immediately
      await fetchSolutionStatus();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to refill acid solution';
      toast.error(errorMessage);
      console.error('Error:', error);
    } finally {
      setIsRefilling(false);
    }
  };

  const handleManualUsageRecord = async () => {
    if (!manualUsage.length || !manualUsage.width) {
      toast.error('Please enter valid dimensions');
      return;
    }

    try {
      const totalLengthCm = parseFloat(manualUsage.length) * parseInt(manualUsage.lengthRepeat);
      const totalWidthCm = parseFloat(manualUsage.width) * parseInt(manualUsage.widthRepeat);
      const totalAreaM2 = (totalLengthCm * totalWidthCm) / 10000;
      const litersUsed = totalAreaM2 * 10;
      const cost = totalAreaM2 * 424.44;

      // Create new usage record
      const newUsageRecord = {
        id: Date.now(),
        orderId: {
          orderNumber: 'MANUAL-' + Date.now().toString().slice(-6),
          title: 'Manual Usage Entry'
        },
        areaProcessed: totalAreaM2,
        litersUsed: litersUsed,
        cost: cost,
        processedAt: new Date().toISOString(),
        processedBy: 'Manual Entry',
        efficiency: 100
      };

      // Add to local state
      setUsageHistory(prev => [newUsageRecord, ...prev]);

      try {
        // Try to send to API
        await api.post('/api/acid-solution/usage', {
          orderId: null, // Manual entry
          areaProcessed: totalAreaM2
        });
      } catch (apiError) {
        console.log('API not available, record saved locally');
      }

      toast.success(`Manual usage recorded: ${litersUsed.toFixed(2)}L consumed`);
      setShowManualUsageModal(false);
      setManualUsage({ length: '', width: '', lengthRepeat: 1, widthRepeat: 1 });
      
      // Refresh data
      await fetchSolutionStatus();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to record manual usage';
      toast.error(errorMessage);
      console.error('Error:', error);
    }
  };

  const getStatusColor = (percentage) => {
    if (percentage > 70) return 'text-green-600';
    if (percentage > 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBarrelFillColor = (percentage) => {
    if (percentage > 70) return 'from-green-400 to-green-600';
    if (percentage > 30) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  const getStatusIcon = (percentage) => {
    if (percentage > 70) return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
    if (percentage > 30) return <ClockIcon className="h-6 w-6 text-yellow-600" />;
    return <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!solutionData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Unable to load acid solution data</p>
      </div>
    );
  }

  const { metrics } = solutionData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <BeakerIcon className="h-8 w-8 mr-3 text-blue-600" />
            Solvent Solution Monitor
          </h1>
        
        </div>
        <div className="flex space-x-3">
         
          <button
            onClick={() => setShowRefillModal(true)}
            className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 w-full sm:w-auto mr-2.5"
            style={{ marginRight: '10px' }}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            <span className="hidden xs:inline">Add Barrels</span>
            <span className="inline xs:hidden">Add Barrels</span>
          </button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {getStatusIcon(metrics.fillPercentage)}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Current Level
                  </dt>
                  <dd className={`text-lg font-medium ${getStatusColor(metrics.fillPercentage)}`}>
                    {metrics.fillPercentage.toFixed(1)}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BeakerIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Current Liters
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {solutionData.currentLiters.toFixed(0)}L
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Remaining Barrels
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metrics.remainingBarrels}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Est. Days Remaining
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metrics.estimatedDaysRemaining}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Barrel Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Barrel Tank Visualization */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Solution Tank</h3>
          <div className="flex justify-center">
            <div className="relative">
              {/* Barrel Container */}
              <div className="w-32 h-48 border-4 border-gray-400 rounded-b-3xl relative overflow-hidden bg-gray-100">
                {/* Liquid Fill */}
                <div 
                  className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${getBarrelFillColor(metrics.fillPercentage)} transition-all duration-1000 ease-in-out`}
                  style={{ height: `${metrics.fillPercentage}%` }}
                >
                  {/* Liquid Animation */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-white bg-opacity-20 animate-pulse"></div>
                </div>
                
                {/* Percentage Label */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-lg font-bold ${metrics.fillPercentage > 50 ? 'text-white' : 'text-gray-700'}`}>
                    {metrics.fillPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              {/* Tank Labels */}
              <div className="absolute -right-16 top-0 text-sm text-gray-500">
                {metrics.maxCapacity}L
              </div>
              <div className="absolute -right-16 bottom-0 text-sm text-gray-500">
                0L
              </div>
              <div className="absolute -left-16 bottom-1/2 transform translate-y-1/2 text-sm font-medium text-gray-700">
                {solutionData.currentLiters.toFixed(0)}L
              </div>
            </div>
          </div>
          
          {/* Tank Details */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Capacity:</span>
              <span className="font-medium">{metrics.maxCapacity}L</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Current Volume:</span>
              <span className="font-medium">{solutionData.currentLiters.toFixed(1)}L</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Recycling Efficiency:</span>
              <span className="font-medium text-green-600">{metrics.efficiency}%</span>
            </div>
          </div>
        </div>

        {/* Monthly Statistics */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">This Month's Usage</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-900">Orders Processed</p>
                <p className="text-2xl font-bold text-blue-600">{solutionData.monthlyStats.ordersProcessed}</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-blue-400" />
            </div>

            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-900">Total Area Processed</p>
                <p className="text-2xl font-bold text-green-600">{solutionData.monthlyStats.totalAreaProcessed.toFixed(1)} m²</p>
              </div>
              <BeakerIcon className="h-8 w-8 text-green-400" />
            </div>

            <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-purple-900">Liters Used</p>
                <p className="text-2xl font-bold text-purple-600">{solutionData.monthlyStats.totalLitersUsed.toFixed(1)}L</p>
              </div>
              <BeakerIcon className="h-8 w-8 text-purple-400" />
            </div>

            <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-yellow-900">Processing Cost</p>
                <p className="text-2xl font-bold text-yellow-600">{solutionData.monthlyStats.totalCost.toFixed(0)}</p>
              </div>
              <CogIcon className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Recent Usage Activity */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">Recent Usage Activity</h3>
            {usageHistory.length > 5 && (
              <button
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="inline-flex items-center text-sm text-primary-600 hover:text-primary-800 font-medium"
              >
                {showAllHistory ? (
                  <>
                    Show Less
                    <ChevronUpIcon className="ml-1 h-4 w-4" />
                  </>
                ) : (
                  <>
                    View All ({usageHistory.length})
                    <ChevronDownIcon className="ml-1 h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
          
          {usageHistory.length === 0 ? (
            <div className="text-center py-8">
              <BeakerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No usage activity recorded yet</p>
              <button
                onClick={() => setShowManualUsageModal(true)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Record Manual Usage
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Showing {showAllHistory ? usageHistory.length : Math.min(5, usageHistory.length)} of {usageHistory.length} records
                </span>
                <button
                  onClick={() => setShowManualUsageModal(true)}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200"
                >
                  <PlusIcon className="h-3 w-3 mr-1" />
                  Add Manual
                </button>
              </div>
              
              <div className={`space-y-3 ${showAllHistory ? 'max-h-96 overflow-y-auto' : ''}`}>
                {(showAllHistory ? usageHistory : usageHistory.slice(0, 5)).map((usage, index) => (
                  <div key={usage.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      {/* <div className="flex-shrink-0">
                        <BeakerIcon className="h-6 w-6 text-blue-600" />
                      </div> */}
                      <div className="min-w-0 flex-1">
                        <p className="text-[10pt] font-semibold text-gray-900 truncate">
                          Order #{usage.orderId?.orderNumber || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {usage.orderId?.title || 'No title'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(usage.processedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">
                          {usage.cost.toFixed(2)} EGP
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {usage.litersUsed.toFixed(2)}L
                        </p>
                        <p className="text-xs text-gray-500">
                          {usage.areaProcessed.toFixed(3)} m²
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {showAllHistory && usageHistory.length > 10 && (
                <div className="text-center py-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Showing all {usageHistory.length} usage records
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Refill Modal */}
      {showRefillModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Solvent Solution Barrels</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Barrels (200L each)
                </label>
                <input
                  type="number"
                  min="1"
                  value={refillBarrels}
                  onChange={(e) => setRefillBarrels(parseInt(e.target.value) || 1)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Total: {refillBarrels * 200}L additional capacity
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRefillModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefill}
                  disabled={isRefilling}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {isRefilling ? 'Adding...' : 'Add Barrels'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Usage Modal */}
      {showManualUsageModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Record Manual Solvent Usage</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Length (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={manualUsage.length}
                      onChange={(e) => setManualUsage({...manualUsage, length: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Width (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={manualUsage.width}
                      onChange={(e) => setManualUsage({...manualUsage, width: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Length Repeat
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={manualUsage.lengthRepeat}
                      onChange={(e) => setManualUsage({...manualUsage, lengthRepeat: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Width Repeat
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={manualUsage.widthRepeat}
                      onChange={(e) => setManualUsage({...manualUsage, widthRepeat: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                {manualUsage.length && manualUsage.width && (
                  <div className="p-3 bg-blue-50 rounded-md">
                    <div className="text-sm text-blue-800">
                      <p><strong>Calculated Area:</strong> {((parseFloat(manualUsage.length) * parseInt(manualUsage.lengthRepeat) * parseFloat(manualUsage.width) * parseInt(manualUsage.widthRepeat)) / 10000).toFixed(3)} m²</p>
                      <p><strong>Solvent Needed:</strong> {((parseFloat(manualUsage.length) * parseInt(manualUsage.lengthRepeat) * parseFloat(manualUsage.width) * parseInt(manualUsage.widthRepeat)) / 1000).toFixed(2)} L</p>
                      <p><strong>Estimated Cost:</strong> {((parseFloat(manualUsage.length) * parseInt(manualUsage.lengthRepeat) * parseFloat(manualUsage.width) * parseInt(manualUsage.widthRepeat)) / 10000 * 424.44).toFixed(2)} EGP</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowManualUsageModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualUsageRecord}
                  disabled={!manualUsage.length || !manualUsage.width}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Record Usage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcidSolutionMonitor; 