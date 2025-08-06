import React from 'react';
import { downloadFile } from '../../utils/claimUtils';

/**
 * Reusable component to display file attachments
 * 
 * @param {Object} props
 * @param {Array} props.files - Array of file objects
 * @param {boolean} props.showUploader - Whether to show who uploaded the file
 */
const FileAttachments = ({ files, showUploader = true }) => {
  if (!files || files.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
      <dt className="text-sm font-medium text-gray-500">Attachments</dt>
      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
        <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
          {files.map((file) => (
            <li key={file._id} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
              <div className="w-0 flex-1 flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                </svg>
                <span className="ml-2 flex-1 w-0 truncate">
                  {file.originalname || file.filename || 'File'}
                  {showUploader && file.uploadedBy && (
                    <span className="ml-2 text-xs text-gray-500">
                      (Uploaded by {file.uploadedBy.name})
                    </span>
                  )}
                </span>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => downloadFile(file._id)}
                  type="button"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Download
                </button>
              </div>
            </li>
          ))}
        </ul>
      </dd>
    </div>
  );
};

export default FileAttachments; 