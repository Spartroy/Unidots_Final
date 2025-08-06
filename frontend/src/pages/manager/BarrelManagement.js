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
  TruckIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

const BarrelManagement = () => {
  const [solutionData, setSolutionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [refillBarrels, setRefillBarrels] = useState(1);
  const [isRefilling, setIsRefilling] = useState(false);
  const [settings, setSettings] = useState({
    costPerBarrel: 35000,
    recyclingCostPerBarrel: 800,
    costPerSquareMeter: 424.44,
    litersPerM2: 10,
    recyclingRate: 0.70
  });
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  useEffect(() => {
    fetchSolutionStatus();
    // Set up interval for real-time updates
    const interval = setInterval(() => {
      fetchSolutionStatus();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchSolutionStatus = async () => {
    try {
      const response = await api.get('/api/acid-solution/status');
      setSolutionData(response.data);
      // Update local settings from response
      setSettings({
        costPerBarrel: response.data.costPerBarrel,
        recyclingCostPerBarrel: response.data.recyclingCostPerBarrel,
        costPerSquareMeter: response.data.costPerSquareMeter,
        litersPerM2: response.data.litersPerM2,
        recyclingRate: response.data.recyclingRate
      });
    } catch (error) {
      toast.error('Failed to fetch acid solution status');
      console.error('Error:', error);
    } finally {
      setLoading(false);
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

  const handleUpdateSettings = async () => {
    try {
      setIsUpdatingSettings(true);
      await api.put('/api/acid-solution/settings', settings);
      
      toast.success('Settings updated successfully!');
      setShowSettingsModal(false);
      
      // Refresh data
      await fetchSolutionStatus();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update settings';
      toast.error(errorMessage);
      console.error('Error:', error);
    } finally {
      setIsUpdatingSettings(false);
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
            <TruckIcon className="h-8 w-8 mr-3 text-primary-600" />
            Barrel Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage acid solution inventory, barrels, and system settings
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <CogIcon className="h-4 w-4 mr-2" />
            Settings
          </button>
          <button
            onClick={() => setShowRefillModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Barrels
          </button>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-primary-500">
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

        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-blue-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BeakerIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Available Liters
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {solutionData.currentLiters.toFixed(0)}L
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-indigo-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TruckIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Barrels
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {solutionData.totalBarrels}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-green-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Investment
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {(solutionData.totalBarrels * solutionData.costPerBarrel).toLocaleString()} EGP
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Barrel Tank Visualization */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <BeakerIcon className="h-6 w-6 mr-2 text-primary-600" />
            Solution Tank Status
          </h3>
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
              <span className="text-gray-500">Est. Days Remaining:</span>
              <span className="font-medium">{metrics.estimatedDaysRemaining} days</span>
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <CurrencyDollarIcon className="h-6 w-6 mr-2 text-green-600" />
            Financial Overview
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-900">Cost per Barrel</p>
                <p className="text-2xl font-bold text-blue-600">{solutionData.costPerBarrel.toLocaleString()} EGP</p>
              </div>
              <TruckIcon className="h-8 w-8 text-blue-400" />
            </div>

            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-900">Recycling Cost/Barrel</p>
                <p className="text-2xl font-bold text-green-600">{solutionData.recyclingCostPerBarrel.toLocaleString()} EGP</p>
              </div>
              <ArrowTrendingUpIcon className="h-8 w-8 text-green-400" />
            </div>

            <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-purple-900">Cost per m²</p>
                <p className="text-2xl font-bold text-purple-600">{solutionData.costPerSquareMeter.toFixed(2)} EGP</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-purple-400" />
            </div>

            <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-yellow-900">Recycling Efficiency</p>
                <p className="text-2xl font-bold text-yellow-600">{(solutionData.recyclingRate * 100).toFixed(0)}%</p>
              </div>
              <BeakerIcon className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Statistics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
          <ChartBarIcon className="h-6 w-6 mr-2 text-indigo-600" />
          This Month's Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{solutionData.monthlyStats.ordersProcessed}</div>
            <div className="text-sm text-blue-800">Orders Processed</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{solutionData.monthlyStats.totalAreaProcessed.toFixed(1)} m²</div>
            <div className="text-sm text-green-800">Area Processed</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">{solutionData.monthlyStats.totalLitersUsed.toFixed(0)}L</div>
            <div className="text-sm text-purple-800">Liters Consumed</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-3xl font-bold text-yellow-600">{solutionData.monthlyStats.totalCost.toLocaleString()} EGP</div>
            <div className="text-sm text-yellow-800">Processing Cost</div>
          </div>
        </div>
      </div>

      {/* Refill Modal */}
      {showRefillModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <TruckIcon className="h-6 w-6 mr-2 text-primary-600" />
                Add Acid Solution Barrels
              </h3>
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
                <div className="mt-2 p-3 bg-blue-50 rounded-md">
                  <div className="text-sm text-blue-800">
                    <p><strong>Additional Capacity:</strong> {refillBarrels * 200}L</p>
                    <p><strong>Investment Cost:</strong> {(refillBarrels * settings.costPerBarrel).toLocaleString()} EGP</p>
                    <p><strong>New Total Capacity:</strong> {metrics.maxCapacity + (refillBarrels * 200)}L</p>
                  </div>
                </div>
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

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <CogIcon className="h-6 w-6 mr-2 text-gray-600" />
                Acid Solution Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost per Barrel (EGP)
                  </label>
                  <input
                    type="number"
                    value={settings.costPerBarrel}
                    onChange={(e) => setSettings({...settings, costPerBarrel: parseFloat(e.target.value) || 0})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recycling Cost per Barrel (EGP)
                  </label>
                  <input
                    type="number"
                    value={settings.recyclingCostPerBarrel}
                    onChange={(e) => setSettings({...settings, recyclingCostPerBarrel: parseFloat(e.target.value) || 0})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cost per Square Meter (EGP)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.costPerSquareMeter}
                    onChange={(e) => setSettings({...settings, costPerSquareMeter: parseFloat(e.target.value) || 0})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Liters per Square Meter
                  </label>
                  <input
                    type="number"
                    value={settings.litersPerM2}
                    onChange={(e) => setSettings({...settings, litersPerM2: parseFloat(e.target.value) || 0})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recycling Efficiency (0.0 - 1.0)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={settings.recyclingRate}
                    onChange={(e) => setSettings({...settings, recyclingRate: parseFloat(e.target.value) || 0})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Current: {(settings.recyclingRate * 100).toFixed(0)}% efficiency
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateSettings}
                  disabled={isUpdatingSettings}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {isUpdatingSettings ? 'Updating...' : 'Update Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarrelManagement; 