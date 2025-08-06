import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import AuthContext from '../../context/AuthContext';
import { toast } from 'react-toastify';
import OrderProgressBar from '../../components/common/OrderProgressBar';
import { PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDropzone } from 'react-dropzone';
import OrderReceipt from '../../components/common/OrderReceipt';

const PrepressOrderDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await api.get(`/api/orders/${id}`);
        setOrder(response.data);
        if (response.data.files) {
          setFiles(response.data.files);
        }
      } catch (error) {
        toast.error('Failed to load order details');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [id]);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
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

  const handleSubProcessUpdate = async (subProcess, newStatus) => {
    try {
      setUpdating(true);
      await api.put(`/api/orders/${id}/prepress-process`, {
        subProcess,
        status: newStatus
      });
      
      // If washout process is completed, record acid solution usage
      if (subProcess === 'washout' && newStatus === 'Completed' && order.specifications?.dimensions) {
        try {
          const dims = order.specifications.dimensions;
          const totalLengthCm = dims.width * (dims.widthRepeatCount || 1);
          const totalWidthCm = dims.height * (dims.heightRepeatCount || 1);
          const totalAreaM2 = (totalLengthCm * totalWidthCm) / 10000;
          
          await api.post('/api/acid-solution/usage', {
            orderId: id,
            areaProcessed: totalAreaM2
          });
          
          toast.success(`${subProcess} completed! Solvent solution consumption recorded: ${(totalAreaM2 * 10).toFixed(2)}L`);
        } catch (acidError) {
          console.error('Error recording Solvent solution usage:', acidError);
          toast.warning(`${subProcess} completed, but failed to record Solvent solution usage`);
        }
      } else {
        toast.success(`${subProcess} process ${newStatus === 'Completed' ? 'completed' : 'reset'}`);
      }
      
      // Refresh order data
      const response = await api.get(`/api/orders/${id}`);
      setOrder(response.data);
      
    } catch (error) {
      console.error('Error updating process status:', error);
      // Extract more specific error message if available
      const errorMessage = error.response?.data?.message || 'Failed to update process status';
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };
  
  const handleMarkPrepressCompleted = async () => {
    try {
      setUpdating(true);
      // Call API to mark only the prepress stage as completed
      await api.put(`/api/orders/${id}/prepress-complete`, {});
      
      // Refresh order data
      const response = await api.get(`/api/orders/${id}`);
      setOrder(response.data);
      
      toast.success('Prepress stage marked as completed. A manager will review and prepare for delivery.');
    } catch (error) {
      toast.error('Failed to mark prepress as completed');
      console.error('Error updating prepress status:', error);
    } finally {
      setUpdating(false);
    }
  };
  
  const getSubProcessStatusDisplay = (subProcess) => {
    if (!order?.stages?.prepress?.subProcesses) return { status: 'Pending', date: null };
    
    const process = order.stages.prepress.subProcesses[subProcess];
    return {
      status: process?.status || 'Pending',
      date: process?.completedAt
    };
  };
  
  const allProcessesCompleted = () => {
    if (!order?.stages?.prepress?.subProcesses) return false;
    
    const subProcesses = order.stages.prepress.subProcesses;
    return (
      subProcesses.ripping?.status === 'Completed' &&
      subProcesses.laserImaging?.status === 'Completed' &&
      subProcesses.exposure?.status === 'Completed' &&
      subProcesses.washout?.status === 'Completed' &&
      subProcesses.drying?.status === 'Completed' &&
      subProcesses.finishing?.status === 'Completed'
    );
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

  // Add file upload functionality
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
      formData.append('fileType', 'prepress');
      
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
        
        {/* Details Section */}
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          {/* Customer info in a cleaner card layout */}
          <div className="bg-white border border-gray-200 rounded-md overflow-hidden mb-6">
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
          <div className="bg-white border border-gray-200 rounded-md overflow-hidden mb-6">
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
          <div className="bg-white border border-gray-200 rounded-md overflow-hidden mb-6">
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

          {/* Acid Solution Consumption */}
          {order.specifications?.dimensions && (
            <div className="bg-white border border-gray-200 rounded-md overflow-hidden mb-6">
              <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                <h4 className="text-base font-medium text-gray-900 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                  </svg>
                  Solvent Solution Consumption
                </h4>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Total Area</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {(() => {
                        const dims = order.specifications.dimensions;
                        const totalLengthCm = dims.width * (dims.widthRepeatCount || 1);
                        const totalWidthCm = dims.height * (dims.heightRepeatCount || 1);
                        const totalAreaM2 = (totalLengthCm * totalWidthCm) / 10000;
                        return `${totalAreaM2.toFixed(3)} m²`;
                      })()}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Solvent Solution Needed</div>
                    <div className="mt-1 text-sm text-gray-900 text-blue-600 font-medium">
                      {(() => {
                        const dims = order.specifications.dimensions;
                        const totalLengthCm = dims.width * (dims.widthRepeatCount || 1);
                        const totalWidthCm = dims.height * (dims.heightRepeatCount || 1);
                        const totalAreaM2 = (totalLengthCm * totalWidthCm) / 10000;
                        const litersNeeded = totalAreaM2 * 10; // 10 liters per m²
                        return `${litersNeeded.toFixed(2)} L`;
                      })()}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Processing Cost</div>
                    <div className="mt-1 text-sm text-gray-900 text-green-600 font-medium">
                      {(() => {
                        const dims = order.specifications.dimensions;
                        const totalLengthCm = dims.width * (dims.widthRepeatCount || 1);
                        const totalWidthCm = dims.height * (dims.heightRepeatCount || 1);
                        const totalAreaM2 = (totalLengthCm * totalWidthCm) / 10000;
                        const estimatedCost = totalAreaM2 * 424.44; // Cost per m²
                        return `${estimatedCost.toFixed(2)} EGP`;
                      })()}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <div className="text-xs text-gray-600">
                    <p className="mb-1"><strong>Calculation:</strong> Area = (Width × Width Repeat) × (Height × Height Repeat) ÷ 10,000</p>
                    <p className="mb-1"><strong>Solution:</strong> 10 liters per m² required for washout process</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
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

        {/* Actions section */}
        <div className="border-t border-gray-200 px-4 py-4 sm:px-6 bg-gray-50">
          <div className="flex space-x-3">
            <Link
              to="/prepress/orders"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
          Back to Orders
        </Link>
            

          </div>
        </div>
      </div>
      
      {/* Order progress */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Order Progress</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Current status: <span className="font-medium">{order.status}</span>
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
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

            {/* Prepress Step - Highlighted as active for prepress users */}
            <div className={`bg-white border ${
              order.status === 'In Prepress' ? 'border-yellow-400 bg-yellow-50' : 
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
                  <h5 className="text-sm font-medium text-gray-700 mb-4">Prepress Sub-processes</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* File Ripping Process */}
                    <div className={`bg-white border ${getSubProcessStatusDisplay('ripping').status === 'Completed' ? 'border-green-300 shadow-sm' : 'border-gray-200'} rounded-lg p-4 transition-all hover:shadow-md`}>
                      <div className="flex items-center mb-3">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full ${getSubProcessStatusDisplay('ripping').status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'} flex items-center justify-center mr-3`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">File Ripping</h4>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSubProcessStatusDisplay('ripping').status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {getSubProcessStatusDisplay('ripping').status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        {getSubProcessStatusDisplay('ripping').status === 'Pending' ? (
                          <button
                            type="button"
                            onClick={() => handleSubProcessUpdate('ripping', 'Completed')}
                            disabled={updating}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                          >
                            Complete
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSubProcessUpdate('ripping', 'Pending')}
                            disabled={updating}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Laser Imaging Process */}
                    <div className={`bg-white border ${getSubProcessStatusDisplay('laserImaging').status === 'Completed' ? 'border-green-300 shadow-sm' : 'border-gray-200'} rounded-lg p-4 transition-all hover:shadow-md`}>
                      <div className="flex items-center mb-3">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full ${getSubProcessStatusDisplay('laserImaging').status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'} flex items-center justify-center mr-3`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Laser Imaging</h4>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSubProcessStatusDisplay('laserImaging').status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {getSubProcessStatusDisplay('laserImaging').status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        {getSubProcessStatusDisplay('laserImaging').status === 'Pending' ? (
                          <button
                            type="button"
                            onClick={() => handleSubProcessUpdate('laserImaging', 'Completed')}
                            disabled={updating}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                          >
                            Complete
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSubProcessUpdate('laserImaging', 'Pending')}
                            disabled={updating}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Exposure Process */}
                    <div className={`bg-white border ${getSubProcessStatusDisplay('exposure').status === 'Completed' ? 'border-green-300 shadow-sm' : 'border-gray-200'} rounded-lg p-4 transition-all hover:shadow-md`}>
                      <div className="flex items-center mb-3">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full ${getSubProcessStatusDisplay('exposure').status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'} flex items-center justify-center mr-3`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Exposure</h4>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSubProcessStatusDisplay('exposure').status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {getSubProcessStatusDisplay('exposure').status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        {getSubProcessStatusDisplay('exposure').status === 'Pending' ? (
                          <button
                            type="button"
                            onClick={() => handleSubProcessUpdate('exposure', 'Completed')}
                            disabled={updating}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                          >
                            Complete
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSubProcessUpdate('exposure', 'Pending')}
                            disabled={updating}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Washout Process */}
                    <div className={`bg-white border ${getSubProcessStatusDisplay('washout').status === 'Completed' ? 'border-green-300 shadow-sm' : 'border-gray-200'} rounded-lg p-4 transition-all hover:shadow-md`}>
                      <div className="flex items-center mb-3">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full ${getSubProcessStatusDisplay('washout').status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'} flex items-center justify-center mr-3`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Washout</h4>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSubProcessStatusDisplay('washout').status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {getSubProcessStatusDisplay('washout').status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        {getSubProcessStatusDisplay('washout').status === 'Pending' ? (
                          <button
                            type="button"
                            onClick={() => handleSubProcessUpdate('washout', 'Completed')}
                            disabled={updating}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                          >
                            Complete
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSubProcessUpdate('washout', 'Pending')}
                            disabled={updating}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Drying Process */}
                    <div className={`bg-white border ${getSubProcessStatusDisplay('drying').status === 'Completed' ? 'border-green-300 shadow-sm' : 'border-gray-200'} rounded-lg p-4 transition-all hover:shadow-md`}>
                      <div className="flex items-center mb-3">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full ${getSubProcessStatusDisplay('drying').status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'} flex items-center justify-center mr-3`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Drying</h4>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSubProcessStatusDisplay('drying').status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {getSubProcessStatusDisplay('drying').status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        {getSubProcessStatusDisplay('drying').status === 'Pending' ? (
                          <button
                            type="button"
                            onClick={() => handleSubProcessUpdate('drying', 'Completed')}
                            disabled={updating}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                          >
                            Complete
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSubProcessUpdate('drying', 'Pending')}
                            disabled={updating}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Finishing Process */}
                    <div className={`bg-white border ${getSubProcessStatusDisplay('finishing').status === 'Completed' ? 'border-green-300 shadow-sm' : 'border-gray-200'} rounded-lg p-4 transition-all hover:shadow-md`}>
                      <div className="flex items-center mb-3">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full ${getSubProcessStatusDisplay('finishing').status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'} flex items-center justify-center mr-3`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Finishing</h4>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSubProcessStatusDisplay('finishing').status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {getSubProcessStatusDisplay('finishing').status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        {getSubProcessStatusDisplay('finishing').status === 'Pending' ? (
                          <button
                            type="button"
                            onClick={() => handleSubProcessUpdate('finishing', 'Completed')}
                            disabled={updating}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                          >
                            Complete
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSubProcessUpdate('finishing', 'Pending')}
                            disabled={updating}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Files section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Files</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Order attachments and design files
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
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

          {/* Employee/Design files section */}
          {order.files && order.files.some(file => file.uploadedBy?.role === 'employee') && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Design Files</h4>
              <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                {order.files
                  .filter(file => file.uploadedBy?.role === 'employee')
                  .map((file, index) => (
                    <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                      <div className="w-0 flex-1 flex items-center">
                        <PaperClipIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                        <span className="ml-2 flex-1 w-0 truncate">
                          {file.originalname || file.filename}
                          <span className="ml-2 text-xs text-gray-500">
                            (Uploaded by {file.uploadedBy?.name || 'designer'})
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

          {/* Prepress files section */}
          {order.files && order.files.some(file => file.uploadedBy?.role === 'prepress') && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Prepress Files</h4>
              <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                {order.files
                  .filter(file => file.uploadedBy?.role === 'prepress')
                  .map((file, index) => (
                    <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                      <div className="w-0 flex-1 flex items-center">
                        <PaperClipIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                        <span className="ml-2 flex-1 w-0 truncate">
                          {file.originalname || file.filename}
                          <span className="ml-2 text-xs text-gray-500">
                            (Uploaded by {file.uploadedBy?.name || 'prepress'})
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

         
        </div>
      </div>
      
      {/* Comments Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Comments</h3>
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
  );
};

export default PrepressOrderDetail; 