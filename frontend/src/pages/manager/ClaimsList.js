import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/claimUtils';
import StatusBadge from '../../components/common/StatusBadge';

const ClaimsList = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const response = await api.get('/api/claims');
        setClaims(response.data);
      } catch (error) {
        toast.error('Failed to fetch claims');
        console.error('Error fetching claims:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, []);

  // Filter claims based on status
  const filteredClaims = claims.filter(claim => {
    if (filter === 'unassigned') {
      return !claim.assignedTo;
    } else if (filter === 'in-progress') {
      return claim.status === 'In Progress';
    } else if (filter === 'resolved') {
      return claim.status === 'Resolved';
    } else if (filter === 'rejected') {
      return claim.status === 'Rejected';
    } else {
      return true; // all claims
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4 md:mb-0">Claims Management</h1>
          
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${filter === 'all' ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('unassigned')}
              className={`relative inline-flex items-center px-3 py-2 border-t border-b border-gray-300 bg-white text-sm font-medium ${filter === 'unassigned' ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              Unassigned
            </button>
            <button
              type="button"
              onClick={() => setFilter('in-progress')}
              className={`relative inline-flex items-center px-3 py-2 border-t border-b border-gray-300 bg-white text-sm font-medium ${filter === 'in-progress' ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              In Progress
            </button>
            <button
              type="button"
              onClick={() => setFilter('resolved')}
              className={`relative inline-flex items-center px-3 py-2 border-t border-b border-gray-300 bg-white text-sm font-medium ${filter === 'resolved' ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              Resolved
            </button>
            <button
              type="button"
              onClick={() => setFilter('rejected')}
              className={`relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${filter === 'rejected' ? 'text-primary-600 bg-primary-50' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              Rejected
            </button>
          </div>
        </div>

        {filteredClaims.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">No claims found</h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>There are no claims matching your current filter.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Title/Client
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Assigned To
                        </th>
                        <th
                          scope="col"
                          className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Submitted
                        </th>
                        <th
                          scope="col"
                          className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Last Updated
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredClaims.map((claim) => (
                        <tr key={claim._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{claim.title}</div>
                            <div className="text-sm text-gray-500">{claim.client?.name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">
                              {claim.order ? `Order #${claim.order.orderNumber}` : 'No order reference'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={claim.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {claim.assignedTo ? (
                                claim.assignedTo.name
                              ) : (
                                <span className="text-sm text-gray-500">Not assigned</span>
                              )}
                            </div>
                          </td>
                          <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(claim.createdAt)}
                          </td>
                          <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(claim.updatedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              to={`/manager/claims/${claim._id}`}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimsList; 