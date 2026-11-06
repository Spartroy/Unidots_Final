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
                        order.stages?.prepress?.subProcesses?.backExposure?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                      } mr-2`}></div>
                      <span className="text-xs text-gray-600">Back Exposure</span>
                    </div>
                    {order.stages?.prepress?.subProcesses?.backExposure?.status === 'Completed' && 
                      order.stages?.prepress?.subProcesses?.backExposure?.completedBy && (
                      <span className="text-xs text-gray-500">
                        Completed by {order.stages?.prepress?.subProcesses?.backExposure?.completedBy?.name || 'Unknown'} 
                        {order.stages?.prepress?.subProcesses?.backExposure?.completedAt && 
                          ` on ${formatDate(order.stages?.prepress?.subProcesses?.backExposure?.completedAt)} at ${formatTime(order.stages?.prepress?.subProcesses?.backExposure?.completedAt)}`}
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
                        order.stages?.prepress?.subProcesses?.mainExposure?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                      } mr-2`}></div>
                      <span className="text-xs text-gray-600">Main Exposure</span>
                    </div>
                    {order.stages?.prepress?.subProcesses?.mainExposure?.status === 'Completed' && 
                      order.stages?.prepress?.subProcesses?.mainExposure?.completedBy && (
                      <span className="text-xs text-gray-500">
                        Completed by {order.stages?.prepress?.subProcesses?.mainExposure?.completedBy?.name || 'Unknown'} 
                        {order.stages?.prepress?.subProcesses?.mainExposure?.completedAt && 
                          ` on ${formatDate(order.stages?.prepress?.subProcesses?.mainExposure?.completedAt)} at ${formatTime(order.stages?.prepress?.subProcesses?.mainExposure?.completedAt)}`}
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
                        order.stages?.prepress?.subProcesses?.postExposure?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                      } mr-2`}></div>
                      <span className="text-xs text-gray-600">Post Exposure</span>
                    </div>
                    {order.stages?.prepress?.subProcesses?.postExposure?.status === 'Completed' && 
                      order.stages?.prepress?.subProcesses?.postExposure?.completedBy && (
                      <span className="text-xs text-gray-500">
                        Completed by {order.stages?.prepress?.subProcesses?.postExposure?.completedBy?.name || 'Unknown'} 
                        {order.stages?.prepress?.subProcesses?.postExposure?.completedAt && 
                          ` on ${formatDate(order.stages?.prepress?.subProcesses?.postExposure?.completedAt)} at ${formatTime(order.stages?.prepress?.subProcesses?.postExposure?.completedAt)}`}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`h-4 w-4 rounded-full ${
                        order.stages?.prepress?.subProcesses?.uvcExposure?.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
                      } mr-2`}></div>
                      <span className="text-xs text-gray-600">UVC Exposure</span>
                    </div>
                    {order.stages?.prepress?.subProcesses?.uvcExposure?.status === 'Completed' && 
                      order.stages?.prepress?.subProcesses?.uvcExposure?.completedBy && (
                      <span className="text-xs text-gray-500">
                        Completed by {order.stages?.prepress?.subProcesses?.uvcExposure?.completedBy?.name || 'Unknown'} 
                        {order.stages?.prepress?.subProcesses?.uvcExposure?.completedAt && 
                          ` on ${formatDate(order.stages?.prepress?.subProcesses?.uvcExposure?.completedAt)} at ${formatTime(order.stages?.prepress?.subProcesses?.uvcExposure?.completedAt)}`}
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
);

export default ProgressTab;
