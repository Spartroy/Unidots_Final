import React, { useState, useEffect, useContext, useCallback } from 'react';
import { openFile } from '../../utils/files';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import AuthContext from '../../context/AuthContext';
import { toast } from 'react-toastify';
import OrderProgressBar from '../../components/common/OrderProgressBar';
import { PaperClipIcon } from '@heroicons/react/24/outline';
import { useDropzone } from 'react-dropzone';

import useAutoRefresh from '../../hooks/useAutoRefresh';

import SpecificationsSection from './orderDetail/SpecificationsSection';
import SubProcessesSection from './orderDetail/SubProcessesSection';
import ClientFilesSection from './orderDetail/ClientFilesSection';
import DesignLinksSection from './orderDetail/DesignLinksSection';
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

  const refreshOrder = useCallback(async () => {
    try {
      const response = await api.get(`/api/orders/${id}`);
      setOrder(response.data);
    } catch (_e) {}
  }, [id]);

  useAutoRefresh(refreshOrder, 60000, [refreshOrder]); // 60 seconds (1 minute)






  
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
      
      // Check if all prepress processes are completed and redirect to history
      const updatedOrder = response.data;
      if (updatedOrder?.stages?.prepress?.subProcesses) {
        const subProcesses = updatedOrder.stages.prepress.subProcesses;
        const allCompleted = (
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
        
        if (allCompleted) {
          toast.success('All prepress processes completed! Redirecting to order history...');
          setTimeout(() => {
            navigate('/prepress/history');
          }, 2000);
        }
      }
      
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
    <div className="space-y-6" dir="rtl">
      {/* Order header - Enhanced styling */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-6 sm:px-8 flex justify-between items-start">
          <div className="text-right">
            <h3 className="text-2xl leading-6 font-bold text-gray-900 mb-2">{order.title || 'تفاصيل الأوردر'}</h3>
            <p className="text-lg text-primary-600 font-semibold">
              أوردر رقم: #{order.orderNumber}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <div className="mb-3">
              <span className={`px-4 py-2 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <div className="text-sm text-gray-500 text-left">
              {formatDate(order.createdAt)}
              {order.createdAt && <span className="mr-2 text-gray-400">{formatTime(order.createdAt)}</span>}
            </div>
          </div>
        </div>
        
        {/* Details Section - Enhanced with better spacing and RTL */}
        <div className="border-t border-gray-100 px-6 py-6 sm:px-8">
          {/* Customer info in a cleaner card layout */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg overflow-hidden mb-8">
            <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
              <h4 className="text-lg font-semibold text-blue-900 flex items-center">
                <svg className="w-5 h-5 ml-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                معلومات العميل
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 p-6">
              <div className="text-right">
                <dt className="text-lg font-medium text-blue-600 uppercase tracking-wide mb-2">اسم العميل</dt>
                <dd className="text-lg font-semibold text-gray-900">{order.client?.name || order.customer?.name || 'غير محدد'}</dd>
              </div>
              
              <div className="text-right">
                <dt className="text-lg font-medium text-blue-600 uppercase tracking-wide mb-2">البريد الإلكتروني</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {order.client?.email || order.customer?.email ? (
                    <a 
                      href={`mailto:${order.client?.email || order.customer?.email}`} 
                      className="text-primary-600 hover:text-primary-800 transition-colors"
                    >
                      {order.client?.email || order.customer?.email}
                    </a>
                  ) : 'غير محدد'}
                </dd>
              </div>
              
              <div className="text-right">
                <dt className="text-lg font-medium text-blue-600 uppercase tracking-wide mb-2">تاريخ الطلب</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {formatDate(order.createdAt)}
                  {order.createdAt && <span className="mr-3 text-gray-500 text-base"> - {formatTime(order.createdAt)}</span>}
                </dd>
              </div>
            </div>
          </div>
          
          {/* Order Information - Enhanced styling */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg overflow-hidden mb-8">
            <div className="bg-green-100 px-6 py-4 border-b border-green-200">
              <h4 className="text-lg font-semibold text-green-900 flex items-center">
                <svg className="w-5 h-5 ml-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                معلومات الأوردر
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6 p-6">
              {order.specifications?.packageType && (
                <div className="text-right">
                  <dt className="text-lg font-medium text-green-600 uppercase tracking-wide mb-2">نوع العبوة</dt>
                  <dd className="text-lg font-semibold text-gray-900">{order.specifications.packageType}</dd>
                </div>
              )}
              <div className="text-right">
                <dt className="text-lg font-medium text-green-600 uppercase tracking-wide mb-2">نوع الطلب</dt>
                <dd className="text-lg font-semibold text-gray-900">{order.orderType || 'غير محدد'}</dd>
              </div>
              
              <div className="text-right">
                <dt className="text-lg font-medium text-green-600 uppercase tracking-wide mb-2">الخامة</dt>
                <dd className="text-lg font-semibold text-gray-900">{order.specifications?.material || 'غير محدد'}</dd>
              </div>
              
              <div className="text-right">
                <dt className="text-lg font-medium text-green-600 uppercase tracking-wide mb-2">السمك</dt>
                <dd className="text-lg font-semibold text-gray-900">{order.specifications?.materialThickness ? `${order.specifications.materialThickness} ميكرون` : 'غير محدد'}</dd>
              </div>
              
              <div className="text-right">
                <dt className="text-lg font-medium text-green-600 uppercase tracking-wide mb-2">وضع الطباعة</dt>
                <dd className="text-lg font-semibold text-gray-900">{order.specifications?.printingMode || 'غير محدد'}</dd>
              </div>
            </div>
          </div>
          
          {/* Technical Specifications - Enhanced styling */}
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg overflow-hidden mb-8">
            <div className="bg-purple-100 px-6 py-4 border-b border-purple-200">
              <h4 className="text-lg font-semibold text-purple-900 flex items-center">
                <svg className="w-5 h-5 ml-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                المواصفات التقنية
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 p-6">
              <div className="text-right">
                <dt className="text-lg font-medium text-purple-600 uppercase tracking-wide mb-2">الأبعاد</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {order.specifications?.dimensions ? 
                    `${order.specifications.dimensions.width} × ${order.specifications.dimensions.height} سم` : 
                    'غير محدد'}
                </dd>
              </div>
              
              <div className="text-right">
                <dt className="text-lg font-medium text-purple-600 uppercase tracking-wide mb-2">عدد التكرارات</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {order.specifications?.dimensions ? 
                    `العرض: ${order.specifications.dimensions.widthRepeatCount || 1} × الارتفاع: ${order.specifications.dimensions.heightRepeatCount || 1}` : 
                    'غير محدد'}
                </dd>
              </div>
              
              <div className="text-right">
                <dt className="text-lg font-medium text-purple-600 uppercase tracking-wide mb-2">عدد الألوان</dt>
                <dd className="text-lg font-semibold text-gray-900">{order.specifications?.colors || 'غير محدد'}</dd>
              </div>
              
              <div className="sm:col-span-2 text-right">
                <dt className="text-lg font-medium text-purple-600 uppercase tracking-wide mb-2">الألوان المستخدمة</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {order.specifications?.usedColors && order.specifications.usedColors.length > 0 
                    ? order.specifications.usedColors.join(', ') 
                    : 'غير محدد'}
                  {order.specifications?.customColors && order.specifications.customColors.length > 0 && 
                    `, ${order.specifications.customColors.join(', ')}`}
                </dd>
              </div>
            </div>
          </div>

          {/* Acid Solution Consumption - Enhanced styling */}
          {order.specifications?.dimensions && <SpecificationsSection order={order} />}
          
          {/* Description and Notes - Enhanced styling */}
          {(order.description || order.specifications?.additionalDetails) && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg overflow-hidden">
              <div className="bg-indigo-100 px-6 py-4 border-b border-indigo-200">
                <h4 className="text-lg font-semibold text-indigo-900 flex items-center">
                  <svg className="w-5 h-5 ml-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  الوصف والملاحظات
                </h4>
              </div>
              <div className="p-6">
                {order.description && (
                  <div className="mb-6">
                    <dt className="text-lg font-medium text-indigo-600 uppercase tracking-wide mb-2">الوصف</dt>
                    <dd className="text-lg font-semibold text-gray-900">{order.description}</dd>
                  </div>
                )}
                
                {order.specifications?.additionalDetails && (
                  <div>
                    <dt className="text-lg font-medium text-indigo-600 uppercase tracking-wide mb-2">ملاحظات إضافية</dt>
                    <dd className="text-lg font-semibold text-gray-900">{order.specifications.additionalDetails}</dd>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions section - Enhanced styling */}
        <div className="border-t border-gray-100 px-6 py-6 sm:px-8 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex space-x-reverse space-x-3 justify-end">
            <Link
              to="/prepress/orders"
              className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 hover:shadow-md"
            >
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              العودة إلى الأوردرات
        </Link>
          </div>
        </div>
      </div>
      
      {/* Order progress - Enhanced styling */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-6 sm:px-8">
          <h3 className="text-xl leading-6 font-bold text-gray-900 text-right">تقدم الأوردر</h3>
          <p className="mt-2 max-w-2xl text-sm text-gray-500 text-right">
            الحالة الحالية: <span className="font-semibold text-primary-600">{order.status}</span>
          </p>
        </div>
        <div className="border-t border-gray-100 px-6 py-6 sm:px-8">
          {/* Order Progress Bar */}
          <div className="mb-8">
            <OrderProgressBar order={order} className="mt-2" />
          </div>

          {/* Detailed Steps - Enhanced styling */}
          <div className="space-y-6 mt-8">
            {/* Order Submission Step */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg overflow-hidden">
              <div className="px-6 py-6 sm:px-8 flex items-center">
                <div className={`flex-shrink-0 h-10 w-10 rounded-full bg-green-500 flex items-center justify-center ml-4`}>
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="text-right flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">تقديم الطلب</h4>
                  <p className="text-sm text-gray-600">
                    تم الإكمال في {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Design Step */}
            <div className={`bg-gradient-to-r ${
              order.status === 'Designing' ? 'from-yellow-50 to-amber-50 border-yellow-300' : 
              order.status === 'Design Done' || order.status === 'In Prepress' || 
              order.status === 'Ready for Delivery' || order.status === 'Completed' ? 'from-green-50 to-emerald-50 border-green-300' : 'from-gray-50 to-gray-100 border-gray-200'
            } border rounded-lg overflow-hidden`}>
              <div className="px-6 py-6 sm:px-8 flex items-center">
                <div className={`flex-shrink-0 h-10 w-10 rounded-full ${
                  order.status === 'Design Done' || order.status === 'In Prepress' || 
                  order.status === 'Ready for Delivery' || order.status === 'Completed' ? 'bg-green-500' : 
                  order.status === 'Designing' ? 'bg-yellow-500' : 'bg-gray-400'
                } flex items-center justify-center ml-4`}>
                  {order.status === 'Design Done' || order.status === 'In Prepress' || 
                   order.status === 'Ready for Delivery' || order.status === 'Completed' ? (
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-sm text-white font-bold">2</span>
                  )}
                </div>
                <div className="text-right flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">التصميم</h4>
                  <p className="text-sm text-gray-600">
                    {order.status === 'Design Done' || order.status === 'In Prepress' || 
                     order.status === 'Ready for Delivery' || order.status === 'Completed' 
                     ? `تم الإكمال مع الطلب في ${formatDate(order.stages?.design?.completionDate || order.updatedAt)}` 
                     : order.status === 'Designing' 
                     ? 'قيد التنفيذ' 
                     : 'لم يبدأ بعد'}
                  </p>
                </div>
              </div>
            </div>

            {/* Prepress Step - Highlighted as active for prepress users */}
            <div className={`bg-gradient-to-r ${
              order.status === 'In Prepress' ? 'from-yellow-50 to-amber-50 border-yellow-300 shadow-lg' : 
              order.status === 'Ready for Delivery' || order.status === 'Completed' ? 'from-green-50 to-emerald-50 border-green-300' : 'from-gray-50 to-gray-100 border-gray-200'
            } border rounded-lg overflow-hidden`}>
              <div className="px-6 py-6 sm:px-8 flex items-center">
                <div className={`flex-shrink-0 h-10 w-10 rounded-full ${
                  order.status === 'Ready for Delivery' || order.status === 'Completed' ? 'bg-green-500' : 
                  order.status === 'In Prepress' ? 'bg-yellow-500' : 'bg-gray-400'
                } flex items-center justify-center ml-4`}>
                  {order.status === 'Ready for Delivery' || order.status === 'Completed' ? (
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-sm text-white font-bold">3</span>
                  )}
                </div>
                <div className="text-right flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">ما قبل الطباعة</h4>
                  <p className="text-sm text-gray-600">
                    {order.status === 'Ready for Delivery' || order.status === 'Completed' 
                     ? `تم الإكمال في ${formatDate(order.stages?.prepress?.completionDate || order.updatedAt)}` 
                     : order.status === 'In Prepress' 
                     ? 'قيد التنفيذ' 
                     : 'لم يبدأ بعد'}
                  </p>
                </div>
              </div>

              {/* Prepress Sub-processes - Enhanced styling */}
              {order.status === 'In Prepress' || order.status === 'Ready for Delivery' || order.status === 'Completed' && <SubProcessesSection getSubProcessStatusDisplay={getSubProcessStatusDisplay} handleSubProcessUpdate={handleSubProcessUpdate} updating={updating} user={user} />}
            </div>
          </div>
        </div>
      </div>
      
      {/* Files section - Enhanced styling */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-6 sm:px-8">
          <h3 className="text-xl leading-6 font-bold text-gray-900 flex items-center">
            <svg className="w-6 h-6 ml-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            الملفات
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            مرفقات الأوردر وملفات التصميم
          </p>
        </div>
        <div className="border-t border-gray-100 px-6 py-6 sm:px-8">
          {/* Client files section */}
          {order.files && order.files.some(file => file.uploadedBy?.role === 'client') && <ClientFilesSection order={order} />}

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
                          <span className="ml-2 text-lg text-gray-500">
                            (Uploaded by {file.uploadedBy?.name || 'designer'})
                          </span>
                        </span>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <a
                          href="#" onClick={(e) => openFile(e, file._id)}
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
                          <span className="ml-2 text-lg text-gray-500">
                            (Uploaded by {file.uploadedBy?.name || 'prepress'})
                          </span>
                        </span>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <a
                          href="#" onClick={(e) => openFile(e, file._id)}
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
                          <span className="ml-2 text-lg text-gray-500">
                            (Uploaded by {file.uploadedBy?.name || 'manager'} - {file.uploadedBy?.role})
                          </span>
                        </span>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <a
                          href="#" onClick={(e) => openFile(e, file._id)}
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

          {/* Ripping Files section */}
          {order.files && order.files.some(file => file.fileType === 'ripping') && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <svg className="h-4 w-4 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Ripping Files
              </h4>
              <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                {order.files
                  .filter(file => file.fileType === 'ripping')
                  .map((file, index) => (
                    <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                      <div className="w-0 flex-1 flex items-center">
                        <PaperClipIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                        <span className="ml-2 flex-1 w-0 truncate">
                          {file.originalname || file.filename}
                          <span className="ml-2 text-lg text-gray-500">
                            (Uploaded by {file.uploadedBy?.name || 'designer'} - Ripping)
                          </span>
                        </span>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <a
                          href="#" onClick={(e) => openFile(e, file._id)}
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

          {/* Ripping Links section */}
          {order.designLinks && order.designLinks.some(link => link.notes && link.notes.toLowerCase().includes('ripping')) && <DesignLinksSection order={order} />}

         
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