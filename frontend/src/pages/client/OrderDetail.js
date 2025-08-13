import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';
import { DocumentTextIcon, ClipboardIcon, PaperClipIcon, ExclamationCircleIcon, ReceiptIcon, DocumentDownloadIcon, CalculatorIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { getStatusColor, getDisplayStatus, calculateProgressPercentage, getOrderSteps } from '../../utils/statusUtils';
import OrderProgressBar from '../../components/common/OrderProgressBar';
import OrderReceipt from '../../components/common/OrderReceipt';
import OrderChat from '../../components/common/OrderChat';
import { useDropzone } from 'react-dropzone';
import useAutoRefresh from '../../hooks/useAutoRefresh';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [order, setOrder] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Add a key to force refresh
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  // Tab management
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details');

  // Tab configuration
  const tabs = [
    { id: 'details', name: 'Order Details', icon: DocumentTextIcon },
    { id: 'progress', name: 'Progress', icon: ClipboardIcon },
    { id: 'files', name: 'Files', icon: PaperClipIcon },
    { id: 'chat', name: 'Communication', icon: ChatBubbleLeftRightIcon },
  ];

  useEffect(() => {
    // Update URL when tab changes
    const newSearchParams = new URLSearchParams(searchParams);
    if (activeTab !== 'details') {
      newSearchParams.set('tab', activeTab);
    } else {
      newSearchParams.delete('tab');
    }
    setSearchParams(newSearchParams, { replace: true });
  }, [activeTab, searchParams, setSearchParams]);

  // Create a reusable function to fetch order data
  const fetchOrderData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch order details
      const orderResponse = await api.get(`/api/orders/${id}`);
      console.log('Fetched order data:', orderResponse.data);
      setOrder(orderResponse.data);
      
      // Extract files from order response instead of making a separate call
      if (orderResponse.data.files) {
        console.log('Files from order data:', orderResponse.data.files);
        setFiles(orderResponse.data.files);
      } else {
        // Try to fetch files, but don't fail if endpoint doesn't exist
        try {
          const filesResponse = await api.get(`/api/orders/${id}/files`);
          setFiles(filesResponse.data);
        } catch (error) {
          console.log('Files endpoint not available, using empty array');
          setFiles([]);
        }
      }
      
      // Tasks (currently not implemented in the backend)
      try {
        const tasksResponse = await api.get(`/api/orders/${id}/tasks`);
        setTasks(tasksResponse.data);
      } catch (error) {
        console.log('Tasks endpoint not available, using empty array');
        setTasks([]);
      }
    } catch (error) {
      toast.error('Failed to load order details');
      console.error('Order details fetch error:', error.response?.data?.message || error.message);
      navigate('/client/orders');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);
  
  useEffect(() => {
    if (id) {
      fetchOrderData();
    }
  }, [id, fetchOrderData, refreshKey]);

  useAutoRefresh(fetchOrderData, 10000, [id]);
  
  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };
  
  // Format time separately
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const options = { hour: '2-digit', minute: '2-digit' };
    return date.toLocaleTimeString(undefined, options);
  };

  // Function to determine task status color
  const getTaskStatusColor = (status) => {
    switch (status) {
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
  
  // Function to download a file
  const downloadFile = (fileId) => {
    window.open(`/api/files/${fileId}/download`, '_blank');
  };

  // Function to handle order cancellation
  const handleCancelOrder = async () => {
    if (cancelLoading) return;
    
    setCancelLoading(true);
    try {
      console.log('Cancelling order');
      const response = await api.put(`/api/orders/${id}/cancel`, { 
        reason: cancelReason 
      });
      
      console.log('Cancel order response:', response.data);
      toast.success('Order cancelled successfully');
      setShowCancelModal(false);
      
      // Force a complete refresh of the data
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
      console.error('Cancel order error:', error);
    } finally {
      setCancelLoading(false);
    }
  };

  // Calculate which steps are complete based on order status
  const getStepStatus = () => {
    // Check if order has status
    if (!order || !order.status) {
      return { steps: [], currentStep: 0 };
    }
    
    console.log(`Getting step status for order with status: ${order.status}, delivery stage: ${order.stages?.delivery?.status}`);
    
    // Simplified steps based on the new workflow
    const steps = [
      { label: 'Submission', completed: true }, // Always completed
      { 
        label: 'Design', 
        completed: ['Design Done', 'In Prepress', 'Ready for Delivery', 'Completed'].includes(order.status) ||
                   order.stages?.production?.status === 'Completed'
      },
      { 
        label: 'Prepress', 
        completed: ['Ready for Delivery', 'Completed'].includes(order.status) ||
                   order.stages?.prepress?.status === 'Completed'
      },
      { 
        label: 'Delivery', 
        completed: order.status === 'Completed' || order.stages?.delivery?.status === 'Completed'
      }
    ];

    // Determine current step
    let currentStep = 0;
    
    if (order.status === 'Submitted') {
      currentStep = 0;
    } else if (order.status === 'Designing') {
      currentStep = 1; // In design
    } else if (order.status === 'Design Done' || order.status === 'In Prepress') {
      currentStep = 2; // At prepress stage
    } else if (order.status === 'Ready for Delivery') {
      currentStep = 3;
    } else if (order.status === 'Completed' || order.stages?.delivery?.status === 'Completed') {
      currentStep = 4; // Complete all steps
    }

    console.log(`Current progress step: ${currentStep} for status: ${order.status}`);
    return { steps, currentStep };
  };

  // Calculate price breakdown details
  const calculatePriceBreakdown = () => {
    const { dimensions, materialThickness, colors } = order.specifications;
    
    // Calculate base dimensions with repeat
    const width = parseFloat(dimensions.width || 0);
    const height = parseFloat(dimensions.height || 0);
    const widthRepeat = parseInt(dimensions.widthRepeatCount || 1);
    const heightRepeat = parseInt(dimensions.heightRepeatCount || 1);
    
    const totalWidth = width * widthRepeat;
    const totalHeight = height * heightRepeat;
    const totalArea = totalWidth * totalHeight;
    
    // Determine material price factor
    let materialPriceFactor = 0.85; // Default for 1.7 microns
    if (materialThickness === 1.14) {
      materialPriceFactor = 0.75;
    } else if (materialThickness === 2.54) {
      materialPriceFactor = 0.95;
    }
    
    // Calculate color multiplier (with special handling for CMYK)
    let colorMultiplier = colors || 1;
    
    // Calculate final price
    const estimatedPrice = order.cost?.estimatedCost || (totalArea * colorMultiplier * materialPriceFactor).toFixed(2);
    
    // Always use cm as the unit
    const unit = 'cm';
    
    return {
      dimensions: `${width} × ${height} ${unit}`,
      totalDimensions: `${totalWidth} × ${totalHeight} ${unit}`,
      repeats: `Width: ${widthRepeat} × Height: ${heightRepeat}`,
      totalArea: totalArea.toFixed(2),
      colors: colorMultiplier,
      materialFactor: materialPriceFactor.toFixed(2),
      formula: '(Width × Width Repeat) × (Height × Height Repeat) × Colors × Material Factor',
      estimatedPrice
    };
  };

  // Add the dropzone setup
  const onDrop = acceptedFiles => {
    setUploadFiles(prevFiles => [
      ...prevFiles,
      ...acceptedFiles.map(file =>
        Object.assign(file, { preview: URL.createObjectURL(file) })
      )
    ]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'application/vnd.adobe.illustrator': ['.ai'],
      'application/postscript': ['.eps'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeFile = (fileToRemove) => {
    setUploadFiles(uploadFiles.filter(file => file !== fileToRemove));
    URL.revokeObjectURL(fileToRemove.preview);
  };

  const handleFileUpload = async () => {
    if (uploadFiles.length === 0) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      
      uploadFiles.forEach(file => {
        formData.append('files', file);
      });
      
      formData.append('relatedOrder', id);
      formData.append('fileType', 'reference');
      
      const response = await api.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      setUploadFiles([]);
      toast.success('Files uploaded successfully');
      
      // Refresh order data to show new files
      fetchOrderData();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <p className="text-center text-gray-500">Order not found or you don't have permission to view it.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order header - Original header preserved */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">{order.title || 'Order Details'}</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Order #{order.orderNumber}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <div>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                {getDisplayStatus(order.status, 'client')}
              </span>
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-1 text-xs text-gray-500">
                  Stage: {order.stages?.delivery?.status || 'unknown'} | Status: {order.status || 'unknown'}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="border-t border-gray-200">
          <nav className="-mb-px flex space-x-8 px-4" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="px-4 py-5 sm:px-6">
          {/* Order Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Order details in a cleaner card layout */}
              <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <h4 className="text-base font-medium text-gray-900">Order Information</h4>
                  <OrderReceipt order={order} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 p-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Order Date</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {formatDate(order.createdAt)}
                      {order.createdAt && <span className="ml-2 text-gray-500">{formatTime(order.createdAt)}</span>}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Order Type</div>
                    <div className="mt-1 text-sm text-gray-900">{order.orderType || 'N/A'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Estimated Price</div>
                    <div className="mt-1 text-sm text-gray-900 font-bold text-primary-600">
                      {order.cost?.estimatedCost 
                        ? `$${order.cost.estimatedCost.toFixed(2)}` 
                        : 'Not calculated'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Material</div>
                    <div className="mt-1 text-sm text-gray-900">{order.specifications?.material || 'N/A'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Material Thickness</div>
                    <div className="mt-1 text-sm text-gray-900">{order.specifications?.materialThickness ? `${order.specifications.materialThickness} microns` : 'N/A'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Printing Mode</div>
                    <div className="mt-1 text-sm text-gray-900">{order.specifications?.printingMode || 'N/A'}</div>
                  </div>

                  {order.assignedTo && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">Assigned Designer</div>
                      <div className="mt-1 text-sm text-gray-900">{order.assignedTo?.name}</div>
                    </div>
                  )}

                  <div>
                    <div className="text-sm font-medium text-gray-500">Email</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {user?.email ? (
                        <a href={`mailto:${user.email}`} className="text-primary-600 hover:text-primary-800">
                          {user.email}
                        </a>
                      ) : 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-500">Phone</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {user?.phone ? (
                        <a href={`tel:${user.phone}`} className="text-primary-600 hover:text-primary-800">
                          {user.phone}
                        </a>
                      ) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Technical Specifications */}
              <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="text-base font-medium text-gray-900">Technical Specifications</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 p-4">
                  {order.specifications?.packageType && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">Package Type</div>
                      <div className="mt-1 text-sm text-gray-900">{order.specifications.packageType}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-500">Dimensions</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {order.specifications?.dimensions ? 
                        `${order.specifications.dimensions.width} × ${order.specifications.dimensions.height} cm` : 
                        'N/A'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Repeat Count</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {order.specifications?.dimensions ? 
                        `Width: ${order.specifications.dimensions.widthRepeatCount || 1} × Height: ${order.specifications.dimensions.heightRepeatCount || 1}` : 
                        'N/A'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Number of Colors</div>
                    <div className="mt-1 text-sm text-gray-900">{order.specifications?.colors || 'N/A'}</div>
                  </div>
                  
                  <div className="sm:col-span-2">
                    <div className="text-sm font-medium text-gray-500">Used Colors</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {order.specifications?.usedColors && order.specifications.usedColors.length > 0 
                        ? order.specifications.usedColors.join(', ') 
                        : 'N/A'}
                      {order.specifications?.customColors && order.specifications.customColors.length > 0 && 
                        `, ${order.specifications.customColors.join(', ')}`}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Description and Notes */}
              {(order.description || order.specifications?.additionalDetails) && (
                <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h4 className="text-base font-medium text-gray-900">Description & Notes</h4>
                  </div>
                  <div className="p-4">
                    {order.description && (
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-500">Description</div>
                        <div className="mt-1 text-sm text-gray-900">{order.description}</div>
                      </div>
                    )}
                    
                    {order.specifications?.additionalDetails && (
                      <div>
                        <div className="text-sm font-medium text-gray-500">Additional Notes</div>
                        <div className="mt-1 text-sm text-gray-900">{order.specifications.additionalDetails}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress Tab */}
          {activeTab === 'progress' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="text-base font-medium text-gray-900">Order Progress</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Current status: <span className="font-medium">
                      {getDisplayStatus(order.status, 'client')}
                    </span>
                  </p>
                </div>
                <div className="p-6">
                  {/* Order Progress Bar */}
                  <div className="mb-8">
                    <OrderProgressBar order={order} className="mt-2" />
                  </div>
                  
                  {/* Detailed Steps */}
                  <div className="space-y-4 mt-6">
                    {/* Design/Production Stage */}
                    <div className={`bg-white border ${
                      order.status === 'Designing' ? 'border-yellow-400 bg-yellow-50' : 
                      order.status === 'Design Done' || order.status === 'In Prepress' || 
                      order.status === 'Ready for Delivery' || order.status === 'Delivering' || order.status === 'Completed' ? 'border-green-400 bg-green-50' : 'border-gray-200'
                    } rounded-md overflow-hidden`}>
                      <div className="px-4 py-4 sm:px-6 flex items-center">
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full ${
                          order.status === 'Design Done' || order.status === 'In Prepress' || 
                          order.status === 'Ready for Delivery' || order.status === 'Delivering' || order.status === 'Completed' ? 'bg-green-500' : 
                          order.status === 'Designing' ? 'bg-yellow-400' : 'bg-gray-200'
                        } flex items-center justify-center mr-3`}>
                          {order.status === 'Design Done' || order.status === 'In Prepress' || 
                           order.status === 'Ready for Delivery' || order.status === 'Delivering' || order.status === 'Completed' ? (
                            <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span className="text-xs text-white font-medium">1</span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Designing</h4>
                          <p className="text-xs text-gray-500">
                            {order.status === 'Design Done' || order.status === 'In Prepress' || 
                             order.status === 'Ready for Delivery' || order.status === 'Delivering' || order.status === 'Completed' 
                             ? `Completed on ${formatDate(order.stages?.design?.completionDate || order.updatedAt)}` 
                             : order.status === 'Designing' 
                             ? 'Designing' 
                             : 'Not started'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Prepress Stage */}
                    <div className={`bg-white border ${
                      order.status === 'In Prepress' ? 'border-yellow-400 bg-yellow-50' : 
                      order.status === 'Ready for Delivery' || order.status === 'Delivering' || order.status === 'Completed' ? 'border-green-400 bg-green-50' : 'border-gray-200'
                    } rounded-md overflow-hidden`}>
                      <div className="px-4 py-4 sm:px-6 flex items-center">
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full ${
                          order.status === 'Ready for Delivery' || order.status === 'Delivering' || order.status === 'Completed' ? 'bg-green-500' : 
                          order.status === 'In Prepress' ? 'bg-yellow-400' : 'bg-gray-200'
                        } flex items-center justify-center mr-3`}>
                          {order.status === 'Ready for Delivery' || order.status === 'Delivering' || order.status === 'Completed' ? (
                            <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span className="text-xs text-white font-medium">2</span>
                          )}
                        </div>
                        <div className="flex-1">
                           <h4 className="text-sm font-medium text-gray-900">Prepress</h4>
                          <p className="text-xs text-gray-500">
                            {order.status === 'Ready for Delivery' || order.status === 'Delivering' || order.status === 'Completed' 
                             ? `Completed on ${formatDate(order.stages?.prepress?.completionDate || order.updatedAt)}` 
                             : order.status === 'In Prepress' 
                             ? 'In progress' 
                             : 'Not started'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Prepress Sub-processes - visible to client as well for transparency */}
                      {(order.status === 'In Prepress' || order.status === 'Ready for Delivery' || order.status === 'Delivering' || order.status === 'Completed') && order.stages?.prepress?.subProcesses && (
                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                          <h5 className="text-xs font-medium text-gray-700 mb-2">Prepress Progress</h5>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="flex items-center">
                              <div className={`h-4 w-4 rounded-full ${
                                order.stages?.prepress?.subProcesses?.positioning?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                              } mr-2`}></div>
                              <span className="text-xs text-gray-600">Positioning</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`h-4 w-4 rounded-full ${
                                order.stages?.prepress?.subProcesses?.laserImaging?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                              } mr-2`}></div>
                              <span className="text-xs text-gray-600">Laser Imaging</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`h-4 w-4 rounded-full ${
                                order.stages?.prepress?.subProcesses?.exposure?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                              } mr-2`}></div>
                              <span className="text-xs text-gray-600">Exposure</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`h-4 w-4 rounded-full ${
                                order.stages?.prepress?.subProcesses?.washout?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                              } mr-2`}></div>
                              <span className="text-xs text-gray-600">Washout</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`h-4 w-4 rounded-full ${
                                order.stages?.prepress?.subProcesses?.drying?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                              } mr-2`}></div>
                              <span className="text-xs text-gray-600">Drying</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`h-4 w-4 rounded-full ${
                                order.stages?.prepress?.subProcesses?.finishing?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                              } mr-2`}></div>
                              <span className="text-xs text-gray-600">Finishing</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Delivery Stage */}
                    <div className={`bg-white border ${
                      order.status === 'Ready for Delivery' || order.status === 'Delivering' ? 'border-yellow-400 bg-yellow-50' : 
                      order.status === 'Completed' ? 'border-green-400 bg-green-50' : 'border-gray-200'
                    } rounded-md overflow-hidden`}>
                      <div className="px-4 py-4 sm:px-6 flex items-center">
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full ${
                          order.status === 'Completed' ? 'bg-green-500' : 
                          order.status === 'Ready for Delivery' || order.status === 'Delivering' ? 'bg-yellow-400' : 'bg-gray-200'
                        } flex items-center justify-center mr-3`}>
                          {order.status === 'Completed' ? (
                            <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span className="text-xs text-white font-medium">3</span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Delivery</h4>
                          <p className="text-xs text-gray-500">
                            {order.status === 'Completed' 
                             ? `Completed on ${formatDate(order.stages?.delivery?.completionDate || order.updatedAt)}` 
                             : order.status === 'Ready for Delivery' || order.status === 'Delivering'
                             ? 'In progress' 
                             : 'Not started'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  


                  {/* Direct Delivery Information - Show when designer chose direct delivery */}
                  {order.status === 'Ready for Delivery' && order.stages?.delivery?.courierInfo?.mode === 'direct' && (
                    <div className="my-6">
                      <div className="rounded-md bg-green-50 p-4 mb-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800">Direct Handover Selected</h3>
                            <div className="mt-2 text-sm text-green-700">
                              <p>Your order will be delivered directly to your address. The courier will handle the delivery process.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Delivery Address Display */}
                      {order.stages?.delivery?.courierInfo?.destination && (
                        <div className="bg-white border border-gray-200 rounded-md overflow-hidden mb-4">
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <h4 className="text-sm font-medium text-gray-900">Delivery Address</h4>
                          </div>
                          <div className="p-4">
                            <p className="text-sm text-gray-900">
                              {order.stages.delivery.courierInfo.destination.street && `${order.stages.delivery.courierInfo.destination.street}, `}
                              {order.stages.delivery.courierInfo.destination.city && `${order.stages.delivery.courierInfo.destination.city}, `}
                              {order.stages.delivery.courierInfo.destination.state && `${order.stages.delivery.courierInfo.destination.state} `}
                              {order.stages.delivery.courierInfo.destination.postalCode && `${order.stages.delivery.courierInfo.destination.postalCode}, `}
                              {order.stages.delivery.courierInfo.destination.country}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Shipping Company Information - Show when designer chose shipping company */}
                  {order.status === 'Ready for Delivery' && order.stages?.delivery?.courierInfo?.mode === 'shipping-company' && (
                    <div className="my-6">
                      <div className="rounded-md bg-blue-50 p-4 mb-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">Shipping Company Selected</h3>
                            <div className="mt-2 text-sm text-blue-700">
                              <p>Your order will be delivered via {order.stages.delivery.courierInfo.shipmentCompany}. A courier will handle the delivery process.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Client Self-Collection Information - Show when designer chose client self-collection */}
                  {order.status === 'Ready for Delivery' && order.stages?.delivery?.courierInfo?.mode === 'client-collection' && (
                    <div className="my-6">
                      <div className="rounded-md bg-yellow-50 p-4 mb-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">Self-Collection Selected</h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>Your order is ready for self-collection. Please visit our location to pick up your order.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Collection Address Display */}
                      {order.stages?.delivery?.courierInfo?.destination && (
                        <div className="bg-white border border-gray-200 rounded-md overflow-hidden mb-4">
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <h4 className="text-sm font-medium text-gray-900">Collection Address</h4>
                          </div>
                          <div className="p-4">
                            <p className="text-sm text-gray-900">
                              {order.stages.delivery.courierInfo.destination.street && `${order.stages.delivery.courierInfo.destination.street}, `}
                              {order.stages.delivery.courierInfo.destination.city && `${order.stages.delivery.courierInfo.destination.city}, `}
                              {order.stages.delivery.courierInfo.destination.state && `${order.stages.delivery.courierInfo.destination.state} `}
                              {order.stages.delivery.courierInfo.destination.postalCode && `${order.stages.delivery.courierInfo.destination.postalCode}, `}
                              {order.stages.delivery.courierInfo.destination.country}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Shipment Label Component - show when order is Delivering */}
                  {order.status === 'Delivering' && order.files && order.files.some(file => file.fileType === 'courier') && (
                    <div className="my-6">
                      <div className="rounded-md bg-blue-50 p-4 mb-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">Your order is on the way!</h3>
                            <div className="mt-2 text-sm text-blue-700">
                              <p>Your order has been shipped and is currently in transit. You can download the shipment label below.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Shipment Label Files */}
                      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                          <h4 className="text-sm font-medium text-gray-900">Shipment Label</h4>
                        </div>
                        <div className="p-4">
                          {order.files
                            .filter(file => file.fileType === 'courier')
                            .map((file, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <svg className="h-5 w-5 text-gray-400 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-sm font-medium text-gray-900">{file.originalname || file.filename}</span>
                                </div>
                                <a
                                  href={`/api/files/${file._id}/download`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  Download Label
                                </a>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Order completed confirmation message */}
                  {(order.status === 'Completed' || order.stages?.delivery?.status === 'Completed') && (
                    <div className="my-6">
                      <div className="rounded-md bg-green-50 p-4 mb-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800">Order Completed</h3>
                            <div className="mt-2 text-sm text-green-700">
                              <p>Thank you for confirming delivery. Your order has been marked as completed.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="text-base font-medium text-gray-900">Order Files</h4>
                  <p className="mt-1 text-sm text-gray-500">Attachments and documents related to this order</p>
                </div>
                <div className="p-6">
                  {/* Your uploaded files section */}
                  {order.files && order.files.some(file => file.uploadedBy?._id === user?.id) && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Your Uploaded Files</h4>
                      <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                        {order.files
                          .filter(file => file.uploadedBy?._id === user?.id)
                          .map((file, index) => (
                            <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                              <div className="w-0 flex-1 flex items-center">
                                <PaperClipIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                                <span className="ml-2 flex-1 w-0 truncate">
                                  {file.originalname || file.filename}
                                </span>
                              </div>
                              <div className="ml-4 flex-shrink-0">
                                <a
                                  href={`/api/files/${file._id}/download`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-primary-600 hover:text-primary-500"
                                >
                                  Download
                                </a>
                              </div>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}

                  {/* Staff files section */}
                  {order.files && order.files.some(file => file.uploadedBy?.role === 'employee' || file.uploadedBy?.role === 'prepress' || file.uploadedBy?.role === 'manager') && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Files from Unidots Team</h4>
                      <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                        {order.files
                          .filter(file => file.uploadedBy?.role === 'employee' || file.uploadedBy?.role === 'prepress' || file.uploadedBy?.role === 'manager')
                          .map((file, index) => (
                            <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                              <div className="w-0 flex-1 flex items-center">
                                <PaperClipIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                                <span className="ml-2 flex-1 w-0 truncate">
                                  {file.originalname || file.filename}
                                  <span className="ml-2 text-xs text-gray-500">
                                    (From {file.uploadedBy?.name || 'Unidots team'})
                                  </span>
                                </span>
                              </div>
                              <div className="ml-4 flex-shrink-0">
                                <a
                                  href={`/api/files/${file._id}/download`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-primary-600 hover:text-primary-500"
                                >
                                  Download
                                </a>
                              </div>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}

                  {/* Courier files section - Shipment Labels */}
                  {order.files && order.files.some(file => file.fileType === 'courier') && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Shipment Labels</h4>
                      <div className="rounded-md bg-blue-50 p-3 mb-3">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-blue-700">
                              Your order is on the way! Download the shipment label below.
                            </p>
                          </div>
                        </div>
                      </div>
                      <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                        {order.files
                          .filter(file => file.fileType === 'courier')
                          .map((file, index) => (
                            <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                              <div className="w-0 flex-1 flex items-center">
                                <svg className="flex-shrink-0 h-5 w-5 text-blue-400 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                                <span className="ml-2 flex-1 w-0 truncate">
                                  {file.originalname || file.filename}
                                  <span className="ml-2 text-xs text-blue-600">
                                    (Shipment Label)
                                  </span>
                                </span>
                              </div>
                              <div className="ml-4 flex-shrink-0">
                                <a
                                  href={`/api/files/${file._id}/download`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-blue-600 hover:text-blue-500"
                                >
                                  Download
                                </a>
                              </div>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}

                  {/* File upload section */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Upload New Files</h4>
                    <div
                      {...getRootProps()}
                      className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${
                        isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                      } border-dashed rounded-md`}
                    >
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <input {...getInputProps()} />
                          <p className="pl-1">Drag and drop files here, or click to select files</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF, PDF, AI, EPS up to 50MB</p>
                      </div>
                    </div>
                    
                    {uploadFiles.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Files to upload:</h4>
                        <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                          {uploadFiles.map((file, index) => (
                            <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                              <div className="w-0 flex-1 flex items-center">
                                <PaperClipIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                                <span className="ml-2 flex-1 w-0 truncate">{file.name}</span>
                              </div>
                              <div className="ml-4 flex-shrink-0 flex">
                                <button
                                  type="button"
                                  onClick={() => removeFile(file)}
                                  className="font-medium text-red-600 hover:text-red-500"
                                >
                                  Remove
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={handleFileUpload}
                            disabled={uploading}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            {uploading ? 'Uploading...' : 'Upload Files'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="text-base font-medium text-gray-900">Order Communication</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    {order.assignedTo 
                      ? `Chat with ${order.assignedTo.name} about this order`
                      : 'Chat will be available once an employee is assigned to your order'
                    }
                  </p>
                </div>
                <div className="p-6">
                  {order.assignedTo ? (
                    <OrderChat orderId={order._id} isVisible={activeTab === 'chat'} />
                  ) : (
                    <div className="text-center py-8">
                      <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No employee assigned yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Chat will become available once a team member is assigned to your order.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Original buttons section preserved */}
        <div className="border-t border-gray-200 px-4 py-4 sm:px-6 bg-gray-50">
          <div className="flex space-x-3">
            <Link
              to="/client/orders"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Back to Orders
            </Link>
            
            {/* Conditionally render the Cancel Order button */}
            {['Submitted', 'In Review'].includes(order?.status) && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Cancel Order
              </button>
            )}
            
            {order?.status !== 'Completed' && order?.status !== 'Cancelled' && (
              <Link
                to={`/client/claims/new?orderId=${order._id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Submit a Claim
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Order Modal - Original modal preserved */}
      {showCancelModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <ExclamationCircleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Cancel Order</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to cancel this order? This action cannot be undone.
                    </p>
                    <div className="mt-4">
                      <textarea
                        rows={3}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Please provide a reason for cancellation (optional)"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                  onClick={handleCancelOrder}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? 'Processing...' : 'Confirm Cancellation'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelLoading}
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

export default OrderDetail;