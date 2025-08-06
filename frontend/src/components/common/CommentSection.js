import React, { useState } from 'react';
import { formatDate } from '../../utils/claimUtils';
import api from '../../utils/api';
import { toast } from 'react-toastify';

/**
 * Reusable comment section for claims and other content
 * 
 * @param {Object} props
 * @param {Array} props.comments - Array of comment objects
 * @param {string} props.entityType - Type of entity (e.g., 'claim', 'order')
 * @param {string} props.entityId - ID of the entity
 * @param {Function} props.onCommentAdded - Callback to execute after comment is added
 */
const CommentSection = ({ comments = [], entityType = 'claim', entityId, onCommentAdded }) => {
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);



  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.warn('Please enter a comment before submitting');
      return;
    }

    if (!entityId) {
      toast.error('Unable to add comment: Entity ID is missing');
      return;
    }

    try {
      setSubmittingComment(true);
      console.log(`Submitting comment to: /api/${entityType}s/${entityId}/comments`);
      
      const response = await api.post(`/api/${entityType}s/${entityId}/comments`, { 
        content: comment.trim() 
      });
      
      console.log('Comment added successfully:', response.data);
      setComment('');
      toast.success('Comment added successfully');
      
      // Call the callback to refresh data
      if (onCommentAdded && typeof onCommentAdded === 'function') {
        onCommentAdded();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      
      if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;
        if (status === 401) {
          toast.error('You need to be logged in to add comments');
        } else if (status === 403) {
          toast.error('You do not have permission to add comments');
        } else if (status === 404) {
          toast.error('The item you are trying to comment on was not found');
        } else {
          toast.error(data?.message || 'Failed to add comment');
        }
      } else if (error.request) {
        // Network error
        toast.error('Network error: Unable to submit comment');
      } else {
        // Other error
        toast.error('An unexpected error occurred while adding comment');
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Comments</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Communication history
        </p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
        {comments && comments.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {comments.map((comment, index) => (
              <li key={index} className="py-4">
                <div className="flex space-x-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">{comment.author?.name || 'Unknown'}</h3>
                      <p className="text-sm text-gray-500">{formatDate(comment.createdAt)}</p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 italic">No comments yet</p>
        )}

        <div className="mt-6">
          <form onSubmit={handleCommentSubmit}>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
              Add a comment
            </label>
            <div className="mt-1">
              <textarea
                rows="3"
                name="comment"
                id="comment"
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Add your comment here..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              ></textarea>
            </div>
            <div className="mt-3">
              <button
                type="submit"
                disabled={submittingComment || !comment.trim()}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${(submittingComment || !comment.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {submittingComment ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Posting...
                  </>
                ) : 'Post Comment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommentSection; 