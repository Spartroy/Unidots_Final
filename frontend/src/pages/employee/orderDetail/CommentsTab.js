import React from 'react';

const CommentsTab = ({ comment, formatDate, handleCommentSubmit, order, setComment, submittingComment }) => (
  <div className="space-y-4 sm:space-y-6">
    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <h4 className="text-base font-medium text-gray-900">Comments</h4>
      </div>
      <div className="border-t border-gray-200">
        {order.comments && order.comments.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {order.comments.map((comment, index) => (
              <li key={index} className="px-4 py-4">
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
          <div className="px-4 py-5 sm:p-6 text-center">
            <p className="text-gray-500">No comments yet</p>
          </div>
        )}
  
        {/* Add Comment Form */}
        <div className="px-4 py-5 sm:p-6 border-t border-gray-200">
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
