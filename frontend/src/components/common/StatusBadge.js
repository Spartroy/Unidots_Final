import React from 'react';
import { getStatusColor } from '../../utils/claimUtils';

/**
 * Reusable status badge component
 * 
 * @param {Object} props
 * @param {string} props.status - Status text to display
 * @param {string} props.className - Additional class names (optional)
 */
const StatusBadge = ({ status, className = '' }) => {
  if (!status) {
    return null;
  }

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)} ${className}`}>
      {status}
    </span>
  );
};

export default StatusBadge; 