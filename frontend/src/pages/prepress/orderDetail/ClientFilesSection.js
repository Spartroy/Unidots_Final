import React from 'react';
import { PaperClipIcon } from '@heroicons/react/24/outline';

const ClientFilesSection = ({ order }) => (
  <div className="mb-8">
    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
      <svg className="w-5 h-5 ml-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      ملفات العميل
    </h4>
    <ul className="border border-gray-200 rounded-lg divide-y divide-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      {order.files
        .filter(file => file.uploadedBy?.role === 'client')
        .map((file, index) => (
          <li key={index} className="pl-6 pr-6 py-4 flex items-center justify-between text-sm hover:bg-blue-100 transition-colors">
            <div className="w-0 flex-1 flex items-center">
              <PaperClipIcon className="flex-shrink-0 h-6 w-6 text-blue-500" aria-hidden="true" />
                  <span className="mr-3 flex-1 w-0 truncate">
                {file.originalname || file.filename}
                <span className="mr-3 text-lg text-blue-600 font-medium">
                  (تم رفعه بواسطة {file.uploadedBy?.name || 'العميل'})
                </span>
              </span>
            </div>
            <div className="mr-4 flex-shrink-0">
              <a
                href={`/api/files/${file._id}/download`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                تحميل
              </a>
            </div>
          </li>
        ))}
    </ul>
  </div>
);

export default ClientFilesSection;
