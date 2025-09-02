/**
 * Standardized order status management utility
 * This file provides consistent status handling across client, manager, and employee portals
 */

/**
 * Maps internal system status to user-friendly display status based on user role
 * @param {string} status - The internal system status
 * @param {string} role - The user role (client, manager, employee, prepress)
 * @returns {string} - User-friendly status display text
 */
export const getDisplayStatus = (status, role = 'client') => {
  // Special handling for client view - simplify statuses for client-facing UI
  if (role === 'client') {
    switch (status) {
      case 'Submitted':
        return 'SUBMITTED';
      case 'Designing':
        return 'DESIGNING';
      case 'Design Done':
        return 'DESIGN COMPLETED';
      case 'In Prepress':
        return 'IN PREPRESS';
      case 'Ready for Delivery':
        return 'OUT FOR DELIVERY';
      case 'Delivered':
      case 'Completed':
        return 'COMPLETED';
      case 'Cancelled':
        return 'CANCELLED';
      case 'On Hold':
        return 'ON HOLD';
      default:
        return status ? status.toUpperCase() : '';
    }
  }
  
  // For staff (manager, employee, prepress), show the actual system status
  return status ? status.toUpperCase() : '';
};

/**
 * Returns the appropriate CSS class for status badge coloring
 * @param {string} status - The system status
 * @returns {string} - CSS classes for the status badge
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'Completed':
    case 'Delivered':
      return 'bg-green-100 text-green-800';
    case 'In Review':
    case 'Designing':
    case 'In Production':
    case 'In Prepress':
      return 'bg-blue-100 text-blue-800';
    case 'Design Done':
      return 'bg-teal-100 text-teal-800';
    case 'Submitted':
    case 'Ready for Production':
      return 'bg-yellow-100 text-yellow-800';
    case 'Ready for Delivery':
      return 'bg-indigo-100 text-indigo-800';
    case 'Cancelled':
      return 'bg-red-100 text-red-800';
    case 'On Hold':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Calculates order completion progress percentage
 * @param {Object} order - The order object
 * @returns {number} - Progress percentage (0-100)
 */
export const calculateProgressPercentage = (order) => {
  if (!order || !order.status || !order.stages) return 0;
  // 5-step workflow: Submission, Design, Ripping, Prepress, Delivery
  const TOTAL_STEPS = 5;
  let completedSteps = 1; // Submission
  if (order.stages?.production?.status === 'In Progress' || order.status === 'Designing') {
    completedSteps = Math.max(completedSteps, 1);
  }
  if (order.stages?.production?.status === 'Completed' || ['In Prepress', 'Ready for Delivery', 'Completed'].includes(order.status)) {
    completedSteps = Math.max(completedSteps, 2);
  }
  if (order.stages?.production?.subProcesses?.ripping?.status === 'Completed' || order.status === 'In Prepress') {
    completedSteps = Math.max(completedSteps, 3);
  }
  if (order.stages?.prepress?.status === 'Completed' || ['Ready for Delivery', 'Completed'].includes(order.status)) {
    completedSteps = Math.max(completedSteps, 4);
  }
  if (order.stages?.delivery?.status === 'Completed' || order.status === 'Completed') {
    completedSteps = Math.max(completedSteps, 5);
  }
  return (completedSteps / TOTAL_STEPS) * 100;
};

/**
 * Get order workflow steps with completion status
 * @param {Object} order - The order object
 * @returns {Object} - Steps array and current step index
 */
export const getOrderSteps = (order) => {
  if (!order || !order.status) {
    return { steps: [], currentStep: 0 };
  }
  
  // Standardized steps for all portals (5-step)
  const steps = [
    { label: 'Submission', completed: true },
    { label: 'Design', completed: ['In Prepress', 'Ready for Delivery', 'Completed'].includes(order.status) || order.stages?.production?.status === 'Completed' },
    { label: 'Ripping', completed: order.stages?.production?.subProcesses?.ripping?.status === 'Completed' || order.status === 'In Prepress' },
    { label: 'Prepress', completed: ['Ready for Delivery', 'Completed'].includes(order.status) || order.stages?.prepress?.status === 'Completed' },
    { label: 'Delivery', completed: order.status === 'Completed' || order.stages?.delivery?.status === 'Completed' }
  ];

  // Determine current step - this indicates where we are in the workflow
  let currentStep = 0;
  
  if (order.status === 'Submitted') currentStep = 0;
  else if (order.status === 'Designing') currentStep = 1;
  else if (order.status === 'In Prepress') currentStep = 3;
  else if (order.status === 'Ready for Delivery') currentStep = 4;
  else if (['Completed', 'Delivered'].includes(order.status) || order.stages?.delivery?.status === 'Completed') currentStep = 5;

  return { steps, currentStep };
};

/**
 * Maps between system status values and user-friendly labels
 * @param {string} statusToMap - The status to convert
 * @param {boolean} toSystem - If true, converts from display to system status
 * @returns {string} - Mapped status value
 */
export const mapStatusValues = (statusToMap, toSystem = false) => {
  const statusMap = {
    // Display → System
    'designing': 'Designing',
    'design done': 'Design Done',
    'design completed': 'Design Done',
    'in prepress': 'In Prepress',
    'out for delivery': 'Ready for Delivery',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    
    // System → Display
    'Designing': 'Designing',
    'Design Done': 'Design Completed',
    'In Prepress': 'In Prepress',
    'Ready for Delivery': 'Out for Delivery',
    'Completed': 'Completed',
    'Cancelled': 'Cancelled',
  };
  
  if (!statusToMap) return '';
  
  const lookupKey = statusToMap.toLowerCase();
  return toSystem ? statusMap[lookupKey] || statusToMap : statusMap[statusToMap] || statusToMap;
};

/**
 * Determines if all prepress subprocesses are completed
 * @param {Object} order - The order object 
 * @returns {boolean} - True if all subprocesses are completed
 */
export const arePrepressSubprocessesCompleted = (order) => {
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