import React from 'react';

const SpecificationsSection = ({ order }) => (
  <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg overflow-hidden mb-8">
    <div className="bg-orange-100 px-6 py-4 border-b border-orange-200">
      <h4 className="text-lg font-semibold text-orange-900 flex items-center">
        <svg className="h-6 w-6 ml-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
        </svg>
        استهلاك محلول المذيبات
      </h4>
    </div>
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-6">
        <div className="text-right">
          <dt className="text-lg font-medium text-orange-600 uppercase tracking-wide mb-2">المساحة الإجمالية</dt>
          <dd className="text-lg font-semibold text-gray-900">
            {(() => {
              const dims = order.specifications.dimensions;
              const totalLengthCm = dims.width * (dims.widthRepeatCount || 1);
              const totalWidthCm = dims.height * (dims.heightRepeatCount || 1);
              const totalAreaM2 = (totalLengthCm * totalWidthCm) / 10000;
              return `${totalAreaM2.toFixed(3)} م²`;
            })()}
          </dd>
        </div>
        
        <div className="text-right">
          <dt className="text-lg font-medium text-orange-600 uppercase tracking-wide mb-2">المحلول المطلوب</dt>
          <dd className="text-lg font-semibold text-orange-600">
            {(() => {
              const dims = order.specifications.dimensions;
              const totalLengthCm = dims.width * (dims.widthRepeatCount || 1);
              const totalWidthCm = dims.height * (dims.heightRepeatCount || 1);
              const totalAreaM2 = (totalLengthCm * totalWidthCm) / 10000;
              const litersNeeded = totalAreaM2 * 10; // 10 liters per m²
              return `${litersNeeded.toFixed(2)} لتر`;
            })()}
          </dd>
        </div>
        
        <div className="text-right">
          <dt className="text-lg font-medium text-orange-600 uppercase tracking-wide mb-2">تكلفة المعالجة</dt>
          <dd className="text-lg font-semibold text-green-600">
            {(() => {
              const dims = order.specifications.dimensions;
              const totalLengthCm = dims.width * (dims.widthRepeatCount || 1);
              const totalWidthCm = dims.height * (dims.heightRepeatCount || 1);
              const totalAreaM2 = (totalLengthCm * totalWidthCm) / 10000;
              const estimatedCost = totalAreaM2 * 424.44; // Cost per m²
              return `${estimatedCost.toFixed(2)} جنيه مصري`;
            })()}
          </dd>
          </div>
        </div>
    </div>
  </div>
);

export default SpecificationsSection;
