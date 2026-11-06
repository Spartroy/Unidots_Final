import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';
import { InformationCircleIcon, DocumentTextIcon, ChatBubbleLeftRightIcon, CloudArrowUpIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useDropzone } from 'react-dropzone';

import OrderChat from '../../components/common/OrderChat';
import useAutoRefresh from '../../hooks/useAutoRefresh';


import DetailsTab from './orderDetail/DetailsTab';
import ProgressTab from './orderDetail/ProgressTab';
import FilesTab from './orderDetail/FilesTab';
import CommentsTab from './orderDetail/CommentsTab';
import CompletionModal from './orderDetail/CompletionModal';
import DeliveryModal from './orderDetail/DeliveryModal';
import RippingModal from './orderDetail/RippingModal';
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
  const [designLink, setDesignLink] = useState('');
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('direct');
  const [shipmentCompany, setShipmentCompany] = useState('');
  const [tempAddress, setTempAddress] = useState('');
  const [choosingDelivery, setChoosingDelivery] = useState(false);
  const [markingDelivered, setMarkingDelivered] = useState(false);

  // File ripping modal states
  const [showRippingModal, setShowRippingModal] = useState(false);
  const [rippingFiles, setRippingFiles] = useState([]);
  const [rippingLink, setRippingLink] = useState('');
  const [rippingNote, setRippingNote] = useState('');
  const [uploadingRipping, setUploadingRipping] = useState(false);

  // Tabs with mobile names
  const tabs = [
    { id: 'details', name: 'Order Details', mobileName: 'Details', icon: InformationCircleIcon },
    { id: 'progress', name: 'Progress', mobileName: 'Progress', icon: ClockIcon },
    { id: 'files', name: 'Files', mobileName: 'Files', icon: CloudArrowUpIcon },
    { id: 'comments', name: 'Comments', mobileName: 'Comments', icon: DocumentTextIcon },
    { id: 'chat', name: 'Chat', mobileName: 'Chat', icon: ChatBubbleLeftRightIcon },
  ];

  // Tab scrolling ref
  const tabsRef = useRef(null);

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

  const refreshOrder = useCallback(async () => {
    try {
      const response = await api.get(`/api/orders/${id}`);
      setOrder(response.data);
    } catch (_e) {
      // silent during background refresh
    }
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

  // Ripping file dropzone setup
  const onRippingDrop = acceptedFiles => {
    console.log('Ripping files dropped:', acceptedFiles);
    setRippingFiles(prevFiles => [
      ...prevFiles,
      ...acceptedFiles.map(file =>
        Object.assign(file, { preview: URL.createObjectURL(file) })
      )
    ]);
  };

  const { getRootProps: getRippingRootProps, getInputProps: getRippingInputProps, isDragActive: isRippingDragActive } = useDropzone({
    onDrop: onRippingDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'application/vnd.adobe.illustrator': ['.ai'],
      'application/postscript': ['.eps'],
      'application/x-photoshop': ['.psd'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeRippingFile = (fileToRemove) => {
    setRippingFiles(rippingFiles.filter(file => file !== fileToRemove));
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
    if (files.length === 0 && !designLink.trim()) {
      toast.error('Please upload at least one file OR provide a design link to complete the design stage.');
      return;
    }
    
    try {
      setUploading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add files if any are selected
      if (files.length > 0) {
        files.forEach(file => {
          formData.append('files', file);
        });
      }
      
      // Add metadata as separate fields
      formData.append('relatedOrder', id);
      formData.append('fileType', 'design');
      formData.append('notes', completionNote || 'Completed design files');
      
      // Add design link if provided
      if (designLink.trim()) {
        formData.append('designLink', designLink.trim());
      }
      
      console.log('Uploading files/design link to order:', id);
      
      // Upload files or design link
      const uploadResponse = await api.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      if (uploadResponse.data) {
        console.log('Upload successful:', uploadResponse.data);
        
        // Wait a moment to ensure everything is fully processed
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('About to update status to Design Done');
        
        try {
          // Mark stage as completed - use 'Design Done' status instead of 'Completed'
          await handleStatusUpdate('Design Done');
          setShowCompletionModal(false);
          setFiles([]);
          setCompletionNote('');
          setDesignLink(''); // Clear designLink on completion
          toast.success('Design stage completed successfully');
        } catch (statusError) {
          console.error('Error in status update part:', statusError);
          // Even if status update fails, we don't want to lose the upload
          toast.error('Upload successful but failed to update order status');
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
        toast.error('Failed to upload files/link or complete design stage');
      }
    } finally {
      setUploading(false);
    }
  };

  const uploadRippingFilesAndComplete = async () => {
    if (rippingFiles.length === 0 && !rippingLink.trim()) {
      toast.error('Please upload at least one file OR provide a ripping link to complete the ripping stage.');
      return;
    }
    
    try {
      setUploadingRipping(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add files if any are selected
      if (rippingFiles.length > 0) {
        rippingFiles.forEach(file => {
          formData.append('files', file);
        });
      }
      
      // Add metadata as separate fields
      formData.append('relatedOrder', id);
      formData.append('fileType', 'ripping');
      formData.append('notes', rippingNote || 'Ripping files');
      
      // Add ripping link if provided
      if (rippingLink.trim()) {
        formData.append('designLink', rippingLink.trim());
      }
      
      console.log('Uploading ripping files/link to order:', id);
      console.log('FormData contents:', {
        files: rippingFiles.length,
        fileType: 'ripping',
        relatedOrder: id,
        notes: rippingNote || 'Ripping files',
        designLink: rippingLink.trim() || 'none'
      });
      
      // Upload files or ripping link
      const uploadResponse = await api.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      if (uploadResponse.data) {
        console.log('Ripping upload successful:', uploadResponse.data);
        
        // Wait a moment to ensure everything is fully processed
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          // If order is still in 'Designing' status, first update to 'Design Done'
          if (order.status === 'Designing') {
            await handleStatusUpdate('Design Done');
          }
          
          // Mark ripping as completed and move to prepress
          await api.put(`/api/orders/${id}/ripping-complete`, {});
          setShowRippingModal(false);
          setRippingFiles([]);
          setRippingNote('');
          setRippingLink('');
          
          // Refresh order data
          const response = await api.get(`/api/orders/${id}`);
          setOrder(response.data);
          
          toast.success('Ripping completed and order moved to Prepress');
        } catch (statusError) {
          console.error('Error in ripping completion:', statusError);
          console.error('Error response:', statusError.response?.data);
          toast.error(statusError.response?.data?.message || 'Upload successful but failed to complete ripping stage');
        }
      }
    } catch (error) {
      console.error('Error uploading ripping files:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to upload ripping files/link');
      }
    } finally {
      setUploadingRipping(false);
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

  const handleMarkAsDelivered = async () => {
    try {
      setMarkingDelivered(true);
      await api.put(`/api/orders/${id}/status`, { status: 'Completed' });
      const response = await api.get(`/api/orders/${id}`);
      setOrder(response.data);
      toast.success('Order marked as delivered and completed!');
    } catch (error) {
      toast.error('Failed to mark order as delivered');
      console.error('Error marking as delivered:', error);
    } finally {
      setMarkingDelivered(false);
    }
  };

  const handleChooseDeliveryMethod = async () => {
    try {
      setChoosingDelivery(true);
      await api.post(`/api/orders/${id}/choose-delivery`, {
        deliveryMethod,
        shipmentCompany: deliveryMethod === 'shipping-company' ? 'Middle East' : undefined,
        tempAddress: deliveryMethod === 'direct' ? tempAddress : undefined
      });
      
      const response = await api.get(`/api/orders/${id}`);
      setOrder(response.data);
      setShowDeliveryModal(false);
      setDeliveryMethod('direct');
      setShipmentCompany('');
      setTempAddress(''); // Clear temporary address on completion
      
      // Show appropriate success message based on delivery method
      let successMessage = '';
      if (deliveryMethod === 'direct') {
        successMessage = 'Delivery method set to direct handover';
      } else if (deliveryMethod === 'client-collection') {
        successMessage = 'Delivery method set to client self-collection';
      } else if (deliveryMethod === 'shipping-company') {
        successMessage = 'Delivery method set to shipping company (Middle East)';
      }
      toast.success(successMessage);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to set delivery method');
      console.error('Error choosing delivery method:', error);
    } finally {
      setChoosingDelivery(false);
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
          <div className="flex flex-col items-end space-y-2">
            <div>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <div>
              <button
                onClick={() => navigate(`/employee/orders/${id}/edit`)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Edit Order
              </button>
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
          {activeTab === 'details' && <DetailsTab formatDate={formatDate} formatTime={formatTime} order={order} />}

          {activeTab === 'progress' && <ProgressTab formatDate={formatDate} formatTime={formatTime} order={order} />}

          {activeTab === 'files' && <FilesTab files={files} getInputProps={getInputProps} getRootProps={getRootProps} id={id} isDragActive={isDragActive} order={order} removeFile={removeFile} setFiles={setFiles} setOrder={setOrder} />}

          {activeTab === 'comments' && <CommentsTab comment={comment} formatDate={formatDate} handleCommentSubmit={handleCommentSubmit} order={order} setComment={setComment} submittingComment={submittingComment} />}

          {activeTab === 'chat' && (
            <div className="space-y-4 sm:space-y-6 h-full">
              <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden h-full flex flex-col">
                <div className="bg-white px-4 py-3 border-b border-gray-200">
                  <h4 className="text-base font-medium text-gray-900">Order Communication</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Chat with the client about this order
                  </p>
                </div>
                <div className="p-2 sm:p-4 flex-1 flex flex-col">
                  <div className="flex-1">
                    <OrderChat orderId={order._id} isVisible={activeTab === 'chat'} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions section */}
        <div className="border-t border-gray-200 px-3 py-4 sm:px-6 bg-gray-50">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
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
            {/* Button to open ripping modal (designer responsibility) */}
            {['Design Done', 'Designing'].includes(order.status) && (
              <button
                onClick={() => setShowRippingModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                File Ripping
              </button>
            )}

            {/* Delivery Method Selection Button - Show when prepress is completed and designer can choose delivery */}
            {order.stages?.prepress?.status === 'Completed' && order.status !== 'Ready for Delivery' && order.status !== 'Delivering' && order.status !== 'Completed' && (
              <button
                onClick={() => setShowDeliveryModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Choose Delivery Method
              </button>
            )}

            {/* Direct Delivery Confirmation Button - Show when direct delivery is chosen */}
            {order.status === 'Ready for Delivery' && order.stages?.delivery?.courierInfo?.mode === 'direct' && (
              <button
                onClick={handleMarkAsDelivered}
                disabled={markingDelivered}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                {markingDelivered ? 'Processing...' : 'Confirm Direct Delivery & Complete Order'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Design Completion Modal */}
      {showCompletionModal && <CompletionModal completionNote={completionNote} designLink={designLink} files={files} getInputProps={getInputProps} getRootProps={getRootProps} isDragActive={isDragActive} removeFile={removeFile} setCompletionNote={setCompletionNote} setDesignLink={setDesignLink} setShowCompletionModal={setShowCompletionModal} uploadFilesAndCompleteOrder={uploadFilesAndCompleteOrder} uploading={uploading} />}

      {/* Delivery Method Selection Modal */}
      {showDeliveryModal && <DeliveryModal choosingDelivery={choosingDelivery} deliveryMethod={deliveryMethod} handleChooseDeliveryMethod={handleChooseDeliveryMethod} order={order} setDeliveryMethod={setDeliveryMethod} setShipmentCompany={setShipmentCompany} setShowDeliveryModal={setShowDeliveryModal} setTempAddress={setTempAddress} tempAddress={tempAddress} />}

      {/* File Ripping Modal */}
      {showRippingModal && <RippingModal getRippingInputProps={getRippingInputProps} getRippingRootProps={getRippingRootProps} isRippingDragActive={isRippingDragActive} removeRippingFile={removeRippingFile} rippingFiles={rippingFiles} rippingLink={rippingLink} rippingNote={rippingNote} setRippingLink={setRippingLink} setRippingNote={setRippingNote} setShowRippingModal={setShowRippingModal} uploadRippingFilesAndComplete={uploadRippingFilesAndComplete} uploadingRipping={uploadingRipping} />}
    </div>
  );
};

export default OrderDetail;