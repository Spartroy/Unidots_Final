import React from 'react';

const StatusActionsPanel = ({ handleStatusUpdate, order, updating }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
    {order.status !== 'In Prepress' && (
      <button
        onClick={() => handleStatusUpdate('In Prepress')}
        disabled={updating}
        className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        <span className="hidden sm:inline">Mark as In Prepress</span>
        <span className="sm:hidden">In Prepress</span>
      </button>
    )}
    
    <button
      onClick={() => handleStatusUpdate('Ready for Delivery')}
      disabled={updating}
      className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
    >
      <span className="hidden sm:inline">Ready for Delivery</span>
      <span className="sm:hidden">Ready</span>
    </button>
    
    <button
      onClick={() => handleStatusUpdate('Completed')}
      disabled={updating}
      className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
    >
      <span className="hidden sm:inline">Complete Order</span>
      <span className="sm:hidden">Complete</span>
    </button>
    
    <button
      onClick={() => handleStatusUpdate('Cancelled')}
      disabled={updating}
      className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
    >
      <span className="hidden sm:inline">Cancel Order</span>
      <span className="sm:hidden">Cancel</span>
    </button>
  </div>
);

export default StatusActionsPanel;
