import React from 'react';

const DeliveryModal = ({ choosingDelivery, deliveryMethod, handleChooseDeliveryMethod, order, setDeliveryMethod, setShipmentCompany, setShowDeliveryModal, setTempAddress, tempAddress }) => (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div className="mt-3">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
          <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="mt-4 text-center">
          <h3 className="text-lg font-medium text-gray-900">Choose Delivery Method</h3>
          <div className="mt-4 text-sm text-gray-500">
            <p>Prepress work is completed. Please choose how this order will be delivered.</p>
          </div>
        </div>
        
        <div className="mt-6 space-y-4">
          {/* Direct Delivery Option */}
          <div className="flex items-center">
            <input
              id="direct-delivery"
              name="delivery-method"
              type="radio"
              value="direct"
              checked={deliveryMethod === 'direct'}
              onChange={(e) => setDeliveryMethod(e.target.value)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
            />
            <label htmlFor="direct-delivery" className="ml-3 block text-sm font-medium text-gray-700">
              Direct Handover
            </label>
          </div>
          
          {/* Temporary Address Input for Direct Handover */}
          {deliveryMethod === 'direct' && (
            <div className="ml-7">
              <label htmlFor="temp-address" className="block text-sm font-medium text-gray-700 mb-1">
                Temporary Delivery Address (Optional)
              </label>
              <input
                type="text"
                id="temp-address"
                value={tempAddress}
                onChange={(e) => setTempAddress(e.target.value)}
                placeholder="e.g., Office address, different delivery location"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave empty if delivering to client's registered address
              </p>
            </div>
          )}
          
          {/* Client Self-Collection Option */}
          <div className="flex items-center">
            <input
              id="client-collection"
              name="delivery-method"
              type="radio"
              value="client-collection"
              checked={deliveryMethod === 'client-collection'}
              onChange={(e) => setDeliveryMethod(e.target.value)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
            />
            <label htmlFor="client-collection" className="ml-3 block text-sm font-medium text-gray-700">
              Client Self-Collection
            </label>
          </div>
          
          {/* Shipping Company Option */}
          <div className="flex items-center">
            <input
              id="shipping-company"
              name="delivery-method"
              type="radio"
              value="shipping-company"
              checked={deliveryMethod === 'shipping-company'}
              onChange={(e) => setDeliveryMethod(e.target.value)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
            />
            <label htmlFor="shipping-company" className="ml-3 block text-sm font-medium text-gray-700">
              Shipping Company (Middle East)
            </label>
          </div>
          
          {/* Client Address Display for Direct Delivery */}
          {deliveryMethod === 'direct' && order.client?.address && (
            <div className="ml-7 p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-700 mb-1">Client's Registered Address:</p>
              <p className="text-sm text-gray-600">
                {order.client.address.street && `${order.client.address.street}, `}
                {order.client.address.city && `${order.client.address.city}, `}
                {order.client.address.state && `${order.client.address.state} `}
                {order.client.address.postalCode && `${order.client.address.postalCode}, `}
                {order.client.address.country}
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowDeliveryModal(false);
              setDeliveryMethod('direct');
              setShipmentCompany('');
              setTempAddress('');
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleChooseDeliveryMethod}
            disabled={choosingDelivery}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {choosingDelivery ? 'Processing...' : 'Confirm Delivery Method'}
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default DeliveryModal;
