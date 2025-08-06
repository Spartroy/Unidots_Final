/**
 * Format date to a readable format
 * @param {string} dateString - The date string to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'Not specified';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return date.toLocaleDateString(undefined, options);
};

/**
 * Get status badge color based on status
 * @param {string} status - The status value
 * @returns {string} - CSS class names for styling the badge
 */
export const getStatusColor = (status) => {
  const normalizedStatus = status?.toLowerCase() || '';
  
  switch (normalizedStatus) {
    case 'submitted':
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'in progress':
    case 'under review':
    case 'in prepress':
      return 'bg-blue-100 text-blue-800';
    case 'resolved':
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'rejected':
    case 'closed':
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Normalize status to correct case format
 * @param {string} status - The input status
 * @returns {string} - The status with correct capitalization
 */
export const normalizeStatus = (status) => {
  const statusMap = {
    'in progress': 'In Progress',
    'resolved': 'Resolved',
    'rejected': 'Rejected',
    'submitted': 'Submitted',
    'under review': 'Under Review',
    'closed': 'Closed'
  };
  
  return statusMap[status?.toLowerCase()] || status;
};

/**
 * Open file download in new tab
 * @param {string} fileId - The ID of the file to download
 */
export const downloadFile = (fileId) => {
  if (!fileId) return;
  window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/files/${fileId}/download`, '_blank');
}; 