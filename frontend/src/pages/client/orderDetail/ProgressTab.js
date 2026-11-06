import React from 'react';
import { getDisplayStatus } from '../../../utils/statusUtils';
import OrderProgressBar from '../../../components/common/OrderProgressBar';

const ProgressTab = ({ formatDate, order }) => (
  <div className="space-y-4 sm:space-y-6">
    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <h4 className="text-base font-medium text-gray-900">Order Progress</h4>
        <p className="mt-1 text-sm text-gray-500">
          Current status: <span className="font-medium">
            {getDisplayStatus(order.status, 'client')}
          </span>
        </p>
      </div>
      <div className="p-4 sm:p-6">
        {/* Progress Bar - Hidden on mobile, visible on PC */}
        <div className="hidden sm:block mb-6">
          <OrderProgressBar order={order} className="mt-2" />
        </div>
        
        {/* Mobile-optimized Progress Steps - Vertical Layout */}
        <div className="space-y-4">
          {/* Progress Steps Container */}
          <div className="relative">
            {/* Vertical Progress Line */}
            <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            {/* Step 1: Submission */}
            <div className="relative flex items-start mb-6">
              <div className="flex-shrink-0 w-12 sm:w-16 flex justify-center">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                  <h4 className="text-sm sm:text-base font-medium text-green-900">Submission</h4>
                  <p className="text-xs sm:text-sm text-green-700 mt-1">Order submitted successfully</p>
                  <p className="text-xs text-green-600 mt-1">{formatDate(order.createdAt)}</p>
                </div>
              </div>
            </div>
  
            {/* Step 2: Design */}
            <div className="relative flex items-start mb-6">
              <div className="flex-shrink-0 w-12 sm:w-16 flex justify-center">
                <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white shadow-sm ${
                  order.status === 'Design Done' || order.status === 'In Prepress' || 
                  order.status === 'Ready for Delivery' || order.status === 'Delivering' || order.status === 'Completed' 
                  ? 'bg-green-500' : order.status === 'Designing' ? 'bg-yellow-400' : 'bg-gray-300'
                }`}></div>
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <div className={`border rounded-lg p-3 sm:p-4 ${
                  order.status === 'Design Done' || order.status === 'In Prepress' || 
                  order.status === 'Ready for Delivery' || order.status === 'Delivering' || order.status === 'Completed' 
                  ? 'bg-green-50 border-green-200' : order.status === 'Designing' ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h4 className={`text-sm sm:text-base font-medium ${
                    order.status === 'Design Done' || order.status === 'In Prepress' || 
                    order.status === 'Ready for Delivery' || order.status === 'Delivering' || order.status === 'Completed' 
                    ? 'text-green-900' : order.status === 'Designing' ? 'text-yellow-900' : 'text-gray-900'
                  }`}>Design</h4>
                  <p className={`text-xs sm:text-sm mt-1 ${
                    order.status === 'Design Done' || order.status === 'In Prepress' || 
                    order.status === 'Ready for Delivery' || order.status === 'Delivering' || order.status === 'Completed' 
                    ? 'text-green-700' : order.status === 'Designing' ? 'text-yellow-700' : 'text-gray-700'
                  }`}>
                    {order.status === 'Design Done' || order.status === 'In Prepress' || 
                     order.status === 'Ready for Delivery' || order.status === 'Delivering' || order.status === 'Completed' 
                     ? 'Design completed' : order.status === 'Designing' ? 'Design in progress' : 'Not started'}
                  </p>
                  {order.status === 'Design Done' || order.status === 'In Prepress' || 
                   order.status === 'Ready for Delivery' || order.status === 'Delivering' || order.status === 'Completed' && (
                    <p className="text-xs text-green-600 mt-1">{formatDate(order.stages?.design?.completionDate || order.updatedAt)}</p>
                  )}
                </div>
              </div>
            </div>
  
            {/* Step 3: Prepress */}
            <div className="relative flex items-start mb-6">
              <div className="flex-shrink-0 w-12 sm:w-16 flex justify-center">
                <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white shadow-sm ${
                  order.status === 'Ready for Delivery' || order.status === 'Delivering' || order.status === 'Completed' 
                  ? 'bg-green-500' : order.status === 'In Prepress' ? 'bg-yellow-400' : 'bg-gray-300'
                }`}></div>
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <div className={`border rounded-lg p-3 sm:p-4 ${
                  order.status === 'Ready for Delivery' || order.status === 'Delivering' || order.status === 'Completed' 
                  ? 'bg-green-50 border-green-200' : order.status === 'In Prepress' ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h4 className={`text-sm sm:text-base font-medium ${
                    order.status === 'Ready for Delivery' || order.status === 'Delivering' || order.status === 'Completed' 
                    ? 'text-green-900' : order.status === 'In Prepress' ? 'text-yellow-900' : 'text-gray-900'
                  }`}>Prepress</h4>
                  <p className={`text-xs sm:text-sm mt-1 ${
                    order.status === 'Ready for Delivery' || order.status === 'Delivering' || order.status === 'Completed' 
                    ? 'text-green-700' : order.status === 'In Prepress' ? 'text-yellow-700' : 'text-gray-700'
                  }`}>
                    {order.status === 'Ready for Delivery' || order.status === 'Delivering' || order.status === 'Completed' 
                     ? 'Prepress completed' : order.status === 'In Prepress' ? 'Prepress in progress' : 'Not started'}
                  </p>
                  {order.status === 'Ready for Delivery' || order.status === 'Delivering' || order.status === 'Completed' && (
                    <p className="text-xs text-green-600 mt-1">{formatDate(order.stages?.prepress?.completionDate || order.updatedAt)}</p>
                  )}
                  
                  {/* Prepress Sub-processes - Compact mobile view */}
                  {(order.status === 'In Prepress' || order.status === 'Ready for Delivery' || order.status === 'Delivering' || order.status === 'Completed') && order.stages?.prepress?.subProcesses && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'positioning', label: 'Positioning' },
                          { key: 'backExposure', label: 'Back Exposure' },
                          { key: 'laserImaging', label: 'Laser Imaging' },
                          { key: 'mainExposure', label: 'Main Exposure' },
                          { key: 'washout', label: 'Washout' },
                          { key: 'drying', label: 'Drying' },
                          { key: 'postExposure', label: 'Post Exposure' },
                          { key: 'uvcExposure', label: 'UVC Exposure' },
                          { key: 'finishing', label: 'Finishing' }
                        ].map((process) => (
                          <div key={process.key} className="flex items-center">
                            <div className={`h-2 w-2 rounded-full mr-2 ${
                              order.stages?.prepress?.subProcesses?.[process.key]?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                            }`}></div>
                            <span className="text-xs text-gray-600">{process.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
  
            {/* Step 4: Delivery */}
            <div className="relative flex items-start">
              <div className="flex-shrink-0 w-12 sm:w-16 flex justify-center">
                <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white shadow-sm ${
                  order.status === 'Completed' ? 'bg-green-500' : 
                  order.status === 'Ready for Delivery' || order.status === 'Delivering' ? 'bg-yellow-400' : 'bg-gray-300'
                }`}></div>
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <div className={`border rounded-lg p-3 sm:p-4 ${
                  order.status === 'Completed' ? 'bg-green-50 border-green-200' : 
                  order.status === 'Ready for Delivery' || order.status === 'Delivering' ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h4 className={`text-sm sm:text-base font-medium ${
                    order.status === 'Completed' ? 'text-green-900' : 
                    order.status === 'Ready for Delivery' || order.status === 'Delivering' ? 'text-yellow-900' : 'text-gray-900'
                  }`}>Delivery</h4>
                  <p className={`text-xs sm:text-sm mt-1 ${
                    order.status === 'Completed' ? 'text-green-700' : 
                    order.status === 'Ready for Delivery' || order.status === 'Delivering' ? 'text-yellow-700' : 'text-gray-700'
                  }`}>
                    {order.status === 'Completed' ? 'Delivery completed' : 
                     order.status === 'Ready for Delivery' || order.status === 'Delivering' ? 'Delivery in progress' : 'Not started'}
                  </p>
                  {order.status === 'Completed' && (
                    <p className="text-xs text-green-600 mt-1">{formatDate(order.stages?.delivery?.completionDate || order.updatedAt)}</p>
                  )}
                </div>
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
);

export default ProgressTab;
