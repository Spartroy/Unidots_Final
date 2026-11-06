import React from 'react';

const SubProcessesSection = ({ getSubProcessStatusDisplay, handleSubProcessUpdate, updating, user }) => (
  <div className="px-6 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
    <h5 className="text-lg font-semibold text-gray-700 mb-6 text-right">عمليات ما قبل الطباعة</h5>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {/* Positioning Process */}
      <div className={`bg-white border-2 ${getSubProcessStatusDisplay('positioning').status === 'Completed' ? 'border-green-300 shadow-lg' : 'border-gray-200'} rounded-xl p-6 transition-all hover:shadow-xl`}>
        <div className="flex items-center mb-4">
          <div className={`flex-shrink-0 h-12 w-12 rounded-full ${getSubProcessStatusDisplay('positioning').status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'} flex items-center justify-center ml-4`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="text-right flex-1 relative">
             <span className={`absolute -top-7 -left-5 px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getSubProcessStatusDisplay('positioning').status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
               {getSubProcessStatusDisplay('positioning').status === 'Completed' ? 'مكتمل' : 'قيد الانتظار'}
            </span>
             <h4 className="text-base font-semibold text-gray-900">رص الألوان</h4>
          </div>
        </div>
        <div className="mt-4 flex justify-center items-center">
          {(user?.role === 'manager' || user?.role === 'admin' || user?.role === 'prepress' || user?.department === 'prepress') && (
            getSubProcessStatusDisplay('positioning').status === 'Pending' ? (
              <button
                type="button"
                onClick={() => handleSubProcessUpdate('positioning', 'Completed')}
                disabled={updating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all duration-200 hover:shadow-md"
              >
                إكمال
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubProcessUpdate('positioning', 'Pending')}
                disabled={updating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all duration-200"
              >
                إعادة
              </button>
            )
          )}
        </div>
      </div>
  
      {/* Back Exposure Process */}
      <div className={`bg-white border-2 ${getSubProcessStatusDisplay('backExposure').status === 'Completed' ? 'border-green-300 shadow-lg' : 'border-gray-200'} rounded-xl p-6 transition-all hover:shadow-xl`}>
        <div className="flex items-center mb-4">
          <div className={`flex-shrink-0 h-12 w-12 rounded-full ${getSubProcessStatusDisplay('backExposure').status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'} flex items-center justify-center ml-4`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div className="text-right flex-1 relative">
            <span className={`absolute -top-7 -left-5 px-3 py-1 inline-flex text-sm font-medium rounded-full ${getSubProcessStatusDisplay('backExposure').status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {getSubProcessStatusDisplay('backExposure').status === 'Completed' ? 'مكتمل' : 'قيد الانتظار'}
            </span>
            <h4 className="text-base font-semibold text-gray-900 mb-1">تعريض خلفي</h4>
          </div>
        </div>
        
        <div className="mt-4 flex justify-center items-center">
          {getSubProcessStatusDisplay('backExposure').status === 'Pending' ? (
              <button
                type="button"
              onClick={() => handleSubProcessUpdate('backExposure', 'Completed')}
              disabled={updating}
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all duration-200 shadow-sm"
              >
              إكمال
              </button>
          ) : (
                <button
                  type="button"
              onClick={() => handleSubProcessUpdate('backExposure', 'Pending')}
              disabled={updating}
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all duration-200 shadow-sm"
                >
              إعادة
                </button>
              )}
        </div>
      </div>
  
      {/* Laser Imaging Process */}
      <div className={`bg-white border-2 ${getSubProcessStatusDisplay('laserImaging').status === 'Completed' ? 'border-green-300 shadow-lg' : 'border-gray-200'} rounded-xl p-6 transition-all hover:shadow-xl`}>
        <div className="flex items-center mb-4">
          <div className={`flex-shrink-0 h-12 w-12 rounded-full ${getSubProcessStatusDisplay('laserImaging').status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'} flex items-center justify-center ml-4`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <div className="text-right flex-1 relative">
            <span className={`absolute -top-7 -left-5 px-3 py-1 inline-flex text-sm font-medium rounded-full ${getSubProcessStatusDisplay('laserImaging').status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {getSubProcessStatusDisplay('laserImaging').status === 'Completed' ? 'مكتمل' : 'قيد الانتظار'}
            </span>
            <h4 className="text-base font-semibold text-gray-900 mb-1">تصوير الليزر</h4>
          </div>
        </div>
        
        <div className="mt-4 flex justify-center items-center">
          {getSubProcessStatusDisplay('laserImaging').status === 'Pending' ? (
            <button
              type="button"
              onClick={() => handleSubProcessUpdate('laserImaging', 'Completed')}
              disabled={updating}
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all duration-200 shadow-sm"
            >
              إكمال
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubProcessUpdate('laserImaging', 'Pending')}
              disabled={updating}
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all duration-200 shadow-sm"
            >
              إعادة
            </button>
          )}
        </div>
      </div>
  
      {/* Main Exposure Process */}
      <div className={`bg-white border-2 ${getSubProcessStatusDisplay('mainExposure').status === 'Completed' ? 'border-green-300 shadow-lg' : 'border-gray-200'} rounded-xl p-6 transition-all hover:shadow-xl`}>
        <div className="flex items-center mb-4">
          <div className={`flex-shrink-0 h-12 w-12 rounded-full ${getSubProcessStatusDisplay('mainExposure').status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'} flex items-center justify-center ml-4`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div className="text-right flex-1 relative">
            <span className={`absolute -top-7 -left-5 px-3 py-1 inline-flex text-sm font-medium rounded-full ${getSubProcessStatusDisplay('mainExposure').status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {getSubProcessStatusDisplay('mainExposure').status === 'Completed' ? 'مكتمل' : 'قيد الانتظار'}
            </span>
            <h4 className="text-base font-semibold text-gray-900 mb-1">تعريض اساسي</h4>
          </div>
        </div>
        
        <div className="mt-4 flex justify-center items-center">
          {getSubProcessStatusDisplay('mainExposure').status === 'Pending' ? (
              <button
                type="button"
              onClick={() => handleSubProcessUpdate('mainExposure', 'Completed')}
              disabled={updating}
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all duration-200 shadow-sm"
            >
              إكمال
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubProcessUpdate('mainExposure', 'Pending')}
              disabled={updating}
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all duration-200 shadow-sm"
            >
              إعادة
            </button>
          )}
        </div>
      </div>
  
      {/* Washout Process */}
      <div className={`bg-white border-2 ${getSubProcessStatusDisplay('washout').status === 'Completed' ? 'border-green-300 shadow-lg' : 'border-gray-200'} rounded-xl p-6 transition-all hover:shadow-xl`}>
        <div className="flex items-center mb-4">
          <div className={`flex-shrink-0 h-12 w-12 rounded-full ${getSubProcessStatusDisplay('washout').status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'} flex items-center justify-center ml-4`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div className="text-right flex-1 relative">
            <span className={`absolute -top-7 -left-5 px-3 py-1 inline-flex text-sm font-medium rounded-full ${getSubProcessStatusDisplay('washout').status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {getSubProcessStatusDisplay('washout').status === 'Completed' ? 'مكتمل' : 'قيد الانتظار'}
            </span>
            <h4 className="text-base font-semibold text-gray-900 mb-1">حفر</h4>
          </div>
        </div>
        
        <div className="mt-4 flex justify-center items-center">
          {getSubProcessStatusDisplay('washout').status === 'Pending' ? (
              <button
                type="button"
              onClick={() => handleSubProcessUpdate('washout', 'Completed')}
              disabled={updating}
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all duration-200 shadow-sm"
              >
              إكمال
              </button>
          ) : (
                <button
                  type="button"
              onClick={() => handleSubProcessUpdate('washout', 'Pending')}
              disabled={updating}
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all duration-200 shadow-sm"
                >
              إعادة
                </button>
              )}
        </div>
      </div>
  
      {/* Drying Process */}
      <div className={`bg-white border-2 ${getSubProcessStatusDisplay('drying').status === 'Completed' ? 'border-green-300 shadow-lg' : 'border-gray-200'} rounded-xl p-6 transition-all hover:shadow-xl`}>
        <div className="flex items-center mb-4">
          <div className={`flex-shrink-0 h-12 w-12 rounded-full ${getSubProcessStatusDisplay('drying').status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'} flex items-center justify-center ml-4`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div className="text-right flex-1 relative">
            <span className={`absolute -top-7 -left-5 px-3 py-1 inline-flex text-sm font-medium rounded-full ${getSubProcessStatusDisplay('drying').status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {getSubProcessStatusDisplay('drying').status === 'Completed' ? 'مكتمل' : 'قيد الانتظار'}
            </span>
            <h4 className="text-base font-semibold text-gray-900 mb-1">تجفيف</h4>
          </div>
        </div>
        
        <div className="mt-4 flex justify-center items-center">
          {getSubProcessStatusDisplay('drying').status === 'Pending' ? (
                <button
                  type="button"
              onClick={() => handleSubProcessUpdate('drying', 'Completed')}
              disabled={updating}
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all duration-200 shadow-sm"
            >
              إكمال
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubProcessUpdate('drying', 'Pending')}
              disabled={updating}
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all duration-200 shadow-sm"
            >
              إعادة
            </button>
          )}
        </div>
      </div>
  
      {/* Post Exposure & UVC Exposure Combined Process */}
      <div className={`bg-white border ${getSubProcessStatusDisplay('postExposure').status === 'Completed' && getSubProcessStatusDisplay('uvcExposure').status === 'Completed' ? 'border-green-300 shadow-sm' : 'border-gray-200'} rounded-lg p-4 transition-all hover:shadow-md`}>
        <div className="mb-4">
          
          {/* Post Exposure Status */}
          <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded">
            <div className="flex items-center">
              <div className={`h-3 w-3 rounded-full mr-2 ${
                getSubProcessStatusDisplay('postExposure').status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <span className="text-sm  text-gray-700">تعريض نهائي</span>
          </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              getSubProcessStatusDisplay('postExposure').status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {getSubProcessStatusDisplay('postExposure').status}
            </span>
        </div>
        
          {/* UVC Exposure Status */}
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center">
              <div className={`h-3 w-3 rounded-full mr-2 ${
                getSubProcessStatusDisplay('uvcExposure').status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <span className="text-sm text-gray-700">UVC</span>
                  </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              getSubProcessStatusDisplay('uvcExposure').status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {getSubProcessStatusDisplay('uvcExposure').status}
            </span>
                  </div>
                </div>
        
        {/* Action Buttons */}
        <div className="mt-4 flex justify-center items-center gap-3">
          {/* Post Exposure Button */}
          {getSubProcessStatusDisplay('postExposure').status === 'Pending' ? (
              <button
                type="button"
              onClick={() => handleSubProcessUpdate('postExposure', 'Completed')}
              disabled={updating}
              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
             نهائي
              </button>
          ) : (
                <button
                  type="button"
              onClick={() => handleSubProcessUpdate('postExposure', 'Pending')}
              disabled={updating}
              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
              Reset
                </button>
              )}
          
          {/* UVC Exposure Button */}
          {getSubProcessStatusDisplay('uvcExposure').status === 'Pending' ? (
                <button
                  type="button"
              onClick={() => handleSubProcessUpdate('uvcExposure', 'Completed')}
              disabled={updating}
              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
               UVC
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubProcessUpdate('uvcExposure', 'Pending')}
              disabled={updating}
              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              Reset UVC
            </button>
          )}
        </div>
      </div>
  
      {/* Finishing Process */}
      <div className={`bg-white border-2 ${getSubProcessStatusDisplay('finishing').status === 'Completed' ? 'border-green-300 shadow-lg' : 'border-gray-200'} rounded-xl p-6 transition-all hover:shadow-xl`}>
        <div className="flex items-center mb-4">
          <div className={`flex-shrink-0 h-12 w-12 rounded-full ${getSubProcessStatusDisplay('finishing').status === 'Completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'} flex items-center justify-center ml-4`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <div className="text-right flex-1 relative">
            <span className={`absolute -top-7 -left-5 px-3 py-1 inline-flex text-sm font-medium rounded-full ${getSubProcessStatusDisplay('finishing').status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {getSubProcessStatusDisplay('finishing').status === 'Completed' ? 'مكتمل' : 'قيد الانتظار'}
            </span>
            <h4 className="text-base font-semibold text-gray-900 mb-1">مراجعة و تلميع</h4>
          </div>
        </div>
        <div className="mt-4 flex justify-center items-center">
          {getSubProcessStatusDisplay('finishing').status === 'Pending' ? (
            <button
              type="button"
              onClick={() => handleSubProcessUpdate('finishing', 'Completed')}
              disabled={updating}
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all duration-200 shadow-sm"
            >
              إكمال
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubProcessUpdate('finishing', 'Pending')}
              disabled={updating}
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all duration-200 shadow-sm"
            >
              إعادة
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default SubProcessesSection;
