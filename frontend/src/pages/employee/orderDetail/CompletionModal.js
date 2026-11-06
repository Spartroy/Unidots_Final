import React from 'react';
import { PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';

const CompletionModal = ({ completionNote, designLink, files, getInputProps, getRootProps, isDragActive, removeFile, setCompletionNote, setDesignLink, setShowCompletionModal, uploadFilesAndCompleteOrder, uploading }) => (
  <div className="fixed z-10 inset-0 overflow-y-auto">
    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div className="fixed inset-0 transition-opacity" aria-hidden="true">
        <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>
      
      <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
      
      <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
        <div>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="mt-3 text-center sm:mt-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Complete Design Stage</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Please upload your final design files OR provide a design link (or both) before completing this stage.
              </p>
            </div>
          </div>
        </div>
  
        <div className="mt-5 sm:mt-6">
          <div className="mb-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-gray-300 rounded-md"
              placeholder="Add any notes about the design files"
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
            />
          </div>
  
          <div className="mb-4">
            <label htmlFor="designLink" className="block text-sm font-medium text-gray-700">
              Design Link (optional)
            </label>
            <input
              type="url"
              id="designLink"
              name="designLink"
              value={designLink}
              onChange={(e) => setDesignLink(e.target.value)}
              placeholder="e.g., https://www.dropbox.com/s/abc123/design.pdf?dl=0"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
  
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Upload Files (optional)
            </label>
            <div
              {...getRootProps()}
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer ${
                isDragActive ? 'bg-gray-50 border-primary-500' : ''
              }`}
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
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <input {...getInputProps()} />
                  <p className="pl-1">Drag and drop files here, or click to select files</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF, PDF, AI, PSD, EPS up to 50MB
                </p>
              </div>
            </div>
          </div>
  
          {files.length > 0 && (
            <ul className="mt-4 border border-gray-200 rounded-md divide-y divide-gray-200">
              {files.map((file, index) => (
                <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                  <div className="w-0 flex-1 flex items-center">
                    <PaperClipIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                    <span className="ml-2 flex-1 w-0 truncate">{file.name}</span>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => removeFile(file)}
                      className="font-medium text-red-600 hover:text-red-500"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
  
        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
          <button
            type="button"
            onClick={uploadFilesAndCompleteOrder}
            disabled={uploading || (files.length === 0 && !designLink.trim())}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Complete Design Stage'}
          </button>
          <button
            type="button"
            onClick={() => setShowCompletionModal(false)}
            disabled={uploading}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default CompletionModal;
