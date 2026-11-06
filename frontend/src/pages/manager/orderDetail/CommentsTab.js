import React from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const CommentsTab = ({ comment, formatDate, handleCommentSubmit, order, setComment, submittingComment }) => (
  <div className="space-y-6">
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h4 className="text-base font-medium text-gray-900">Order Comments</h4>
        <p className="mt-1 text-sm text-gray-500">Communication and notes about this order</p>
      </div>
      <div className="p-6">
        {order.comments && order.comments.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {order.comments.map((comment, index) => (
              <li key={index} className="py-4">
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {comment.author?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {comment.author?.name || 'Unknown'}
                      <span className="text-sm text-gray-500 ml-2">
                        {formatDate(comment.createdAt)}
                      </span>
                    </p>
                    <div className="text-sm text-gray-500">
                      <p>{comment.content}</p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No comments yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start the conversation by adding a comment below.
            </p>
          </div>
        )}
  
        {/* Add Comment Form */}
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Add a comment</h4>
          <form onSubmit={handleCommentSubmit}>
            <textarea
              rows="3"
              name="comment"
              id="comment"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Type your comment here..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            ></textarea>
            <div className="mt-3">
              <button
                type="submit"
                disabled={submittingComment || !comment.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingComment ? 'Submitting...' : 'Submit Comment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
);

export default CommentsTab;
