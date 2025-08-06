import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';
import { ClockIcon, CheckCircleIcon, ExclamationCircleIcon, DocumentTextIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import { useDropzone } from 'react-dropzone';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch task details
        const taskResponse = await api.get(`/api/tasks/${id}`);
        setTask(taskResponse.data);
        
        // Fetch task comments
        const commentsResponse = await api.get(`/api/tasks/${id}/comments`);
        setComments(commentsResponse.data);
        
        // Fetch task files
        const filesResponse = await api.get(`/api/tasks/${id}/files`);
        setUploadedFiles(filesResponse.data);
      } catch (error) {
        toast.error('Failed to load task details');
        console.error('Task details fetch error:', error);
        navigate('/employee/tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [id, navigate]);
  
  // Handle file drops
  const onDrop = acceptedFiles => {
    // Add new files to the existing files array
    setFiles(prevFiles => [
      ...prevFiles,
      ...acceptedFiles.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file)
      }))
    ]);
  };
  
  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'application/vnd.adobe.illustrator': ['.ai'],
      'application/postscript': ['.eps'],
      'application/x-indesign': ['.indd'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxSize: 10485760, // 10MB
  });
  
  // Function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Function to format datetime for comments
  const formatDateTime = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to format status for display
  const formatStatus = (status) => {
    if (!status) return '';
    
    if (status.includes('_')) {
      return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    
    return status;
  };

  // Function to determine task status color
  const getStatusColor = (status) => {
    // Normalize status to lowercase for comparison
    const normalizedStatus = status.toLowerCase();
    
    if (normalizedStatus === 'completed') {
      return 'bg-green-100 text-green-800';
    } else if (normalizedStatus === 'in progress' || normalizedStatus === 'in_progress') {
      return 'bg-blue-100 text-blue-800';
    } else if (normalizedStatus === 'pending') {
      return 'bg-yellow-100 text-yellow-800';
    } else if (normalizedStatus === 'on hold' || normalizedStatus === 'on_hold') {
      return 'bg-gray-100 text-gray-800';
    } else if (normalizedStatus === 'cancelled') {
      return 'bg-red-100 text-red-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Function to update task status
  const updateTaskStatus = async (newStatus) => {
    try {
      setSubmitting(true);
      // Convert status format to what the API expects (lowercase with underscores)
      let apiStatus = newStatus.toLowerCase();
      if (apiStatus.includes(' ')) {
        apiStatus = apiStatus.replace(/ /g, '_');
      }
      
      await api.put(`/api/tasks/${id}`, { status: apiStatus });
      
      // Update the task in the local state (keep UI format)
      setTask({ ...task, status: newStatus });
      
      toast.success('Task status updated successfully');
    } catch (error) {
      toast.error('Failed to update task status');
      console.error('Task update error:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Function to mark task as complete
  const completeTask = async () => {
    try {
      setSubmitting(true);
      // The /complete endpoint already sets the status to 'completed' in the backend
      await api.put(`/api/tasks/${id}/complete`, { completionNotes: '' });
      
      // Update the task in the local state with the UI format
      setTask({ ...task, status: 'Completed', completedAt: new Date() });
      
      toast.success('Task marked as completed');
    } catch (error) {
      toast.error('Failed to complete task');
      console.error('Task completion error:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Function to add a comment
  const addComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    try {
      setSubmitting(true);
      const response = await api.post(`/api/tasks/${id}/comments`, { content: newComment });
      
      // Add the new comment to the comments array
      setComments([...comments, response.data]);
      
      // Clear the comment input
      setNewComment('');
      
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error('Failed to add comment');
      console.error('Comment add error:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Function to upload files
  const uploadFiles = async () => {
    if (files.length === 0) return;
    
    try {
      setUploading(true);
      
      // Create form data for file upload
      const uploadFormData = new FormData();
      uploadFormData.append('taskId', id);
      
      // Append all files
      files.forEach(file => {
        uploadFormData.append('files', file);
      });
      
      // Upload files
      const response = await api.post('/api/files/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Add the new files to the uploaded files array
      setUploadedFiles([...uploadedFiles, ...response.data]);
      
      // Clear the files array
      setFiles([]);
      
      toast.success('Files uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload files');
      console.error('File upload error:', error);
    } finally {
      setUploading(false);
    }
  };
  
  // Function to download a file
  const downloadFile = async (fileId, fileName) => {
    try {
      const response = await api.get(`/api/files/${fileId}/download`, {
        responseType: 'blob'
      });
      
      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download file');
      console.error('File download error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <p className="text-center text-gray-500">Task not found or you don't have permission to view it.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Task header */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">{task.title}</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Task ID: {task._id}
            </p>
          </div>
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.status)}`}>
            {formatStatus(task.status)}
          </span>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Due Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(task.dueDate)}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Priority</dt>
              <dd className="mt-1 text-sm text-gray-900">{task.priority || 'Normal'}</dd>
            </div>
            <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Description</dt>
            <dd className="mt-1 text-sm text-gray-900">{task.description}</dd>
            </div>
         
          </dl>
        </div>
        <div className="border-t border-gray-200 px-4 py-4 sm:px-6 bg-gray-50">
          <div className="flex space-x-3">
            {task.status !== 'Completed' && task.status !== 'completed' && (
              <button
                onClick={() => completeTask()}
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                Mark as Completed
              </button>
            )}
            
            <Link
              to="/employee/tasks"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500"
            >
              Back to Tasks
            </Link>
          </div>
        </div>
      </div>

      
          
         

      {/* Comments section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Comments</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Task discussion and updates
          </p>
        </div>
        <div className="border-t border-gray-200">
          {/* Comments list */}
          <ul className="divide-y divide-gray-200">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <li key={comment._id} className="px-4 py-4 sm:px-6">
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-secondary-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {comment.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {comment.user?.name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDateTime(comment.createdAt)}
                      </p>
                      <div className="mt-2 text-sm text-gray-700">
                        <p>{comment.content}</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-5 sm:px-6 text-center text-gray-500">
                No comments yet.
              </li>
            )}
          </ul>
          
          {/* Add comment form */}
          <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
            <form onSubmit={addComment} className="relative">
              <div className="border border-gray-300 rounded-lg shadow-sm overflow-hidden focus-within:border-secondary-500 focus-within:ring-1 focus-within:ring-secondary-500">
                <textarea
                  rows={3}
                  name="comment"
                  id="comment"
                  className="block w-full py-3 border-0 resize-none focus:ring-0 sm:text-sm"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  required
                />
                <div className="py-2 px-3 border-t border-gray-200">
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting || !newComment.trim()}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-secondary-600 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 disabled:opacity-50"
                    >
                      {submitting ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;