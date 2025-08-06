import React, { useState, useRef, useContext } from 'react';
import { Upload, Camera, FileText, AlertCircle, CheckCircle, Loader, ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const DotDeformationDetector = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Helper for UI
  const getResultColor = (className) => className === 'good' ? 'text-green-600' : 'text-red-600';
  const getResultIcon = (className) => className === 'good' ? CheckCircle : AlertCircle;

  // Get dashboard route based on user role
  const getDashboardRoute = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'client':
        return '/client';
      case 'employee':
        return '/employee';
      case 'manager':
      case 'admin':
        return '/manager';
      case 'prepress':
        return '/prepress';
      default:
        return '/';
    }
  };

  // Handle file upload and POST to backend
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    setSelectedImage(file);

    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);

    // Send file to backend
    setLoading(true);
    setPrediction(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("API error: " + response.statusText);
      const result = await response.json();
      setPrediction(result);
    } catch (error) {
      alert('Failed to analyze image. Please try again.');
      setPrediction(null);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setPrediction(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
           
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Dot Deformation Detector
              </h1>
            </div>
            {user && (
              <Link
                to={getDashboardRoute()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         

          {/* Main Card */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8 p-6">
              {/* Upload Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Upload className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-medium text-gray-900">Upload Image</h2>
                </div>
                
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2 font-medium">
                    Click to upload a dot pattern image
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports JPG, PNG formats (Max 10MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {imagePreview && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Uploaded Image:</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Uploaded dot pattern"
                        className="w-full h-64 object-contain bg-gray-50"
                      />
                    </div>
                    <button
                      onClick={resetAnalysis}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium"
                    >
                      Upload New Image
                    </button>
                  </div>
                )}
              </div>

              {/* Results Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-medium text-gray-900">Analysis Results</h2>
                </div>

                {loading && (
                  <div className="text-center py-12">
                    <Loader className="animate-spin h-8 w-8 text-primary-600 mx-auto mb-4" />
                    <p className="text-gray-600">Analyzing dot pattern...</p>
                    <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
                  </div>
                )}

                {prediction && !loading && (
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                      <div className="flex items-start space-x-3 mb-4">
                        {React.createElement(getResultIcon(prediction.class), {
                          className: `h-6 w-6 ${getResultColor(prediction.class)} mt-1`
                        })}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            Quality Assessment
                          </h3>
                          <p className={`text-xl font-bold ${getResultColor(prediction.class)} capitalize`}>
                            {prediction.class === 'good' ? 'Acceptable Quality' : 'Quality Issues Detected'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span className="font-medium">Confidence Level</span>
                            <span className="font-semibold">{(prediction.confidence * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all duration-500 ${
                                prediction.class === 'good' ? 'bg-green-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${prediction.confidence * 100}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                          <div className="text-sm space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Raw Probability:</span>
                              <span className="font-mono text-gray-900">{prediction.probability.toFixed(4)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                          <div className={`rounded-md p-3 ${
                            prediction.class === 'good' 
                              ? 'bg-green-50 border border-green-200' 
                              : 'bg-red-50 border border-red-200'
                          }`}>
                            <p className={`text-sm ${
                              prediction.class === 'good' ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {prediction.class === 'good' 
                                ? 'Dot pattern is good, Quality meets standards.'
                                : 'Dot pattern is bad, Quality does not meet standards.'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!prediction && !loading && (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 font-medium">Upload an image to see analysis results</p>
                    <p className="text-sm text-gray-400 mt-1">Results will appear here once processing is complete</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              How to Use This Tool
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Step-by-Step Process:</h4>
                <ol className="list-decimal list-inside space-y-2 text-gray-600 text-sm">
                  <li>Upload a clear, high-quality image of your dot pattern sample</li>
                  <li>Wait 5 to 10 sec, as the AI model analyzes the image</li>
                  <li>Review quality</li>
                </ol>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Tips for Best Results:</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-600 text-sm">
                  <li>Ensure good lighting when capturing images</li>
                  <li>Keep the camera steady to avoid blur</li>
                  <li>Use high resolution images when possible</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DotDeformationDetector;
