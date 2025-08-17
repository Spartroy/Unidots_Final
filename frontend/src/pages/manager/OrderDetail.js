import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import OrderProgressBar from '../../components/common/OrderProgressBar';
import { PaperClipIcon, UserCircleIcon, CalculatorIcon, XMarkIcon, DocumentTextIcon, ClipboardIcon, ChatBubbleLeftRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import OrderReceipt from '../../components/common/OrderReceipt';
import { useDropzone } from 'react-dropzone';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import '../../utils/resizeObserverFix'; // Import ResizeObserver fix

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  // Tab management
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details');

  // Tab configuration with mobile names
  const tabs = [
    { id: 'details', name: 'Order Details', mobileName: 'Details', icon: DocumentTextIcon },
    { id: 'progress', name: 'Progress', mobileName: 'Progress', icon: ClipboardIcon },
    { id: 'files', name: 'Files', mobileName: 'Files', icon: PaperClipIcon },
    { id: 'comments', name: 'Comments', mobileName: 'Comments', icon: ChatBubbleLeftRightIcon },
  ];

  // Tab scrolling ref
  const tabsRef = useRef(null);

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

  const onDrop = acceptedFiles => {
    setFiles(prevFiles => [
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
      'application/x-photoshop': ['.psd'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeFile = (fileToRemove) => {
    setFiles(files.filter(file => file !== fileToRemove));
    URL.revokeObjectURL(fileToRemove.preview);
  };

  const handleFileUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('files', file);
      });
      
      formData.append('relatedOrder', id);
      formData.append('fileType', 'manager');
      
      const response = await api.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      setFiles([]);
      toast.success('Files uploaded successfully');
      
      // Refresh order data
      const orderResponse = await api.get(`/api/orders/${id}`);
      setOrder(orderResponse.data);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/api/orders/${id}`);
        setOrder(response.data);
        if (response.data.assignedTo) {
          setSelectedEmployee(response.data.assignedTo._id);
        }
      } catch (error) {
        toast.error('Failed to fetch order details');
        console.error('Error fetching order:', error);
        // Redirect back to orders list if order not found
        if (error.response?.status === 404) {
          navigate('/manager/orders');
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchEmployees = async () => {
      try {
        const response = await api.get('/api/users?role=employee');
        setEmployees(response.data.users || []);
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast.error('Failed to fetch employees');
      }
    };

    fetchOrder();
    fetchEmployees();
    
    return () => {};
  }, [id, navigate, updating, submittingComment, isAssigning]);

  const refreshOrder = useCallback(async () => {
    try {
      const response = await api.get(`/api/orders/${id}`);
      setOrder(response.data);
    } catch (_e) {}
  }, [id]);

  useAutoRefresh(refreshOrder, 60000, [refreshOrder]); // 60 seconds (1 minute)

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Not specified';
      
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Not specified';
    }
  };
  
  // Format time separately
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const options = { hour: '2-digit', minute: '2-digit' };
    return date.toLocaleTimeString(undefined, options);
  };

  // Get status badge color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case 'Submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Review':
      case 'In Prepress':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'On Hold':
        return 'bg-gray-100 text-gray-800';
      case 'Ready for Delivery':
        return 'bg-indigo-100 text-indigo-800';
      case 'Ready for Prepress':
        return 'bg-purple-100 text-purple-800';
      case 'Approved':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdating(true);
      // Convert status to proper case
      const statusMap = {
        'in prepress': 'In Prepress',
        'completed': 'Completed',
        'Completed': 'Completed',
        'cancelled': 'Cancelled',
        'Cancelled': 'Cancelled'
      };
      const formattedStatus = statusMap[newStatus] || newStatus;
      
      // Special handling for In Prepress status - only mark the prepress stage as in progress
      // but leave the design stage as is (don't automatically mark it completed)
      if (formattedStatus === 'In Prepress') {
        await api.put(`/api/orders/${id}/status`, { status: formattedStatus });
      } else {
      await api.put(`/api/orders/${id}/status`, { status: formattedStatus });
      }
      
      // Refresh order data
      const response = await api.get(`/api/orders/${id}`);
      setOrder(response.data);
      toast.success(`Order status updated to ${formattedStatus}`);
    } catch (error) {
      toast.error('Failed to update order status');
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignOrder = async () => {
    if (!selectedEmployee) return;

    try {
      setIsAssigning(true);
      await api.put(`/api/orders/${id}/assign`, { employeeId: selectedEmployee });
      
      // Refresh order data
      const response = await api.get(`/api/orders/${id}`);
      setOrder(response.data);
      
      toast.success('Order assigned successfully');
    } catch (error) {
      toast.error('Failed to assign order');
      console.error('Error assigning order:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      setSubmittingComment(true);
      await api.post(`/api/orders/${id}/comments`, { content: comment });
      // Refresh order data to show new comment
      const response = await api.get(`/api/orders/${id}`);
      setOrder(response.data);
      setComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error('Failed to add comment');
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const calculateProgressPercentage = () => {
    if (!order || !order.stages) return 0;
    
    // If order is completed or delivered, return 100%
    if (order.status === 'Completed' || order.status === 'Delivered') {
      return 100;
    }

    // Define stage weights - without production stage
    const stageWeights = {
      'submit': 1,
      'review': 1,
      'prepress': 1,
      'delivery': 1
    };

    let completedWeight = 0;
    const totalWeight = Object.values(stageWeights).reduce((a, b) => a + b, 0);

    // Add submission weight automatically as it's always completed
    completedWeight += stageWeights.submit;

    // Check design/review stage
    if (order.stages.review.status === 'Completed') {
      completedWeight += stageWeights.review;
    }

    // Check prepress stage
    if (order.stages.prepress.status === 'Completed') {
      completedWeight += stageWeights.prepress;
    }

    // Check delivery stage
    if (order.stages.delivery.status === 'Completed') {
      completedWeight += stageWeights.delivery;
    }

    return (completedWeight / totalWeight) * 100;
  };

  const arePrepressSubprocessesCompleted = () => {
    if (!order?.stages?.prepress?.subProcesses) return false;
    
    const subProcesses = order.stages.prepress.subProcesses;
    return (
      subProcesses.positioning?.status === 'Completed' &&
      subProcesses.laserImaging?.status === 'Completed' &&
      subProcesses.exposure?.status === 'Completed' &&
      subProcesses.washout?.status === 'Completed' &&
      subProcesses.drying?.status === 'Completed' &&
      subProcesses.finishing?.status === 'Completed'
    );
  };

  // Calculate price breakdown details
  const calculatePriceBreakdown = () => {
    if (!order || !order.specifications) return null;
    
    const { dimensions, materialThickness, colors } = order.specifications;
    
    // Calculate base dimensions with repeat
    const width = parseFloat(dimensions?.width || 0);
    const height = parseFloat(dimensions?.height || 0);
    const widthRepeat = parseInt(dimensions?.widthRepeatCount || 1);
    const heightRepeat = parseInt(dimensions?.heightRepeatCount || 1);
    
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
    
    // Calculate color multiplier
    let colorMultiplier = colors || 1;
    
    // Calculate final price
    const estimatedPrice = order.cost?.estimatedCost || (totalArea * colorMultiplier * materialPriceFactor).toFixed(2);
    
    // Use cm as the unit rather than mm
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
            <p className="text-gray-500">Order not found</p>
            <Link
              to="/manager/orders"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order header */}
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
                {order.status || 'Unknown Status'}
              </span>
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
        <div className="px-3 py-4 sm:px-6 sm:py-5">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Customer Information */}
              <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <h4 className="text-base font-medium text-gray-900 flex items-center">
                    <UserCircleIcon className="h-5 w-5 mr-2 text-primary-500" />
                    Customer Information
                  </h4>
                  <OrderReceipt order={order} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 sm:gap-y-4 p-3 sm:p-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Customer Name</div>
                    <div className="mt-1 text-sm text-gray-900">{order.client?.name || order.customer?.name || 'N/A'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Email</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {order.client?.email || order.customer?.email ? (
                        <a 
                          href={`mailto:${order.client?.email || order.customer?.email}`} 
                          className="text-primary-600 hover:text-primary-800"
                        >
                          {order.client?.email || order.customer?.email}
                        </a>
                      ) : 'N/A'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Order Date</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {formatDate(order.createdAt)}
                      {order.createdAt && <span className="ml-2 text-gray-500">{formatTime(order.createdAt)}</span>}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Order Information */}
              <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="text-base font-medium text-gray-900">Order Information</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 sm:gap-y-4 p-3 sm:p-4">
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
                    <div className="text-sm font-medium text-gray-500">Assigned To</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {order.assignedTo ? `${order.assignedTo.name}` : 'Not assigned'}
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
                </div>
              </div>
              
              {/* Technical Specifications */}
              <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="text-base font-medium text-gray-900">Technical Specifications</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 p-4">
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
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-white px-4 py-3 border-b border-gray-200">
                  <h4 className="text-base font-medium text-gray-900">Order Progress</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Current status: <span className="font-medium">{order.status}</span>
                  </p>
                </div>
                <div className="p-4 sm:p-6">
                  {/* Progress Bar - Hidden on mobile, visible on PC */}
                  <div className="hidden sm:block mb-6">
                    <OrderProgressBar order={order} className="mt-2" />
                  </div>

                  {/* Detailed Steps */}
                  <div className="space-y-4 mt-6">
                    {/* Order Submission Step */}
                    <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                      <div className="px-4 py-4 sm:px-6 flex items-center">
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full ${
                          true ? 'bg-green-500' : 'bg-gray-200'
                        } flex items-center justify-center mr-3`}>
                          {true ? (
                            <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                          ) : (
                            <span className="text-xs text-white font-medium">1</span>
                          )}
                            </div>
                        <div>
                          <h4 className="text-base font-medium text-gray-900">Order Submission</h4>
                          <p className="text-sm text-gray-500">
                                Completed on {formatDate(order.createdAt)}
                              </p>
                          </div>
                        </div>
                      </div>
                      
                    {/* Design & Ripping (Design Stage) */}
                    <div className={`bg-white border ${
                      order.status === 'Designing' ? 'border-yellow-400' : 
                      order.status === 'Design Done' || order.status === 'In Prepress' || 
                      order.status === 'Ready for Delivery' || order.status === 'Completed' ? 'border-green-400' : 'border-gray-200'
                    } rounded-md overflow-hidden`}>
                      <div className="px-4 py-4 sm:px-6 flex items-center">
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full ${
                          order.status === 'Design Done' || order.status === 'In Prepress' || 
                          order.status === 'Ready for Delivery' || order.status === 'Completed' ? 'bg-green-500' : 
                          order.status === 'Designing' ? 'bg-yellow-400' : 'bg-gray-200'
                        } flex items-center justify-center mr-3`}>
                          {order.status === 'Design Done' || order.status === 'In Prepress' || 
                           order.status === 'Ready for Delivery' || order.status === 'Completed' ? (
                            <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <span className="text-xs text-white font-medium">2</span>
                              )}
                            </div>
                        <div className="flex-1">
                          <h4 className="text-base font-medium text-gray-900">Design</h4>
                          <p className="text-sm text-gray-500">
                            {order.status === 'Design Done' || order.status === 'In Prepress' || 
                             order.status === 'Ready for Delivery' || order.status === 'Completed' 
                             ? `Completed with order on ${formatDate(order.stages?.design?.completionDate || order.updatedAt)}` 
                             : order.status === 'Designing' 
                             ? 'In progress' 
                                      : 'Not started'}
                              </p>
                            </div>
                          </div>
                      {/* Subprocesses inside Design stage */}
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Design Sub-processes</h5>
                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex items-center">
                            <div className={`h-4 w-4 rounded-full ${
                              order.stages?.production?.subProcesses?.ripping?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                            } mr-2`}></div>
                            <span className="text-xs text-gray-600">Ripping (Designer)</span>
                          </div>
                        </div>
                      </div>
                      </div>
                      
                    {/* Prepress Step */}
                    <div className={`bg-white border ${
                      order.status === 'In Prepress' ? 'border-yellow-400' : 
                      order.status === 'Ready for Delivery' || order.status === 'Completed' ? 'border-green-400' : 'border-gray-200'
                    } rounded-md overflow-hidden`}>
                      <div className="px-4 py-4 sm:px-6 flex items-center">
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full ${
                          order.status === 'Ready for Delivery' || order.status === 'Completed' ? 'bg-green-500' : 
                          order.status === 'In Prepress' ? 'bg-yellow-400' : 'bg-gray-200'
                        } flex items-center justify-center mr-3`}>
                          {order.status === 'Ready for Delivery' || order.status === 'Completed' ? (
                            <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  ) : (
                            <span className="text-xs text-white font-medium">3</span>
                                  )}
                                    </div>
                        <div className="flex-1">
                          <h4 className="text-base font-medium text-gray-900">Prepress</h4>
                          <p className="text-sm text-gray-500">
                            {order.status === 'Ready for Delivery' || order.status === 'Completed' 
                             ? `Completed on ${formatDate(order.stages?.prepress?.completionDate || order.updatedAt)}` 
                             : order.status === 'In Prepress' 
                             ? 'In progress' 
                                        : 'Not started'}
                                  </p>
                                </div>
                      </div>

                      {/* Prepress Sub-processes */}
                      {(order.status === 'In Prepress' || order.status === 'Ready for Delivery' || order.status === 'Completed') && (
                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Prepress Sub-processes</h5>
                          <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className={`h-4 w-4 rounded-full ${
                                  order.stages?.prepress?.subProcesses?.positioning?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                                } mr-2`}></div>
                                <span className="text-xs text-gray-600">Positioning</span>
                              </div>
                              {order.stages?.prepress?.subProcesses?.positioning?.status === 'Completed' && 
                                order.stages?.prepress?.subProcesses?.positioning?.completedBy && (
                                <span className="text-xs text-gray-500">
                                  Completed by {order.stages?.prepress?.subProcesses?.positioning?.completedBy?.name || 'Unknown'}
                                  {order.stages?.prepress?.subProcesses?.positioning?.completedAt && (
                                    ` on ${formatDate(order.stages?.prepress?.subProcesses?.positioning?.completedAt)} at ${formatTime(order.stages?.prepress?.subProcesses?.positioning?.completedAt)}`
                                  )}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className={`h-4 w-4 rounded-full ${
                                  order.stages?.prepress?.subProcesses?.laserImaging?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                                } mr-2`}></div>
                                <span className="text-xs text-gray-600">Laser Imaging</span>
                              </div>
                              {order.stages?.prepress?.subProcesses?.laserImaging?.status === 'Completed' && 
                                order.stages?.prepress?.subProcesses?.laserImaging?.completedBy && (
                                <span className="text-xs text-gray-500">
                                  Completed by {order.stages?.prepress?.subProcesses?.laserImaging?.completedBy?.name || 'Unknown'} 
                                  {order.stages?.prepress?.subProcesses?.laserImaging?.completedAt && 
                                    ` on ${formatDate(order.stages?.prepress?.subProcesses?.laserImaging?.completedAt)} at ${formatTime(order.stages?.prepress?.subProcesses?.laserImaging?.completedAt)}`}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className={`h-4 w-4 rounded-full ${
                                  order.stages?.prepress?.subProcesses?.exposure?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                                } mr-2`}></div>
                                <span className="text-xs text-gray-600">Exposure</span>
                              </div>
                              {order.stages?.prepress?.subProcesses?.exposure?.status === 'Completed' && 
                                order.stages?.prepress?.subProcesses?.exposure?.completedBy && (
                                <span className="text-xs text-gray-500">
                                  Completed by {order.stages?.prepress?.subProcesses?.exposure?.completedBy?.name || 'Unknown'} 
                                  {order.stages?.prepress?.subProcesses?.exposure?.completedAt && 
                                    ` on ${formatDate(order.stages?.prepress?.subProcesses?.exposure?.completedAt)} at ${formatTime(order.stages?.prepress?.subProcesses?.exposure?.completedAt)}`}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className={`h-4 w-4 rounded-full ${
                                  order.stages?.prepress?.subProcesses?.washout?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                                } mr-2`}></div>
                                <span className="text-xs text-gray-600">Washout</span>
                              </div>
                              {order.stages?.prepress?.subProcesses?.washout?.status === 'Completed' && 
                                order.stages?.prepress?.subProcesses?.washout?.completedBy && (
                                <span className="text-xs text-gray-500">
                                  Completed by {order.stages?.prepress?.subProcesses?.washout?.completedBy?.name || 'Unknown'} 
                                  {order.stages?.prepress?.subProcesses?.washout?.completedAt && 
                                    ` on ${formatDate(order.stages?.prepress?.subProcesses?.washout?.completedAt)} at ${formatTime(order.stages?.prepress?.subProcesses?.washout?.completedAt)}`}
                                  </span>
                                )}
                                </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className={`h-4 w-4 rounded-full ${
                                  order.stages?.prepress?.subProcesses?.drying?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                                } mr-2`}></div>
                                <span className="text-xs text-gray-600">Drying</span>
                              </div>
                              {order.stages?.prepress?.subProcesses?.drying?.status === 'Completed' && 
                                order.stages?.prepress?.subProcesses?.drying?.completedBy && (
                                <span className="text-xs text-gray-500">
                                  Completed by {order.stages?.prepress?.subProcesses?.drying?.completedBy?.name || 'Unknown'} 
                                  {order.stages?.prepress?.subProcesses?.drying?.completedAt && 
                                    ` on ${formatDate(order.stages?.prepress?.subProcesses?.drying?.completedAt)} at ${formatTime(order.stages?.prepress?.subProcesses?.drying?.completedAt)}`}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className={`h-4 w-4 rounded-full ${
                                  order.stages?.prepress?.subProcesses?.finishing?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                                } mr-2`}></div>
                                <span className="text-xs text-gray-600">Finishing</span>
                              </div>
                              {order.stages?.prepress?.subProcesses?.finishing?.status === 'Completed' && 
                                order.stages?.prepress?.subProcesses?.finishing?.completedBy && (
                                <span className="text-xs text-gray-500">
                                  Completed by {order.stages?.prepress?.subProcesses?.finishing?.completedBy?.name || 'Unknown'} 
                                  {order.stages?.prepress?.subProcesses?.finishing?.completedAt && 
                                    ` on ${formatDate(order.stages?.prepress?.subProcesses?.finishing?.completedAt)} at ${formatTime(order.stages?.prepress?.subProcesses?.finishing?.completedAt)}`}
                                </span>
                            )}
                            </div>
                          </div>
                        </div>
                      )}
                      </div>
                      
                    {/* Delivery Step */}
                    <div className={`bg-white border ${
                      order.status === 'Ready for Delivery' ? 'border-yellow-400' : 
                      order.status === 'Completed' ? 'border-green-400' : 'border-gray-200'
                    } rounded-md overflow-hidden`}>
                      <div className="px-4 py-4 sm:px-6 flex items-center">
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full ${
                          order.status === 'Completed' ? 'bg-green-500' : 
                          order.status === 'Ready for Delivery' ? 'bg-yellow-400' : 'bg-gray-200'
                        } flex items-center justify-center mr-3`}>
                          {order.status === 'Completed' ? (
                            <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                        ) : (
                                  <span className="text-xs text-white font-medium">4</span>
                                )}
                                  </div>
                        <div>
                          <h4 className="text-base font-medium text-gray-900">Delivery</h4>
                          <p className="text-sm text-gray-500">
                            {order.status === 'Completed' 
                             ? `Completed on ${formatDate(order.stages?.delivery?.completionDate || order.updatedAt)}` 
                             : order.status === 'Ready for Delivery' 
                             ? 'In progress' 
                                    : 'Not started'}
                              </p>
                        </div>
                      </div>

                      {/* Delivery Method Information */}
                      {order.status === 'Ready for Delivery' && order.stages?.delivery?.courierInfo?.mode && (
                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Delivery Method</h5>
                          <div className="space-y-2">
                            {order.stages.delivery.courierInfo.mode === 'direct' && (
                              <div className="flex items-center">
                                <div className="h-4 w-4 rounded-full bg-green-500 mr-2"></div>
                                <span className="text-xs text-gray-600">Direct Handover</span>
                              </div>
                            )}
                            {order.stages.delivery.courierInfo.mode === 'client-collection' && (
                              <div className="flex items-center">
                                <div className="h-4 w-4 rounded-full bg-yellow-500 mr-2"></div>
                                <span className="text-xs text-gray-600">Client Self-Collection</span>
                              </div>
                            )}
                            {order.stages.delivery.courierInfo.mode === 'shipping-company' && (
                              <div className="flex items-center">
                                <div className="h-4 w-4 rounded-full bg-blue-500 mr-2"></div>
                                <span className="text-xs text-gray-600">Shipping Company (Middle East)</span>
                              </div>
                            )}
                            
                            {/* Delivery Address/Collection Address */}
                            {order.stages?.delivery?.courierInfo?.destination && (
                              <div className="mt-2 p-2 bg-white rounded border">
                                <p className="text-xs font-medium text-gray-700 mb-1">
                                  {order.stages.delivery.courierInfo.mode === 'client-collection' ? 'Collection Address:' : 'Delivery Address:'}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {order.stages.delivery.courierInfo.destination.street && `${order.stages.delivery.courierInfo.destination.street}, `}
                                  {order.stages.delivery.courierInfo.destination.city && `${order.stages.delivery.courierInfo.destination.city}, `}
                                  {order.stages.delivery.courierInfo.destination.state && `${order.stages.delivery.courierInfo.destination.state} `}
                                  {order.stages.delivery.courierInfo.destination.postalCode && `${order.stages.delivery.courierInfo.destination.postalCode}, `}
                                  {order.stages.delivery.courierInfo.destination.country}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
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
                  {/* Client files section */}
                  {order.files && order.files.some(file => file.uploadedBy?.role === 'client') && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Client Files</h4>
                      <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                        {order.files
                          .filter(file => file.uploadedBy?.role === 'client')
                          .map((file, index) => (
                            <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                              <div className="w-0 flex-1 flex items-center">
                                <PaperClipIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                                <span className="ml-2 flex-1 w-0 truncate">
                                  {file.originalname || file.filename}
                                  <span className="ml-2 text-xs text-gray-500">
                                    (Uploaded by {file.uploadedBy?.name || 'client'})
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

                  {/* Employee files section */}
                  {order.files && order.files.some(file => file.uploadedBy?.role === 'employee' || file.uploadedBy?.role === 'prepress') && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Employee Files</h4>
                      <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                        {order.files
                          .filter(file => file.uploadedBy?.role === 'employee' || file.uploadedBy?.role === 'prepress')
                          .map((file, index) => (
                            <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                              <div className="w-0 flex-1 flex items-center">
                                <PaperClipIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                                <span className="ml-2 flex-1 w-0 truncate">
                                  {file.originalname || file.filename}
                                  <span className="ml-2 text-xs text-gray-500">
                                    (Uploaded by {file.uploadedBy?.name || 'employee'} - {file.uploadedBy?.role})
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

                  {/* Manager files section */}
                  {order.files && order.files.some(file => file.uploadedBy?.role === 'manager') && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Manager Files</h4>
                      <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                        {order.files
                          .filter(file => file.uploadedBy?.role === 'manager')
                          .map((file, index) => (
                            <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                              <div className="w-0 flex-1 flex items-center">
                                <PaperClipIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                                <span className="ml-2 flex-1 w-0 truncate">
                                  {file.originalname || file.filename}
                                  <span className="ml-2 text-xs text-gray-500">
                                    (Uploaded by {file.uploadedBy?.name || 'manager'} - {file.uploadedBy?.role})
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
                              Order has been shipped. Shipment label uploaded by courier.
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
                                    (Shipment Label - Uploaded by {file.uploadedBy?.name || 'courier'})
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

                  {/* Upload new files section */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Upload New Files</h4>
                    <div
                      {...getRootProps()}
                      className={`mt-2 flex justify-center px-6 pt-5 pb-6 border-2 ${
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

                    {files.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Files to upload:</h4>
                        <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                          {files.map((file, index) => (
                            <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                              <div className="w-0 flex-1 flex items-center">
                                <PaperClipIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                                <span className="ml-2 flex-1 w-0 truncate">{file.name}</span>
                              </div>
                              <div className="ml-4 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => removeFile(file)}
                                  className="font-medium text-red-600 hover:text-red-500"
                                >
                                  <XMarkIcon className="h-5 w-5" />
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

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="text-base font-medium text-gray-900">Order Comments</h4>
                  <p className="mt-1 text-sm text-gray-500">Communication and notes about this order</p>
                </div>
                <div className="p-6">
                  {order.comments && order.comments.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {order.comments.map((comment, index) => (
                        <li key={index} className="py-4">
                          <div className="flex space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {comment.author?.name?.charAt(0) || 'U'}
                                </span>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {comment.author?.name || 'Unknown'}
                                <span className="text-sm text-gray-500 ml-2">
                                  {formatDate(comment.createdAt)}
                                </span>
                              </p>
                              <div className="text-sm text-gray-500">
                                <p>{comment.content}</p>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8">
                      <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No comments yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Start the conversation by adding a comment below.
                      </p>
                    </div>
                  )}

                  {/* Add Comment Form */}
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Add a comment</h4>
                    <form onSubmit={handleCommentSubmit}>
                      <textarea
                        rows="3"
                        name="comment"
                        id="comment"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Type your comment here..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                      ></textarea>
                      <div className="mt-3">
                        <button
                          type="submit"
                          disabled={submittingComment || !comment.trim()}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingComment ? 'Submitting...' : 'Submit Comment'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Actions Section */}
        <div className="border-t border-gray-200 px-3 py-4 sm:px-6 bg-gray-50">
          {/* Navigation and Assignment Section */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
            <Link
              to="/manager/orders"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Back to Orders
            </Link>
            
            {/* Employee Assignment Dropdown */}
            {!['Completed', 'Cancelled'].includes(order.status) && (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="">Select Employee</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssignOrder}
                  disabled={isAssigning || !selectedEmployee}
                  className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 text-center"
                >
                  {isAssigning ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            )}
          </div>
          
          {/* Status Update Buttons */}
          {!['Completed', 'Cancelled'].includes(order.status) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {order.status !== 'In Prepress' && (
                <button
                  onClick={() => handleStatusUpdate('In Prepress')}
                  disabled={updating}
                  className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <span className="hidden sm:inline">Mark as In Prepress</span>
                  <span className="sm:hidden">In Prepress</span>
                </button>
              )}
              
              <button
                onClick={() => handleStatusUpdate('Ready for Delivery')}
                disabled={updating}
                className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <span className="hidden sm:inline">Ready for Delivery</span>
                <span className="sm:hidden">Ready</span>
              </button>
              
              <button
                onClick={() => handleStatusUpdate('Completed')}
                disabled={updating}
                className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <span className="hidden sm:inline">Complete Order</span>
                <span className="sm:hidden">Complete</span>
              </button>
              
              <button
                onClick={() => handleStatusUpdate('Cancelled')}
                disabled={updating}
                className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                <span className="hidden sm:inline">Cancel Order</span>
                <span className="sm:hidden">Cancel</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;