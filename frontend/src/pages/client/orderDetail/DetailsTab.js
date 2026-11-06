import React from 'react';
import OrderReceipt from '../../../components/common/OrderReceipt';

const DetailsTab = ({ formatDate, formatTime, order, user }) => (
  <div className="space-y-4 sm:space-y-6">
    {/* Order details in a cleaner card layout */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h4 className="text-base font-medium text-gray-900">Order Information</h4>
        <OrderReceipt order={order} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        <div className="bg-white/60 sm:bg-transparent rounded-lg p-3 sm:p-0">
          <div className="text-sm font-medium text-gray-500">Order Date</div>
          <div className="mt-1 text-sm text-gray-900">
            {formatDate(order.createdAt)}
            {order.createdAt && <span className="ml-2 text-gray-500">{formatTime(order.createdAt)}</span>}
          </div>
        </div>
        
        <div className="bg-white/60 sm:bg-transparent rounded-lg p-3 sm:p-0">
          <div className="text-sm font-medium text-gray-500">Order Type</div>
          <div className="mt-1 text-sm text-gray-900">{order.orderType || 'N/A'}</div>
        </div>
        
        <div className="bg-white/60 sm:bg-transparent rounded-lg p-3 sm:p-0">
          <div className="text-sm font-medium text-gray-500">Estimated Price</div>
          <div className="mt-1 text-sm text-gray-900 font-bold text-primary-600">
            {order.cost?.estimatedCost 
              ? `$${order.cost.estimatedCost.toFixed(2)}` 
              : 'Not calculated'}
          </div>
        </div>
        
        <div className="bg-white/60 sm:bg-transparent rounded-lg p-3 sm:p-0">
          <div className="text-sm font-medium text-gray-500">Material</div>
          <div className="mt-1 text-sm text-gray-900">{order.specifications?.material || 'N/A'}</div>
        </div>
        
        <div className="bg-white/60 sm:bg-transparent rounded-lg p-3 sm:p-0">
          <div className="text-sm font-medium text-gray-500">Material Thickness</div>
          <div className="mt-1 text-sm text-gray-900">{order.specifications?.materialThickness ? `${order.specifications.materialThickness} microns` : 'N/A'}</div>
        </div>
        
        <div className="bg-white/60 sm:bg-transparent rounded-lg p-3 sm:p-0">
          <div className="text-sm font-medium text-gray-500">Printing Mode</div>
          <div className="mt-1 text-sm text-gray-900">{order.specifications?.printingMode || 'N/A'}</div>
        </div>
  
        {order.assignedTo && (
          <div className="bg-white/60 sm:bg-transparent rounded-lg p-3 sm:p-0">
            <div className="text-sm font-medium text-gray-500">Assigned Designer</div>
            <div className="mt-1 text-sm text-gray-900">{order.assignedTo?.name}</div>
          </div>
        )}
  
        <div className="bg-white/60 sm:bg-transparent rounded-lg p-3 sm:p-0">
          <div className="text-sm font-medium text-gray-500">Email</div>
          <div className="mt-1 text-sm text-gray-900">
            {user?.email ? (
              <a href={`mailto:${user.email}`} className="text-primary-600 hover:text-primary-800">
                {user.email}
              </a>
            ) : 'N/A'}
          </div>
        </div>
  
        <div className="bg-white/60 sm:bg-transparent rounded-lg p-3 sm:p-0">
          <div className="text-sm font-medium text-gray-500">Phone</div>
          <div className="mt-1 text-sm text-gray-900">
            {user?.phone ? (
              <a href={`tel:${user.phone}`} className="text-primary-600 hover:text-primary-800">
                {user.phone}
              </a>
            ) : 'N/A'}
          </div>
        </div>
      </div>
    </div>
    
    {/* Technical Specifications */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <h4 className="text-base font-medium text-gray-900">Technical Specifications</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
        {order.specifications?.packageType && (
          <div>
            <div className="text-sm font-medium text-gray-500">Package Type</div>
            <div className="mt-1 text-sm text-gray-900">{order.specifications.packageType}</div>
          </div>
        )}
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
      <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-white px-4 py-3 border-b border-gray-200">
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
);

export default DetailsTab;
