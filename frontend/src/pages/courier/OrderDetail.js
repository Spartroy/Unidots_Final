import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { PhoneIcon, MapPinIcon, BuildingOffice2Icon, TruckIcon, CloudArrowUpIcon, ArrowDownTrayIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import useAutoRefresh from '../../hooks/useAutoRefresh';

const CourierOrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [labelFile, setLabelFile] = useState(null);
  const [uploadingLabel, setUploadingLabel] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/orders/${id}`);
        setOrder(res.data);
      } catch (error) {
        toast.error('Failed to load order details');
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const refreshOrder = useCallback(async () => {
    try {
      const res = await api.get(`/api/orders/${id}`);
      setOrder(res.data);
    } catch (_e) {}
  }, [id]);

  useAutoRefresh(refreshOrder, 60000, [refreshOrder]); // 60 seconds (1 minute)

  const uploadLabel = async () => {
    if (!labelFile) {
      toast.error('Please choose a shipment label file first');
      return;
    }
    try {
      setUploadingLabel(true);
      const formData = new FormData();
      formData.append('files', labelFile);
      formData.append('relatedOrder', id);
      formData.append('fileType', 'courier');
      formData.append('notes', 'Shipment label');
      
      const response = await api.post('/api/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Try common response shapes
      let uploaded;
      if (response?.data?.files?.length) uploaded = response.data.files[0];
      else if (Array.isArray(response?.data) && response.data.length) uploaded = response.data[0];
      else if (response?.data?.file) uploaded = response.data.file;
      else if (response?.data?._id) uploaded = response.data;
      
      if (!uploaded?._id) {
        toast.error('Upload succeeded but response was unexpected. Please retry.');
        return;
      }
      
      setLabelFile(null);
      toast.success('Shipment label uploaded successfully');
      
      // Refresh order data
      const res = await api.get(`/api/orders/${id}`);
      setOrder(res.data);
    } catch (error) {
      toast.error('Failed to upload shipment label');
      console.error('Error uploading label:', error);
    } finally {
      setUploadingLabel(false);
    }
  };

  const completeDelivery = async () => {
    try {
      await api.put(`/api/orders/${id}/status`, { status: 'Completed' });
      toast.success('Order marked as delivered');
      
      // Refresh order data
      const res = await api.get(`/api/orders/${id}`);
      setOrder(res.data);
    } catch (error) {
      toast.error('Failed to complete delivery');
      console.error('Error completing delivery:', error);
    }
  };

  const isCompleted = order?.status === 'Completed';

  const getDeliveryMethodText = () => {
    const mode = order?.stages?.delivery?.courierInfo?.mode;
    if (mode === 'direct') return 'Direct Handover';
    if (mode === 'client-collection') return 'Client Self-Collection';
    if (mode === 'shipping-company') return 'Shipping Company';
    return 'Unknown';
  };

  const getDeliveryMethodColor = () => {
    const mode = order?.stages?.delivery?.courierInfo?.mode;
    if (mode === 'direct') return 'text-green-600 bg-green-50';
    if (mode === 'client-collection') return 'text-yellow-600 bg-yellow-50';
    if (mode === 'shipping-company') return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
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
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-center text-gray-500">Order not found</p>
      </div>
    );
  }

  const deliveryMode = order.stages?.delivery?.courierInfo?.mode;
  const isHandover = deliveryMode === 'direct' || deliveryMode === 'client-collection';
  const isShipping = deliveryMode === 'shipping-company';
  const destination = order.stages?.delivery?.courierInfo?.destination;

  return (
    <div className="space-y-6">
      {/* Order Information Card */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Order Information</h2>
              <div className="mt-1 text-sm text-gray-600">{order.orderNumber} — {order.title}</div>
              <div className="mt-2 flex gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDeliveryMethodColor()}`}>
                  {getDeliveryMethodText()}
                </span>
                {isCompleted && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Delivered
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
              <span>{order.client?.name}</span>
              <span>·</span>
              <a href={`tel:${order.client?.phone || ''}`} className="text-primary-600 hover:underline">
                {order.client?.phone || 'No phone'}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Handover Orders - Show Order Details + Address */}
      {isHandover && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Details</h3>
            
            {/* Address Information */}
            {destination && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <div className="flex items-start gap-3">
                    <BuildingOffice2Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-xs uppercase tracking-wider text-gray-500">
                        {deliveryMode === 'direct' ? 'Delivery Address' : 'Collection Address'}
                      </div>
                      <div className="mt-1 text-sm text-gray-800">
                        <div>{destination.street}</div>
                        <div>{[destination.city, destination.state, destination.postalCode].filter(Boolean).join(', ')}</div>
                        <div>{destination.country}</div>
                      </div>
                      <div className="mt-2">
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([destination.street, destination.city, destination.state, destination.postalCode, destination.country].filter(Boolean).join(', '))}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
                        >
                          <MapPinIcon className="h-5 w-5" />
                          Open in Google Maps
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2"></div>
              </div>
            )}

            {/* Delivery Instructions */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <TruckIcon className="h-5 w-5 text-gray-400" />
                <span>
                  {deliveryMode === 'direct' 
                    ? 'Deliver directly to the client at the specified address' 
                    : 'Client will collect the order from the specified address'
                  }
                </span>
              </div>
            </div>

            {/* Complete Delivery Button */}
            <div className="mt-6 flex justify-end">
              {isCompleted ? (
                <div className="text-sm text-green-600 font-medium">
                  ✓ Order completed on {new Date(order.stages?.delivery?.completionDate || order.updatedAt).toLocaleDateString()}
                </div>
              ) : (
                <button 
                  onClick={completeDelivery}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-emerald-600 text-white font-medium shadow hover:bg-emerald-700"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  Complete Delivery
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shipping Company Orders - Show Order Info + Capture Function */}
      {isShipping && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Company Details</h3>
            
            {/* Shipping Company Info */}
            <div className="mb-6">
              <div className="text-sm text-gray-600 mb-2">Shipping Company</div>
              <div className="text-lg font-medium text-gray-900">
                {order.stages?.delivery?.courierInfo?.shipmentCompany || 'Middle East'}
              </div>
            </div>

            {/* Shipment Label Upload */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipment Label
                </label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white cursor-pointer hover:bg-gray-50">
                    <CloudArrowUpIcon className="h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-700">Choose File</span>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf" 
                      onChange={(e) => setLabelFile(e.target.files?.[0] || null)} 
                      className="hidden" 
                    />
                  </label>
                  <button 
                    type="button" 
                    onClick={uploadLabel} 
                    disabled={uploadingLabel || !labelFile} 
                    className="px-4 py-2 rounded-md bg-primary-600 text-white text-sm disabled:opacity-50"
                  >
                    {uploadingLabel ? 'Uploading…' : 'Upload'}
                  </button>
                  {labelFile && (
                    <div className="text-sm text-gray-600 truncate max-w-[40ch]">
                      {labelFile.name}
                    </div>
                  )}
                </div>
              </div>

              {/* Existing Shipment Labels */}
              {order.files && order.files.some(file => file.fileType === 'courier') && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Uploaded Labels</div>
                  <div className="space-y-2">
                    {order.files
                      .filter(file => file.fileType === 'courier')
                      .map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <ArrowDownTrayIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700">
                              {file.originalname || file.filename}
                            </span>
                          </div>
                          <a 
                            className="text-primary-600 hover:underline text-sm"
                            href={`/api/files/${file._id}/download`} 
                            target="_blank" 
                            rel="noreferrer"
                          >
                            Download
                          </a>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Complete Delivery Button */}
            <div className="mt-6 flex justify-end">
              {isCompleted ? (
                <div className="text-sm text-green-600 font-medium">
                  ✓ Order completed on {new Date(order.stages?.delivery?.completionDate || order.updatedAt).toLocaleDateString()}
                </div>
              ) : (
                <button 
                  onClick={completeDelivery}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-emerald-600 text-white font-medium shadow hover:bg-emerald-700"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  Complete Delivery
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourierOrderDetail;


