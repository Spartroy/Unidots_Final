import React from 'react';
import { PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../../utils/api';
import { toast } from 'react-toastify';

const FilesTab = ({ files, getInputProps, getRootProps, id, isDragActive, order, removeFile, setFiles, setOrder }) => (
  <div className="space-y-4 sm:space-y-6">
    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <h4 className="text-base font-medium text-gray-900">Files</h4>
        <p className="mt-1 text-sm text-gray-500">
          Order attachments and design files
        </p>
      </div>
      <div className="p-4 sm:p-6">
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
                        href={`/api/files/${file._id}/download`}
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
        {order.files && order.files.some(file => file.uploadedBy?.role === 'employee' || file.uploadedBy?.role === 'prepress' || file.uploadedBy?.role === 'manager') && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Staff Files</h4>
            <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
              {order.files
                .filter(file => file.uploadedBy?.role === 'employee' || file.uploadedBy?.role === 'prepress' || file.uploadedBy?.role === 'manager')
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
                        href={`/api/files/${file._id}/download`}
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
  
        {/* Design Links section */}
        {order.designLinks && order.designLinks.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Design Links</h4>
            <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
              {order.designLinks.map((designLink, index) => (
                <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                  <div className="w-0 flex-1 flex items-center">
                    <svg className="flex-shrink-0 h-5 w-5 text-blue-400 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5a2 2 0 11-2.828 2.828l-1.5 1.5a1 1 0 01-1.414 0 4 4 0 00-5.656 0l-1.5 1.5a4 4 0 105.656 5.656l1.5-1.5a1 1 0 011.414 0 2 2 0 002.828 0l1.5-1.5a4 4 0 105.656-5.656l-1.5 1.5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-2 flex-1 w-0 truncate">
                      {designLink.link}
                      {designLink.notes && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({designLink.notes})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <a
                      href={designLink.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      Open Link
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
  
        {/* Ripping Files section */}
        {order.files && order.files.some(file => file.fileType === 'ripping') && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <svg className="h-4 w-4 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Ripping Files
            </h4>
            <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
              {order.files
                .filter(file => file.fileType === 'ripping')
                .map((file, index) => (
                  <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                    <div className="w-0 flex-1 flex items-center">
                      <PaperClipIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
                      <span className="ml-2 flex-1 w-0 truncate">
                        {file.originalname || file.filename}
                        <span className="ml-2 text-xs text-gray-500">
                          (Uploaded by {file.uploadedBy?.name || 'designer'} - Ripping)
                        </span>
                      </span>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <a
                        href={`/api/files/${file._id}/download`}
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
  
        {/* Ripping Links section */}
        {order.designLinks && order.designLinks.some(link => link.notes && link.notes.toLowerCase().includes('ripping')) && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <svg className="h-4 w-4 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5a2 2 0 11-2.828 2.828l-1.5 1.5a1 1 0 01-1.414 0 4 4 0 00-5.656 0l-1.5 1.5a4 4 0 105.656 5.656l1.5-1.5a1 1 0 011.414 0 2 2 0 002.828 0l1.5-1.5a4 4 0 105.656-5.656l-1.5 1.5a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Ripping Links
            </h4>
            <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
              {order.designLinks
                .filter(link => link.notes && link.notes.toLowerCase().includes('ripping'))
                .map((link, index) => (
                  <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                    <div className="w-0 flex-1 flex items-center">
                      <svg className="flex-shrink-0 h-5 w-5 text-blue-400 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5a2 2 0 11-2.828 2.828l-1.5 1.5a1 1 0 01-1.414 0 4 4 0 00-5.656 0l-1.5 1.5a4 4 0 105.656 5.656l1.5-1.5a1 1 0 011.414 0 2 2 0 002.828 0l1.5-1.5a4 4 0 105.656-5.656l-1.5 1.5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 flex-1 w-0 truncate">
                        {link.link}
                        {link.notes && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({link.notes})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <a
                        href={link.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-500"
                      >
                        Open Link
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
                  onClick={() => {
                    const formData = new FormData();
                    files.forEach(file => formData.append('files', file));
                    formData.append('relatedOrder', id);
                    formData.append('fileType', 'design');
                    
                    api.post('/api/files/upload', formData, {
                      headers: { 'Content-Type': 'multipart/form-data' }
                    })
                    .then(response => {
                      setFiles([]);
                      toast.success('Files uploaded successfully');
                      // Refresh order data
                      api.get(`/api/orders/${id}`).then(orderResponse => {
                        setOrder(orderResponse.data);
                      });
                    })
                    .catch(error => {
                      console.error('Error uploading files:', error);
                      toast.error('Failed to upload files');
                    });
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Upload Files
                </button>
              </div>
            </div>
          )}
  
          {!order.files?.length && files.length === 0 && (
            <p className="text-sm text-gray-500">No files attached to this order yet.</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default FilesTab;
