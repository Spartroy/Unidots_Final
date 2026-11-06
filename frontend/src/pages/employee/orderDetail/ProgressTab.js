import React from 'react';
import OrderProgressBar from '../../../components/common/OrderProgressBar';

const ProgressTab = ({ formatDate, formatTime, order }) => (
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
        <div className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
          {/* Order Submission Step */}
          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            <div className="px-3 py-3 sm:px-6 sm:py-4 flex items-center">
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
            <div className="px-3 py-3 sm:px-6 sm:py-4 flex items-center">
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
  
            {/* Design Sub-processes */}
            {(order.status === 'Designing' || order.status === 'Design Done' || order.status === 'In Prepress' || order.status === 'Ready for Delivery' || order.status === 'Completed') && (
              <div className="px-3 py-3 sm:px-4 sm:py-3 bg-gray-50 border-t border-gray-200">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Design Sub-processes</h5>
                <div className="grid grid-cols-1 gap-2 sm:gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`h-4 w-4 rounded-full ${
                        order.stages?.production?.subProcesses?.ripping?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                      } mr-2`}></div>
                      <span className="text-xs text-gray-600">File Ripping</span>
                    </div>
                    {order.stages?.production?.subProcesses?.ripping?.status === 'Completed' &&
                      order.stages?.production?.subProcesses?.ripping?.completedBy && (
                      <span className="text-xs text-gray-500">
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
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
                      order.stages?.prepress?.subProcesses?.positioning?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                    } mr-2`}></div>
                    <span className="text-xs text-gray-600">Positioning</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`h-4 w-4 rounded-full ${
                      order.stages?.prepress?.subProcesses?.backExposure?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                    } mr-2`}></div>
                    <span className="text-xs text-gray-600">Back Exposure</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`h-4 w-4 rounded-full ${
                      order.stages?.prepress?.subProcesses?.laserImaging?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                    } mr-2`}></div>
                    <span className="text-xs text-gray-600">Laser Imaging</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`h-4 w-4 rounded-full ${
                      order.stages?.prepress?.subProcesses?.mainExposure?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                    } mr-2`}></div>
                    <span className="text-xs text-gray-600">Main Exposure</span>
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
                      order.stages?.prepress?.subProcesses?.postExposure?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                    } mr-2`}></div>
                    <span className="text-xs text-gray-600">Post Exposure</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`h-4 w-4 rounded-full ${
                      order.stages?.prepress?.subProcesses?.uvcExposure?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                    } mr-2`}></div>
                    <span className="text-xs text-gray-600">UVC Exposure</span>
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
                   ? `Started on ${formatDate(order.stages?.delivery?.startDate || order.updatedAt)}` 
                   : 'Not started'}
                </p>
                
                {/* Enhanced delivery information */}
                {order.status === 'Completed' && order.stages?.delivery?.completionDate && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Date:</span> {formatDate(order.stages.delivery.completionDate)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Time:</span> {formatTime(order.stages.delivery.completionDate)}
                    </p>
  
                    
                    {/* Try to get completedBy from delivery stage first */}
                    {order.stages?.delivery?.completedBy ? (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Completed by:</span> {order.stages.delivery.completedBy.name || 'Unknown'}
                      </p>
                    ) : (
                      /* Fallback: Try to get from order history */
                      (() => {
                        const completionEntry = order.history?.find(entry => 
                          entry.action === 'Status Updated' && 
                          (entry.details?.includes('Completed') || entry.details?.includes('completed'))
                        );
                        return completionEntry && completionEntry.user ? (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Completed by:</span> {completionEntry.user.name || completionEntry.user.email || 'Unknown'}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">Completed by:</span> Not available
                          </p>
                        );
                      })()
                    )}
                  </div>
                )}
                
                {/* Delivery in progress information */}
                {order.status === 'Ready for Delivery' && order.stages?.delivery?.startDate && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Started:</span> {formatDate(order.stages.delivery.startDate)} at {formatTime(order.stages.delivery.startDate)}
                    </p>
                    {order.stages?.delivery?.courierInfo?.createdAt && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Method chosen:</span> {formatDate(order.stages.delivery.courierInfo.createdAt)} at {formatTime(order.stages.delivery.courierInfo.createdAt)}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Show delivery method if available */}
                {order.stages?.delivery?.courierInfo?.mode && (
                  <p className="text-sm text-blue-600 mt-1">
                    <span className="font-medium">Method:</span> {
                      order.stages.delivery.courierInfo.mode === 'direct' ? 'Direct Handover' :
                      order.stages.delivery.courierInfo.mode === 'client-collection' ? 'Client Self-Collection' :
                      order.stages.delivery.courierInfo.mode === 'shipping-company' ? 'Shipping Company' : 
                      order.stages.delivery.courierInfo.mode
                    }
                  </p>
                )}
                
                {/* Show courier information if available */}
                {order.stages?.delivery?.courierInfo?.assignedCourier ? (
                  <p className="text-sm text-green-600 mt-1">
                    <span className="font-medium">Courier:</span> {order.stages.delivery.courierInfo.assignedCourier.name}
                    {order.stages.delivery.courierInfo.assignedCourier.phone && (
                      <span className="ml-2 text-gray-500">({order.stages.delivery.courierInfo.assignedCourier.phone})</span>
                    )}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="font-medium">Courier:</span> Not assigned
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ProgressTab;
