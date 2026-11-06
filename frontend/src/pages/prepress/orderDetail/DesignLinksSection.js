import React from 'react';

const DesignLinksSection = ({ order }) => (
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
                  <span className="ml-2 text-lg text-gray-500">
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
);

export default DesignLinksSection;
