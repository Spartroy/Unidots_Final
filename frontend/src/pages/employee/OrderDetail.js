import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';
import { 
  PaperClipIcon, 
  XMarkIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CloudArrowUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useDropzone } from 'react-dropzone';
import OrderProgressBar from '../../components/common/OrderProgressBar';
import OrderChat from '../../components/common/OrderChat';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // File upload states
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [completionNote, setCompletionNote] = useState('');

  // Tabs
  const tabs = [
    { id: 'details', name: 'Order Details', icon: InformationCircleIcon },
    { id: 'progress', name: 'Progress', icon: ClockIcon },
    { id: 'files', name: 'Files', icon: CloudArrowUpIcon },
    { id: 'comments', name: 'Comments', icon: DocumentTextIcon },
    { id: 'chat', name: 'Chat', icon: ChatBubbleLeftRightIcon },
  ];

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/api/orders/${id}`);
        setOrder(response.data);
      } catch (error) {
        toast.error('Failed to fetch order details');
        console.error('Error fetching order:', error);
        // Redirect back to orders list if order not found
        if (error.response?.status === 404) {
          navigate('/employee/orders');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, navigate]);

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
      case 'Designing':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
      case 'Design Done':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'On Hold':
        return 'bg-gray-100 text-gray-800';
      case 'Ready for Delivery':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // File upload dropzone setup
  const onDrop = acceptedFiles => {
    console.log('Files dropped:', acceptedFiles);
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

  const handleStageComplete = async (stageIndex) => {
    try {
      setUpdating(true);
      await api.put(`/api/orders/${id}/stages/${stageIndex}/complete`);
      // Refresh order data
      const response = await api.get(`/api/orders/${id}`);
      setOrder(response.data);
      toast.success('Stage marked as complete');
    } catch (error) {
      toast.error('Failed to update stage status');
      console.error('Error updating stage:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    // Move the statusMap outside of the try block so it's accessible in the catch block
    const statusMap = {
      'in progress': 'Designing',
      'design done': 'Design Done',
      'Design Done': 'Design Done',
      'completed': 'Design Done',
      'Completed': 'Design Done'
    };
    const statusToSend = statusMap[newStatus.toLowerCase()] || newStatus;
    
    try {
      setUpdating(true);
      // Convert "in progress" to "Designing" for proper client display
      // Make sure 'Design Done' status is passed through correctly
      
      console.log('Sending status update:', { statusToSend });
      
      await api.put(`/api/orders/${id}/status`, { status: statusToSend });
      // Refresh order data
      const response = await api.get(`/api/orders/${id}`);
      setOrder(response.data);
      toast.success(`Order status updated to ${newStatus === 'Completed' ? 'Design Done' : newStatus}`);
    } catch (error) {
      console.error('Error updating status - Full details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        requestData: { status: statusToSend }
      });
      toast.error(error.response?.data?.message || 'Failed to update order status');
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };
  
  const handleOrderCompletion = () => {
    // Show completion modal if files need to be uploaded
    setShowCompletionModal(true);
  };
  
  const uploadFilesAndCompleteOrder = async () => {
    if (files.length === 0) {
      toast.error('Please upload at least one file before completing the design stage');
      return;
    }
    
    try {
      setUploading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add files with correct parameter name
      files.forEach(file => {
        formData.append('files', file);
      });
      
      // Add metadata as separate fields
      formData.append('relatedOrder', id);
      formData.append('fileType', 'design');
      formData.append('notes', completionNote || 'Completed design files');
      
      console.log('Uploading files to order:', id);
      
      // Upload files
      const uploadResponse = await api.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      if (uploadResponse.data) {
        console.log('Files uploaded successfully:', uploadResponse.data);
        
        // Wait a moment to ensure files are fully processed
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('About to update status to Design Done');
        
        try {
          // Mark stage as completed - use 'Design Done' status instead of 'Completed'
          await handleStatusUpdate('Design Done');
        setShowCompletionModal(false);
        setFiles([]);
        setCompletionNote('');
          toast.success('Design stage completed and files uploaded');
        } catch (statusError) {
          console.error('Error in status update part:', statusError);
          // Even if status update fails, we don't want to lose the files we already uploaded
          toast.error('Files uploaded but failed to update order status');
        }
      }
    } catch (error) {
      console.error('Error details:', error.response?.data || error.message);
      console.error('Full error object:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to upload files or complete design stage');
      }
    } finally {
      setUploading(false);
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
                {order.status}
              </span>
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
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Customer info in a cleaner card layout */}
              <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="text-base font-medium text-gray-900">Customer Information</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 p-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 p-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Order Type</div>
                    <div className="mt-1 text-sm text-gray-900">{order.orderType || 'N/A'}</div>
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

          {activeTab === 'progress' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="text-base font-medium text-gray-900">Order Progress</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Current status: <span className="font-medium">{order.status}</span>
                  </p>
                </div>
                <div className="p-6">
                  {/* Order Progress Bar */}
                  <div className="mb-8">
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

                    {/* Design Step */}
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
                        <div>
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
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="flex items-center">
                              <div className={`h-4 w-4 rounded-full ${
                                order.stages?.prepress?.subProcesses?.ripping?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                              } mr-2`}></div>
                              <span className="text-xs text-gray-600">File Ripping</span>
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="text-base font-medium text-gray-900">Files</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Order attachments and design files
                  </p>
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
                                  href={`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/files/${file._id}/download`}
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
                  {order.files && order.files.some(file => file.uploadedBy?.role === 'employee' || file.uploadedBy?.role === 'prepress' || file.uploadedBy?.role === 'manager') && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Staff Files</h4>
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
                                    (Uploaded by {file.uploadedBy?.name || 'employee'} - {file.uploadedBy?.role})
                                  </span>
                                </span>
                              </div>
                              <div className="ml-4 flex-shrink-0">
                                <a
                                  href={`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/files/${file._id}/download`}
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
                            onClick={() => {
                              const formData = new FormData();
                              files.forEach(file => formData.append('files', file));
                              formData.append('relatedOrder', id);
                              formData.append('fileType', 'design');
                              
                              api.post('/api/files/upload', formData, {
                                headers: { 'Content-Type': 'multipart/form-data' }
                              })
                              .then(response => {
                                setFiles([]);
                                toast.success('Files uploaded successfully');
                                // Refresh order data
                                api.get(`/api/orders/${id}`).then(orderResponse => {
                                  setOrder(orderResponse.data);
                                });
                              })
                              .catch(error => {
                                console.error('Error uploading files:', error);
                                toast.error('Failed to upload files');
                              });
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            Upload Files
                          </button>
                        </div>
                      </div>
                    )}

                    {!order.files?.length && files.length === 0 && (
                      <p className="text-sm text-gray-500">No files attached to this order yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="text-base font-medium text-gray-900">Comments</h4>
                </div>
                <div className="border-t border-gray-200">
                  {order.comments && order.comments.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {order.comments.map((comment, index) => (
                        <li key={index} className="px-4 py-4">
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
                    <div className="px-4 py-5 sm:p-6 text-center">
                      <p className="text-gray-500">No comments yet</p>
                    </div>
                  )}

                  {/* Add Comment Form */}
                  <div className="px-4 py-5 sm:p-6 border-t border-gray-200">
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

          {activeTab === 'chat' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="text-base font-medium text-gray-900">Order Communication</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Chat with the client about this order
                  </p>
                </div>
                <div className="p-6">
                  <OrderChat orderId={order._id} isVisible={activeTab === 'chat'} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions section */}
        <div className="border-t border-gray-200 px-4 py-4 sm:px-6 bg-gray-50">
          <div className="flex space-x-3">
            <Link
              to="/employee/orders"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Back to Orders
            </Link>
            
            {/* Conditionally show action buttons based on status */}
            {order.status === 'Submitted' && (
              <button
                onClick={() => handleStatusUpdate('Designing')}
                disabled={updating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {updating ? 'Updating...' : 'Start Designing'}
              </button>
            )}
            
            {order.status === 'Designing' && (
              <button
                onClick={handleOrderCompletion}
                disabled={updating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {updating ? 'Updating...' : 'Complete Design'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Design Completion Modal */}
      {showCompletionModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Complete Design Stage</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Please upload your final design files and add any notes before completing this stage.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 sm:mt-6">
                <div className="mb-4">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Add any notes about the design files"
                    value={completionNote}
                    onChange={(e) => setCompletionNote(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Upload Files (required)
                  </label>
                  <div
                    {...getRootProps()}
                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer ${
                      isDragActive ? 'bg-gray-50 border-primary-500' : ''
                    }`}
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
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF, PDF, AI, PSD, EPS up to 50MB
                      </p>
                    </div>
                  </div>
                </div>

                {files.length > 0 && (
                  <ul className="mt-4 border border-gray-200 rounded-md divide-y divide-gray-200">
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
                )}
              </div>

              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={uploadFilesAndCompleteOrder}
                  disabled={uploading || files.length === 0}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Complete Design Stage'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompletionModal(false)}
                  disabled={uploading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
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