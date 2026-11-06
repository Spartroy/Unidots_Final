import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { openFile } from '../../utils/files';
import StatusExplainer from '../../components/client/StatusExplainer';
import QuoteCard from '../../components/client/QuoteCard';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';
import { DocumentTextIcon, ClipboardIcon, PaperClipIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { getStatusColor, getDisplayStatus } from '../../utils/statusUtils';


import OrderChat from '../../components/common/OrderChat';
import { useDropzone } from 'react-dropzone';
import useAutoRefresh from '../../hooks/useAutoRefresh';

import DetailsTab from './orderDetail/DetailsTab';
import ProgressTab from './orderDetail/ProgressTab';
import FilesTab from './orderDetail/FilesTab';
import CancelModal from './orderDetail/CancelModal';
const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabsRef = useRef(null);
  
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

  // Tab configuration with mobile-friendly names
  const tabs = [
    { id: 'details', name: 'Details', mobileName: 'Details', icon: DocumentTextIcon },
    { id: 'progress', name: 'Progress', mobileName: 'Progress', icon: ClipboardIcon },
    { id: 'files', name: 'Files', mobileName: 'Files', icon: PaperClipIcon },
    { id: 'chat', name: 'Communication', mobileName: 'Chat', icon: ChatBubbleLeftRightIcon },
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
  const fetchOrderData = useCallback(async ({ silent } = {}) => {
    try {
      if (!silent) setLoading(true);
      
      // Fetch order details
      const orderResponse = await api.get(`/api/orders/${id}`);
      setOrder(orderResponse.data);
      
      // Extract files from order response instead of making a separate call
      if (orderResponse.data.files) {
        setFiles(orderResponse.data.files);
      } else {
        // Try to fetch files, but don't fail if endpoint doesn't exist
        try {
          const filesResponse = await api.get(`/api/orders/${id}/files`);
          setFiles(filesResponse.data);
        } catch (error) {
          setFiles([]);
        }
      }
      
      // Tasks (currently not implemented in the backend)
      try {
        const tasksResponse = await api.get(`/api/orders/${id}/tasks`);
        setTasks(tasksResponse.data);
      } catch (error) {
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

  useAutoRefresh(fetchOrderData, 60000, [id]); // 60 seconds (1 minute)
  
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
    openFile(null, fileId);
  };

  // Function to handle order cancellation
  const handleCancelOrder = async () => {
    if (cancelLoading) return;
    
    setCancelLoading(true);
    try {
      const response = await api.put(`/api/orders/${id}/cancel`, { 
        reason: cancelReason 
      });
      
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
    <div className="space-y-4 sm:space-y-6">
      <StatusExplainer status={order?.status} />
      <QuoteCard order={order} onChanged={fetchOrderData} />

      {/* Mobile-optimized Order Header */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Order Title Area - Redesigned for mobile */}
        <div className="px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
            {/* Order Title and Number */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {order.title || 'Untitled Order'}
              </h1>
              <p className="mt-1 text-sm sm:text-base text-gray-600 font-medium">
                #{order.orderNumber}
              </p>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                Created {formatDate(order.createdAt)}
                {order.createdAt && <span className="ml-2">{formatTime(order.createdAt)}</span>}
              </p>
            </div>
            
            {/* Status Badge - Mobile optimized */}
            <div className="flex flex-col items-start sm:items-end space-y-2">
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 text-xs sm:text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                  {getDisplayStatus(order.status, 'client')}
                </span>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 text-right">
                  Stage: {order.stages?.delivery?.status || 'unknown'}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="border-t border-gray-200 bg-white">
          {/* Scrollable tabs container */}
          <div
            ref={tabsRef}
            className="flex overflow-x-auto scrollbar-hide px-4 sm:px-0 sm:overflow-visible sm:justify-center"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <nav className="flex space-x-0 sm:space-x-8 sm:justify-center" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 bg-primary-50 sm:bg-transparent'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-3 px-4 sm:py-4 sm:px-1 border-b-2 font-medium text-sm flex items-center justify-center sm:justify-start min-w-[120px] sm:min-w-0 flex-shrink-0`}
                >
                  <tab.icon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.mobileName}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 py-4 sm:px-6 sm:py-5">
          {/* Order Details Tab */}
          {activeTab === 'details' && <DetailsTab formatDate={formatDate} formatTime={formatTime} order={order} user={user} />}

          {/* Progress Tab - Mobile optimized */}
          {activeTab === 'progress' && <ProgressTab formatDate={formatDate} order={order} />}

          {/* Files Tab - Mobile optimized */}
          {activeTab === 'files' && <FilesTab getInputProps={getInputProps} getRootProps={getRootProps} handleFileUpload={handleFileUpload} isDragActive={isDragActive} order={order} removeFile={removeFile} uploadFiles={uploadFiles} uploading={uploading} user={user} />}

          {/* Chat Tab - Mobile optimized */}
          {activeTab === 'chat' && (
            <div className="space-y-4 sm:space-y-6 h-full">
              <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden h-full flex flex-col">
                <div className="bg-white px-4 py-3 border-b border-gray-200">
                  <h4 className="text-base font-medium text-gray-900">Order Communication</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    {order.assignedTo 
                      ? `Chat with ${order.assignedTo.name} about this order`
                      : 'Chat will be available once an employee is assigned to your order'
                    }
                  </p>
                </div>
                <div className="p-2 sm:p-4 flex-1 flex flex-col">
                  {order.assignedTo ? (
                    <div className="flex-1">
                      <OrderChat orderId={order._id} isVisible={activeTab === 'chat'} />
                    </div>
                  ) : (
                    <div className="text-center py-8 flex-1 flex items-center justify-center">
                      <div>
                        <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No employee assigned yet</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Chat will become available once a team member is assigned to your order.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Mobile-optimized buttons section */}
        <div className="border-t border-gray-200 px-4 py-4 sm:px-6 bg-gray-50">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <Link
              to="/client/orders"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Back to Orders
            </Link>
            
            <Link
              to="/client/orders/new"
              state={{ reorderFrom: order }}
              className="inline-flex items-center px-4 py-2 border border-primary-300 text-sm font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Reorder
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
      {showCancelModal && <CancelModal cancelLoading={cancelLoading} cancelReason={cancelReason} handleCancelOrder={handleCancelOrder} setCancelReason={setCancelReason} setShowCancelModal={setShowCancelModal} />}
    </div>
  );
};

export default OrderDetail;