import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';
import { useDropzone } from 'react-dropzone';
import { formatDate, getStatusColor, normalizeStatus } from '../../utils/claimUtils';
import FileAttachments from '../../components/common/FileAttachments';
import CommentSection from '../../components/common/CommentSection';
import StatusActions from '../../components/common/StatusActions';

const ClaimDetail = () => {
  const { id } = useParams();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [resolution, setResolution] = useState('');
  const [files, setFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

    const fetchClaim = async () => {
      try {
        const response = await api.get(`/api/claims/${id}`);
        setClaim(response.data);
        if (response.data.resolution) {
          setResolution(response.data.resolution);
        }
      } catch (error) {
        toast.error('Failed to fetch claim details');
        console.error('Error fetching claim:', error);
        // Redirect back to claims list if claim not found
        if (error.response?.status === 404) {
          navigate('/employee/claims');
        }
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchClaim();
  }, [id, navigate]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdating(true);
      
      // If resolving or rejecting, require resolution text
      if ((newStatus === 'resolved' || newStatus === 'rejected') && !resolution.trim()) {
        toast.error('Please provide a resolution before marking as resolved or rejected');
        setUpdating(false);
        return;
      }
      
      const updateData = { status: normalizeStatus(newStatus) };
      if (resolution.trim()) {
        updateData.resolution = resolution;
      }
      
      await api.put(`/api/claims/${id}/status`, updateData);
      
      // Refresh claim data
      await fetchClaim();
      toast.success(`Claim status updated to ${normalizeStatus(newStatus)}`);
    } catch (error) {
      toast.error('Failed to update claim status');
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Dropzone setup for file uploads
  const onDrop = useCallback(acceptedFiles => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'application/pdf': []
    },
    maxSize: 10 * 1024 * 1024 // 10MB
  });
  
  // Handle file upload
  const handleFileUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    try {
      setIsUploading(true);
      
      // Initialize upload status for all files
      const initialStatus = {};
      files.forEach((file, index) => {
        initialStatus[index] = { status: 'pending', progress: 0 };
      });
      setUploadStatus(initialStatus);
      
      const uploadedFileIds = [];
      
      // Upload each file individually
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Update status to uploading
        setUploadStatus(prev => ({
          ...prev,
          [i]: { status: 'uploading', progress: 0 }
        }));
        
        try {
          // Create a FormData object for the file
          const fileFormData = new FormData();
          fileFormData.append('file', file);
          fileFormData.append('fileType', 'claim');
          fileFormData.append('relatedClaim', id); // Link the file directly to this claim
          
          // Upload the file
          const fileResponse = await api.post('/api/files', fileFormData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadStatus(prev => ({
                ...prev,
                [i]: { status: 'uploading', progress: percentCompleted }
              }));
            }
          });
          
          // Mark upload as completed
          setUploadStatus(prev => ({
            ...prev,
            [i]: { status: 'success', progress: 100 }
          }));
          
          // Add uploaded file ID to our list
          uploadedFileIds.push(fileResponse.data._id);
        } catch (fileError) {
          console.error(`Error uploading file ${file.name}:`, fileError);
          setUploadStatus(prev => ({
            ...prev,
            [i]: { status: 'error', message: 'Upload failed' }
          }));
        }
      }
      
      // Attach files to the claim
      if (uploadedFileIds.length > 0) {
        await api.put(`/api/claims/${id}/attach-files`, { fileIds: uploadedFileIds });
        
        // Refresh claim data
        await fetchClaim();
        
        toast.success(`${uploadedFileIds.length} file(s) uploaded successfully`);
        setFiles([]);
      }
    } catch (error) {
      toast.error('Failed to upload files');
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle removing a file from the upload list
  const handleRemoveFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
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
              to="/employee/claims"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Back to Claims
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isAssignedToMe = claim.assignedTo && claim.assignedTo._id === user._id;

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Claim Details</h1>
          <Link
            to="/employee/claims"
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
              {claim.assignedTo && (
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Assigned to</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {claim.assignedTo.name}
                    {isAssignedToMe && <span className="ml-2 text-xs text-primary-600">(You)</span>}
                  </dd>
                </div>
              )}
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
              {/* Use the FileAttachments component */}
              {claim.files && claim.files.length > 0 && (
                <FileAttachments files={claim.files} showUploader={true} />
              )}
            </dl>
          </div>
        </div>

        {/* File Upload Section (for assigned employee) */}
        {isAssignedToMe && claim.status !== 'Resolved' && claim.status !== 'Rejected' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Attach Files</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Upload relevant files to this claim
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div 
                {...getRootProps()} 
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:bg-gray-50"
              >
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <input {...getInputProps()} />
                    <p className="relative cursor-pointer font-medium text-primary-600 hover:text-primary-500">
                      {isDragActive 
                        ? 'Drop the files here' 
                        : 'Drop files here or click to select files'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                </div>
              </div>

              {files.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Files to upload:</h4>
                    <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                    {files.map((file, index) => (
                        <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                          <div className="w-0 flex-1 flex items-center">
                          <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                            </svg>
                          <span className="ml-2 flex-1 w-0 truncate">{file.name}</span>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex items-center">
                          {uploadStatus[index] && (
                            <div className="mr-2">
                              {uploadStatus[index].status === 'pending' && (
                                <span className="text-gray-500">Pending</span>
                              )}
                              {uploadStatus[index].status === 'uploading' && (
                                <div className="relative w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="absolute top-0 left-0 h-full bg-primary-500"
                                    style={{ width: `${uploadStatus[index].progress}%` }}
                                  ></div>
                                  <span className="ml-2 text-xs">{uploadStatus[index].progress}%</span>
                                </div>
                              )}
                              {uploadStatus[index].status === 'success' && (
                                <span className="text-green-500">Uploaded</span>
                              )}
                              {uploadStatus[index].status === 'error' && (
                                <span className="text-red-500">{uploadStatus[index].message || 'Error'}</span>
                              )}
                          </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="font-medium text-red-600 hover:text-red-500"
                          >
                            Remove
                          </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleFileUpload}
                      disabled={isUploading || files.length === 0}
                      className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${(isUploading || files.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isUploading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading...
                        </>
                      ) : 'Upload Files'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Claim Management Section (for assigned employee) */}
        {isAssignedToMe && claim.status !== 'Resolved' && claim.status !== 'Rejected' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Claim Management</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Update claim status and provide resolution
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="mb-4">
                <label htmlFor="resolution" className="block text-sm font-medium text-gray-700 mb-1">
                  Resolution
                </label>
                <textarea
                  id="resolution"
                  name="resolution"
                  rows="3"
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Provide details about how this claim was resolved..."
                ></textarea>
              </div>
              <StatusActions 
                currentStatus={claim.status}
                onStatusUpdate={handleStatusUpdate}
                updating={updating}
              />
            </div>
          </div>
        )}

        {/* Comments Section */}
        <CommentSection 
          comments={claim.comments} 
          entityType="claim" 
          entityId={id}
          onCommentAdded={fetchClaim}
        />
      </div>
    </div>
  );
};

export default ClaimDetail;