import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import {
  ClockIcon,
  ChartBarIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/templates');
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };



  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatEstimatedTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const getTemplateImage = (subCategory) => {
    switch (subCategory) {
      case 'Rice Package':
        return { 
          src: '/images/templates/Rice.png',
          alt: 'Rice Package Template',
          placeholder: '🍚 Rice Package'
        };
      case 'Juice Pouch':
        return { 
          src: '/images/templates/Juice.png', 
          alt: 'Juice Pouch Template',
          placeholder: '🧃 Juice Pouch'
        };
      case 'Coffee Package':
        return { 
          src: '/images/templates/Coffee.png', 
          alt: 'Coffee Package Template',
          placeholder: '☕ Coffee Package'
        };
      case 'Tea Package':
        return { 
          src: '/images/templates/Tea.png', 
          alt: 'Tea Package Template',
          placeholder: '🍵 Tea Package'
        };
      default:
        return { 
          src: '', 
          alt: 'Template',
          placeholder: '📦 Template'
        };
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Design Templates</h1>
            <p className="text-sm text-gray-600 mt-1">
              Choose from pre-made templates to speed up your design process
            </p>
          </div>
        </div>



        {/* Templates Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No templates available</h3>
            <p className="mt-1 text-sm text-gray-500">
              Templates will appear here once they are added to the system.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {templates.map((template) => (
              <div key={template._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200">
                {/* Template Preview */}
                <div className="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                  {template.previewImage ? (
                    <img
                      src={template.previewImage.fileUrl}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      {(() => {
                        const templateImage = getTemplateImage(template.subCategory);
                        return (
                          <img
                            src={templateImage.src}
                            alt={templateImage.alt}
                            className="w-full h-full object-contain p-4"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        );
                      })()}
                      <div className="text-center hidden flex-col items-center justify-center w-full h-full">
                        {(() => {
                          const templateImage = getTemplateImage(template.subCategory);
                          return (
                            <>
                              <div className="text-4xl mb-2">{templateImage.placeholder.split(' ')[0]}</div>
                              <p className="text-xs text-gray-500 font-medium">{templateImage.placeholder}</p>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                  
             
                  {/* Difficulty Badge */}
                  <div className="absolute top-2 left-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(template.difficulty)}`}>
                      {template.difficulty}
                    </span>
                  </div>
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center">
                        {(() => {
                          const templateImage = getTemplateImage(template.subCategory);
                          return (
                            <div className="relative h-4 w-4 mr-2 flex-shrink-0">
                              <img
                                src={templateImage.src}
                                alt={templateImage.alt}
                                className="h-4 w-4 object-contain rounded"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="h-4 w-4 bg-gray-200 rounded hidden items-center justify-center text-xs">
                                {templateImage.placeholder.split(' ')[0]}
                              </div>
                            </div>
                          );
                        })()}
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {template.name}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {template.category} • {template.subCategory}
                      </p>
                    </div>
                  </div>


            

                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2 mt-4">
                    
                    <Link
                      to={`/employee/templates/${template._id}/customize`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Use Template
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}


      </div>
    </div>
  );
};

export default Templates; 