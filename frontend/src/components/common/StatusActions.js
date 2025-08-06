import React from 'react';
import { normalizeStatus } from '../../utils/claimUtils';

/**
 * Reusable component for claim status action buttons
 * 
 * @param {Object} props
 * @param {string} props.currentStatus - Current status of the claim
 * @param {Function} props.onStatusUpdate - Callback function when status is updated
 * @param {boolean} props.updating - Whether status update is in progress
 * @param {Array} props.availableActions - List of available status actions
 */
const StatusActions = ({ 
  currentStatus, 
  onStatusUpdate, 
  updating = false,
  availableActions = ['in progress', 'resolved', 'rejected']
}) => {
  // Map of status actions to their UI configuration
  const actionConfig = {
    'in progress': {
      label: 'Mark In Progress',
      color: 'blue',
      disabled: currentStatus?.toLowerCase() === 'in progress'
    },
    'resolved': {
      label: 'Mark Resolved',
      color: 'green',
      disabled: currentStatus?.toLowerCase() === 'resolved'
    },
    'rejected': {
      label: 'Reject Claim',
      color: 'red',
      disabled: currentStatus?.toLowerCase() === 'rejected'
    }
  };

  // Filter actions based on available actions
  const filteredActions = availableActions.filter(action => actionConfig[action]);

  return (
    <div className="flex space-x-3">
      {filteredActions.map(action => {
        const config = actionConfig[action];
        return (
          <button
            key={action}
            type="button"
            onClick={() => onStatusUpdate(action)}
            disabled={updating || config.disabled}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${config.color}-600 hover:bg-${config.color}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${config.color}-500 ${(updating || config.disabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {config.label}
          </button>
        );
      })}
    </div>
  );
};

export default StatusActions; 