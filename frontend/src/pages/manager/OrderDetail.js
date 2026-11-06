import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';

import { PaperClipIcon, DocumentTextIcon, ClipboardIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

import { useDropzone } from 'react-dropzone';
import useAutoRefresh from '../../hooks/useAutoRefresh';


import DetailsTab from './orderDetail/DetailsTab';
import ProgressTab from './orderDetail/ProgressTab';
import FilesTab from './orderDetail/FilesTab';
import CommentsTab from './orderDetail/CommentsTab';
import StatusActionsPanel from './orderDetail/StatusActionsPanel';
import QuotePanel from '../../components/manager/QuotePanel';
import OrderTimeline from '../../components/common/OrderTimeline';
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
      subProcesses.backExposure?.status === 'Completed' &&
      subProcesses.laserImaging?.status === 'Completed' &&
      subProcesses.mainExposure?.status === 'Completed' &&
      subProcesses.washout?.status === 'Completed' &&
      subProcesses.drying?.status === 'Completed' &&
      subProcesses.postExposure?.status === 'Completed' &&
      subProcesses.uvcExposure?.status === 'Completed' &&
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
          {activeTab === 'details' && <DetailsTab formatDate={formatDate} formatTime={formatTime} order={order} />}

          {/* Progress Tab */}
          {activeTab === 'progress' && <ProgressTab formatDate={formatDate} formatTime={formatTime} order={order} />}

          {/* Files Tab */}
          {activeTab === 'files' && <FilesTab files={files} getInputProps={getInputProps} getRootProps={getRootProps} handleFileUpload={handleFileUpload} isDragActive={isDragActive} order={order} removeFile={removeFile} uploading={uploading} />}

          {/* Comments Tab */}
          {activeTab === 'comments' && <CommentsTab comment={comment} formatDate={formatDate} handleCommentSubmit={handleCommentSubmit} order={order} setComment={setComment} submittingComment={submittingComment} />}
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
          <div className="w-full"><QuotePanel order={order} onChanged={refreshOrder} /></div>
          <div className="w-full"><OrderTimeline orderId={order._id} refreshKey={order.updatedAt} /></div>
          {!['Completed', 'Cancelled'].includes(order.status) && <StatusActionsPanel handleStatusUpdate={handleStatusUpdate} order={order} updating={updating} />}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;