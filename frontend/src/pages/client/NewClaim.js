import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';

const NewClaim = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: '',
    claimType: '',
    severity: 'Medium',
  });
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({});
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [preSelectedOrder, setPreSelectedOrder] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Fetch client's orders and check for orderId in query params
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoadingOrders(true);
        const response = await api.get('/api/orders');
        setOrders(response.data.orders || []);

        // Check if orderId is provided in query params
        const queryParams = new URLSearchParams(location.search);
        const orderId = queryParams.get('orderId');

        if (orderId) {
          // Set the order in formData
          setFormData(prevData => ({
            ...prevData,
            order: orderId
          }));
          setPreSelectedOrder(true);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load your orders');
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [location.search]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.title.trim()) {
      toast.error('Please enter a claim title');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    if (!formData.order) {
      toast.error('Please select an order');
      return;
    }
    if (!formData.claimType) {
      toast.error('Please select a claim type');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // First, upload files if any
      let uploadedFiles = [];
      if (files.length > 0) {
        // Initialize upload status for all files
        let initialStatus = {};
        files.forEach((file, index) => {
          initialStatus[index] = { status: 'pending', progress: 0 };
        });
        setUploadStatus(initialStatus);
        
        // Handle each file individually since the backend expects single file uploads
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          // Check file size (10MB limit)
          if (file.size > 10 * 1024 * 1024) {
            toast.error(`File ${file.name} is too large. Maximum size is 10MB`);
            setUploadStatus(prev => ({
              ...prev,
              [i]: { status: 'error', message: 'File too large' }
            }));
            continue;
          }
          
          // Check file type
          const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
          if (!validTypes.includes(file.type)) {
            toast.error(`File ${file.name} is not a valid type. Please upload PNG, JPG, or PDF files only`);
            setUploadStatus(prev => ({
              ...prev,
              [i]: { status: 'error', message: 'Invalid file type' }
            }));
            continue;
          }
          
          // Update status to uploading
          setUploadStatus(prev => ({
            ...prev,
            [i]: { status: 'uploading', progress: 0 }
          }));
          
          // Create a new FormData for each file
          const singleFileForm = new FormData();
          // The backend expects 'file', not 'files'
          singleFileForm.append('file', file);
          // Add the order ID as related order
          singleFileForm.append('relatedOrder', formData.order);
          
          try {
            const fileResponse = await api.post('/api/files', singleFileForm, {
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
            
            console.log('File upload response:', fileResponse.data);
            
            if (fileResponse.data) {
              uploadedFiles.push(fileResponse.data);
              setUploadStatus(prev => ({
                ...prev,
                [i]: { status: 'success', progress: 100 }
              }));
            }
          } catch (fileError) {
            console.error(`Error uploading file ${file.name}:`, fileError);
            toast.error(`Failed to upload ${file.name}. Please try again.`);
            setUploadStatus(prev => ({
              ...prev,
              [i]: { status: 'error', message: fileError.message }
            }));
          }
        }
      }
      
      // Then create the claim with the file IDs
      const claimData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        order: formData.order,
        claimType: formData.claimType,
        severity: formData.severity,
        files: uploadedFiles.map(file => file._id)
      };
      
      console.log('Submitting claim data:', claimData);
      
      const response = await api.post('/api/claims', claimData);
      
      console.log('Claim submission response:', response.data);
      
      // Check if the response contains an actual claim object with an ID
      if (response.data && response.data._id) {
        toast.success('Claim submitted successfully');
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          order: '',
          claimType: '',
          severity: 'Medium',
        });
        setFiles([]);
        
        // Navigate to the claim detail page
        navigate(`/client/claims/${response.data._id}`);
      } else if (response.data && response.data.message) {
        // This is an error response
        toast.error(response.data.message || 'Failed to submit claim');
      } else {
        // Unexpected response format
        console.error('Unexpected response format:', response.data);
        toast.error('An unexpected error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorMessage = error.response.data.message || 'Failed to submit claim';
        toast.error(errorMessage);
        console.error('Server error response:', error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        toast.error('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        toast.error('Failed to submit claim. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Submit New Claim</h1>
          <Link
            to="/client/claims"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Back to Claims
          </Link>
        </div>

        {preSelectedOrder && (
          <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  An order has been pre-selected based on your previous selection.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Claim Title *
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="order" className="block text-sm font-medium text-gray-700">
                  Order *
                </label>
                {loadingOrders ? (
                  <div className="mt-1 text-sm text-gray-500">Loading your orders...</div>
                ) : orders.length === 0 ? (
                  <div className="mt-1 text-sm text-gray-500">
                    You don't have any orders to create a claim for.
                    <Link to="/client/orders/new" className="ml-2 text-primary-600 hover:text-primary-500">
                      Create an order first
                    </Link>
                  </div>
                ) : (
                  <div>
                    <select
                      id="order"
                      name="order"
                      required
                      className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md ${preSelectedOrder ? 'border-blue-500 bg-blue-50' : ''}`}
                      value={formData.order}
                      onChange={handleChange}
                    >
                      <option value="">Select an order</option>
                      {orders.map((order) => (
                        <option key={order._id} value={order._id}>
                          {order.orderNumber} - {order.title}
                        </option>
                      ))}
                    </select>
                    {preSelectedOrder && (
                      <p className="mt-1 text-xs text-blue-600">
                      That's the same order you've selected
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="claimType" className="block text-sm font-medium text-gray-700">
                  Claim Type *
                </label>
                <select
                  id="claimType"
                  name="claimType"
                  required
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={formData.claimType}
                  onChange={handleChange}
                >
                  <option value="">Select a type</option>
                  <option value="Quality Issue">Quality Issue</option>
                  <option value="Delivery Problem">Delivery Problem</option>
                  <option value="Incorrect Specifications">Incorrect Specifications</option>
                  <option value="Damage">Damage</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="severity" className="block text-sm font-medium text-gray-700">
                  Severity
                </label>
                <select
                  id="severity"
                  name="severity"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={formData.severity}
                  onChange={handleChange}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="4"
                  required
                  className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="Please provide a detailed description of your claim..."
                  value={formData.description}
                  onChange={handleChange}
                ></textarea>
              </div>

              
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={isSubmitting || loadingOrders || orders.length === 0}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${(isSubmitting || loadingOrders || orders.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Claim'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewClaim;