import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { formatDate, getStatusColor, normalizeStatus } from '../../utils/claimUtils';
import FileAttachments from '../../components/common/FileAttachments';
import CommentSection from '../../components/common/CommentSection';

const ClaimDetail = () => {
  const { id } = useParams();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [assigning, setAssigning] = useState(false);
  const navigate = useNavigate();

  // Fetch claim and employees data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [claimResponse, employeesResponse] = await Promise.all([
          api.get(`/api/claims/${id}`),
          api.get('/api/users/employees?role=employee')
        ]);
        
        setClaim(claimResponse.data);
        // Handle paginated response from getUsers
        setEmployees(Array.isArray(employeesResponse.data.users) ? employeesResponse.data.users : []);
      } catch (error) {
        console.error('Error fetching data:', error);
        
        // Try to fetch claim individually if the combined request fails
        try {
          const claimResponse = await api.get(`/api/claims/${id}`);
          setClaim(claimResponse.data);
          
          // Try to fetch employees separately
          try {
            const employeesResponse = await api.get('/api/users/employees?role=employee');
            setEmployees(Array.isArray(employeesResponse.data.users) ? employeesResponse.data.users : []);
          } catch (empError) {
            console.error('Error fetching employees:', empError);
            setEmployees([]);
            toast.warn('Could not load employee list for assignment');
          }
        } catch (claimError) {
          toast.error('Failed to fetch claim details');
          
          // Redirect back to claims list if claim not found
          if (claimError.response?.status === 404) {
            navigate('/manager/claims');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  // Handle employee assignment
  const handleAssignEmployee = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
        return;
      }
      
    try {
      setAssigning(true);
      await api.put(`/api/claims/${id}/assign`, { employeeId: selectedEmployee });
      
      // Refresh claim data
      const response = await api.get(`/api/claims/${id}`);
      setClaim(response.data);
      
      toast.success('Claim assigned successfully');
      setSelectedEmployee('');
    } catch (error) {
      toast.error('Failed to assign employee');
      console.error('Error assigning employee:', error);
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
            <p className="text-gray-500">Claim not found</p>
            <Link
              to="/manager/claims"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Back to Claims
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Claim Details</h1>
          <Link
            to="/manager/claims"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Back to Claims
          </Link>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">{claim.title}</h3>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(claim.status)}`}>
                {claim.status}
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {claim.order ? `Order #${claim.order.orderNumber}` : 'No order reference'}
            </p>
          </div>
          
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{claim.description}</dd>
              </div>
              
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Submitted by</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{claim.client?.name || 'Unknown'}</dd>
              </div>
              
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Submitted on</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(claim.createdAt)}</dd>
              </div>
              
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Last updated</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(claim.updatedAt)}</dd>
              </div>
              
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Assigned to</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {claim.assignedTo?.name || 'Not assigned'}
                </dd>
              </div>
              
              {claim.resolution && (
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Resolution</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <p><strong>Action:</strong> {claim.resolution.action}</p>
                    <p><strong>Details:</strong> {claim.resolution.details}</p>
                    <p><strong>Date:</strong> {formatDate(claim.resolution.date)}</p>
                    <p><strong>Resolved By:</strong> {claim.resolution.resolvedBy?.name || 'Unknown'}</p>
                  </dd>
                </div>
              )}
              
              {claim.files && claim.files.length > 0 && (
                <FileAttachments files={claim.files} showUploader={true} />
              )}
            </dl>
          </div>
        </div>

        {/* Assignment Section */}
        {(!claim.assignedTo || claim.status === 'Submitted') && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Assign Claim</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Assign this claim to an employee
              </p>
            </div>
            
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-1">
                Select Employee
              </label>
            
            <div className="flex space-x-3">
                <select
                  id="employee"
                  name="employee"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="">-- Select an employee --</option>
                  {employees && Array.isArray(employees) && employees.length > 0 ? employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name}
                    </option>
                  )) : (
                    <option value="" disabled>
                      {employees && Array.isArray(employees) ? 'No employees available' : 'Loading employees...'}
                    </option>
                  )}
                </select>
                
                <button
                  type="button"
                  onClick={handleAssignEmployee}
                  disabled={assigning || !selectedEmployee}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${(assigning || !selectedEmployee) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {assigning ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Assigning...
                    </>
                  ) : 'Assign Employee'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comments Section */}
        <CommentSection 
          comments={claim.comments} 
          entityType="claim" 
          entityId={id}
          onCommentAdded={() => {
            // Refresh claim data
            api.get(`/api/claims/${id}`).then(response => {
              setClaim(response.data);
            });
          }}
        />
      </div>
    </div>
  );
};

export default ClaimDetail;