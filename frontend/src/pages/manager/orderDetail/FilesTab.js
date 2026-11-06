import React from 'react';
import { openFile } from '../../../utils/files';
import { PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';

const FilesTab = ({ files, getInputProps, getRootProps, handleFileUpload, isDragActive, order, removeFile, uploading }) => (
  <div className="space-y-6">
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h4 className="text-base font-medium text-gray-900">Order Files</h4>
        <p className="mt-1 text-sm text-gray-500">Attachments and documents related to this order</p>
      </div>
      <div className="p-6">
        {/* Client files section */}
        {order.files && order.files.some(file => file.uploadedBy?.role === 'client') && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Client Files</h4>
            <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
              {order.files
                .filter(file => file.uploadedBy?.role === 'client')
                .map((file, index) => (
                  <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                    <div className="w-0 flex-1 flex items-center">
                      <PaperClipIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                      <span className="ml-2 flex-1 w-0 truncate">
                        {file.originalname || file.filename}
                        <span className="ml-2 text-xs text-gray-500">
                          (Uploaded by {file.uploadedBy?.name || 'client'})
                        </span>
                      </span>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <a
                        href="#" onClick={(e) => openFile(e, file._id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary-600 hover:text-primary-500"
                      >
                        Download
                      </a>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        )}
  
        {/* Employee files section */}
        {order.files && order.files.some(file => file.uploadedBy?.role === 'employee' || file.uploadedBy?.role === 'prepress') && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Employee Files</h4>
            <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
              {order.files
                .filter(file => file.uploadedBy?.role === 'employee' || file.uploadedBy?.role === 'prepress')
                .map((file, index) => (
                  <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                    <div className="w-0 flex-1 flex items-center">
                      <PaperClipIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                      <span className="ml-2 flex-1 w-0 truncate">
                        {file.originalname || file.filename}
                        <span className="ml-2 text-xs text-gray-500">
                          (Uploaded by {file.uploadedBy?.name || 'employee'} - {file.uploadedBy?.role})
                        </span>
                      </span>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <a
                        href="#" onClick={(e) => openFile(e, file._id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary-600 hover:text-primary-500"
                      >
                        Download
                      </a>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        )}
  
        {/* Manager files section */}
        {order.files && order.files.some(file => file.uploadedBy?.role === 'manager') && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Manager Files</h4>
            <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
              {order.files
                .filter(file => file.uploadedBy?.role === 'manager')
                .map((file, index) => (
                  <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                    <div className="w-0 flex-1 flex items-center">
                      <PaperClipIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                      <span className="ml-2 flex-1 w-0 truncate">
                        {file.originalname || file.filename}
                        <span className="ml-2 text-xs text-gray-500">
                          (Uploaded by {file.uploadedBy?.name || 'manager'} - {file.uploadedBy?.role})
                        </span>
                      </span>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <a
                        href="#" onClick={(e) => openFile(e, file._id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary-600 hover:text-primary-500"
                      >
                        Download
                      </a>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        )}
  
        {/* Courier files section - Shipment Labels */}
        {order.files && order.files.some(file => file.fileType === 'courier') && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Shipment Labels</h4>
            <div className="rounded-md bg-blue-50 p-3 mb-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Order has been shipped. Shipment label uploaded by courier.
                  </p>
                </div>
              </div>
            </div>
            <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
              {order.files
                .filter(file => file.fileType === 'courier')
                .map((file, index) => (
                  <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                    <div className="w-0 flex-1 flex items-center">
                      <svg className="flex-shrink-0 h-5 w-5 text-blue-400 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 flex-1 w-0 truncate">
                        {file.originalname || file.filename}
                        <span className="ml-2 text-xs text-blue-600">
                          (Shipment Label - Uploaded by {file.uploadedBy?.name || 'courier'})
                        </span>
                      </span>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <a
                        href="#" onClick={(e) => openFile(e, file._id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-500"
                      >
                        Download
                      </a>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        )}
  
        {/* Upload new files section */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Upload New Files</h4>
          <div
            {...getRootProps()}
            className={`mt-2 flex justify-center px-6 pt-5 pb-6 border-2 ${
              isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
            } border-dashed rounded-md`}
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
              <p className="text-xs text-gray-500">PNG, JPG, GIF, PDF, AI, EPS up to 50MB</p>
            </div>
          </div>
  
          {files.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Files to upload:</h4>
              <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
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
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleFileUpload}
                  disabled={uploading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {uploading ? 'Uploading...' : 'Upload Files'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default FilesTab;
