import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import AuthContext from '../../context/AuthContext';
import { XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const NewOrder = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Calculate default deadline (7 days from now)
  const defaultDeadline = new Date();
  defaultDeadline.setDate(defaultDeadline.getDate() + 7);
  // Format for input date field: YYYY-MM-DD
  const formattedDefaultDeadline = defaultDeadline.toISOString().split('T')[0];

  // Calculate initial color count
  const calculateInitialColorCount = () => {
    return Math.max(1, 0); // Start with minimum 1 color
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    orderType: 'New Order',
    specifications: {
      dimensions: {
    width: '',
    height: '',
        widthRepeatCount: 1,
        heightRepeatCount: 1,
        unit: 'mm',
      },
      colors: calculateInitialColorCount(),
      usedColors: [],
      customColors: [],
      printingMode: 'Surface Printing',
      material: 'Flint',
      materialThickness: 1.7,
      additionalDetails: '',
    },
    priority: 'Medium',
    deadline: formattedDefaultDeadline,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(0);

  // Standard color options with color codes
  const standardColorOptions = [
    { value: 'Cyan', label: 'Cyan', color: '#00FFFF' },
    { value: 'Magenta', label: 'Magenta', color: '#FF00FF' },
    { value: 'Yellow', label: 'Yellow', color: '#FFFF00' },
    { value: 'Black', label: 'Black', color: '#000000' },
    { value: 'CMYK Combined', label: 'CMYK Combined', color: '#333333' },
    { value: 'Red', label: 'Red', color: '#FF0000' },
    { value: 'Blue', label: 'Blue', color: '#0000FF' },
    { value: 'Green', label: 'Green', color: '#008000' },
    { value: 'Golden', label: 'Golden', color: '#FFD700' },
    { value: 'Silver', label: 'Silver', color: '#C0C0C0' },
    { value: 'White', label: 'White', color: '#FFFFFF' },
    { value: 'Other', label: 'Transparent', color: '#AAAAAA' },
  ];

  // Calculate estimated price whenever relevant form fields change
  useEffect(() => {
    calculateEstimatedPrice();
  }, [
    formData.specifications.dimensions.width,
    formData.specifications.dimensions.height,
    formData.specifications.dimensions.widthRepeatCount,
    formData.specifications.dimensions.heightRepeatCount,
    formData.specifications.colors,
    formData.specifications.usedColors,
    formData.specifications.customColors,
    formData.specifications.materialThickness,
  ]);

  const calculateEstimatedPrice = () => {
    const { width, height, widthRepeatCount, heightRepeatCount } = formData.specifications.dimensions;
    const { usedColors, customColors, materialThickness } = formData.specifications;

    // If any required field is missing, don't calculate
    if (!width || !height) {
      setEstimatedPrice(0);
      return;
    }

    // Determine material price factor based on thickness
    let materialPriceFactor = 0.77; // Default to 1.7 thickness
    if (materialThickness === 1.14) {
      materialPriceFactor = 0.75;
    } else if (materialThickness === 1.7) {
      materialPriceFactor = 0.85;
    } else if (materialThickness === 2.54) {
      materialPriceFactor = 0.95;
    }

    // Count colors - with special handling for CMYK Combined
    const cmykWeight = usedColors.includes('CMYK Combined') ? 4 : 0;
    const otherColorsCount = usedColors.filter(c => c !== 'CMYK Combined').length;
    const numberOfCustomColors = customColors?.length > 0 ? customColors.filter(color => color.trim() !== '').length : 0;
    const totalColorsUsed = Math.max(cmykWeight + otherColorsCount + numberOfCustomColors, 1); // minimum 1

    // Calculate dimensions with repeat counts
    const totalWidth = parseFloat(width) * (widthRepeatCount || 1);
    const totalHeight = parseFloat(height) * (heightRepeatCount || 1);

    // Calculate price
    const price = ((totalWidth * totalHeight * totalColorsUsed) * materialPriceFactor).toFixed(2);
    setEstimatedPrice(price);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('specifications.')) {
      // Handle nested specifications object
      const specField = name.split('.')[1];
      setFormData({
        ...formData,
        specifications: {
          ...formData.specifications,
          [specField]: value,
        },
      });
    } else if (name.includes('dimensions.')) {
      // Handle nested dimensions object within specifications
      const dimField = name.split('.')[1];
      
      let processedValue = value;
      if (dimField === 'widthRepeatCount' || dimField === 'heightRepeatCount') {
        processedValue = Math.max(1, parseInt(value) || 1); // Ensure minimum value of 1
      }
      
      setFormData({
        ...formData,
        specifications: {
          ...formData.specifications,
          dimensions: {
            ...formData.specifications.dimensions,
            [dimField]: processedValue,
          },
        },
      });
    } else {
      // Handle top-level fields
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleColorToggle = (color) => {
    const currentColors = [...formData.specifications.usedColors];
    const colorIndex = currentColors.indexOf(color);
    
    if (colorIndex === -1) {
      // Add color if not already selected
      currentColors.push(color);
    } else {
      // Remove color if already selected
      currentColors.splice(colorIndex, 1);
    }
    
    // Calculate total number of colors including custom colors
    const cmykWeight = currentColors.includes('CMYK Combined') ? 4 : 0;
    const otherColorsCount = currentColors.filter(c => c !== 'CMYK Combined').length;
    const customColorsCount = formData.specifications.customColors?.filter(c => c.trim() !== '').length || 0;
    
    const totalColors = Math.max(
      cmykWeight + otherColorsCount + customColorsCount,
      1 // Minimum of 1 color
    );
    
    setFormData({
      ...formData,
      specifications: {
        ...formData.specifications,
        usedColors: currentColors,
        colors: totalColors, // Update the colors count
      },
    });
  };

  const handleCustomColorChange = (index, value) => {
    const newCustomColors = [...formData.specifications.customColors];
    newCustomColors[index] = value;
    
    // Calculate total number of colors including standard colors
    const cmykWeight = formData.specifications.usedColors.includes('CMYK Combined') ? 4 : 0;
    const otherColorsCount = formData.specifications.usedColors.filter(c => c !== 'CMYK Combined').length;
    const customColorsCount = newCustomColors.filter(c => c.trim() !== '').length;
    
    const totalColors = Math.max(
      cmykWeight + otherColorsCount + customColorsCount,
      1 // Minimum of 1 color
    );
    
    setFormData({
      ...formData,
      specifications: {
        ...formData.specifications,
        customColors: newCustomColors,
        colors: totalColors, // Update the colors count
      },
    });
  };

  const addCustomColorField = () => {
    setFormData({
      ...formData,
      specifications: {
        ...formData.specifications,
        customColors: [...formData.specifications.customColors, ''],
      },
    });
  };

  const removeCustomColorField = (index) => {
    const newCustomColors = [...formData.specifications.customColors];
    newCustomColors.splice(index, 1);
    
    // Calculate total number of colors after removing a custom color
    const cmykWeight = formData.specifications.usedColors.includes('CMYK Combined') ? 4 : 0;
    const otherColorsCount = formData.specifications.usedColors.filter(c => c !== 'CMYK Combined').length;
    const customColorsCount = newCustomColors.filter(c => c.trim() !== '').length;
    
    const totalColors = Math.max(
      cmykWeight + otherColorsCount + customColorsCount,
      1 // Minimum of 1 color
    );
    
    setFormData({
      ...formData,
      specifications: {
        ...formData.specifications,
        customColors: newCustomColors,
        colors: totalColors, // Update the colors count
      },
    });
  };

  // Function to try to get color for custom color inputs
  const getColorForCustomColor = (colorName) => {
    if (!colorName || colorName.trim() === '') return '#333333';
    
    // Check if the color name matches any of our standard colors
    const matchedColor = standardColorOptions.find(
      option => option.label.toLowerCase() === colorName.toLowerCase() || 
                option.value.toLowerCase() === colorName.toLowerCase()
    );
    
    if (matchedColor) return matchedColor.color;
    
    // Try to use the color name directly (works for standard CSS color names)
    try {
      // Common color names that might be entered
      const commonColors = {
        'gold': '#FFD700',
        'silver': '#C0C0C0',
        'bronze': '#CD7F32',
        'navy': '#000080',
        'teal': '#008080',
        'maroon': '#800000',
        'olive': '#808000',
        'lime': '#00FF00',
        'aqua': '#00FFFF',
        'fuchsia': '#FF00FF'
      };
      
      if (commonColors[colorName.toLowerCase()]) {
        return commonColors[colorName.toLowerCase()];
      }
      
      return colorName;
    } catch (e) {
      return '#333333'; // Default color if can't be determined
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      
      // Check if any custom colors need to be marked as 'Other'
      const formattedOrderData = {
        ...formData,
        specifications: {
          ...formData.specifications,
          // Filter out empty custom colors
          customColors: formData.specifications.customColors.filter(color => color.trim() !== '')
        },
      };
      
      const res = await api.post('/api/orders', formattedOrderData);
      
      toast.success('Order submitted successfully');
      navigate('/client/orders');
    } catch (error) {
      console.error('Error submitting order:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to submit order');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
        <p className="mt-2 text-sm text-gray-500">
          Please provide the details for your new order request.
        </p>
        <p className="mt-1 text-sm text-gray-500 font-medium">
          Note: You can upload design files and reference materials after submitting your order from the order details page.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-12 divide-y divide-gray-200">
          {/* Basic Information */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-6 py-6 sm:px-8">
              <h3 className="text-xl leading-7 font-semibold text-gray-900">Basic Information</h3>
            </div>
            <div className="border-t border-gray-200 px-6 py-8 sm:p-8">
            <div className="grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label htmlFor="title" className="block text-base font-semibold text-gray-700 mb-2">
                    Order Name
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="title"
                    id="title"
                      required
                    value={formData.title}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full text-base border-gray-300 rounded-md px-4 py-3"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-base font-semibold text-gray-700 mb-2">
                    Order Description
                </label>
                <div className="mt-2">
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full text-base border-gray-300 rounded-md px-4 py-3"
                  />
              </div>
            </div>
            
                <div className="sm:col-span-3">
                  <label htmlFor="orderType" className="block text-base font-semibold text-gray-700 mb-2">
                    Order Type
                  </label>
                  <div className="mt-2">
                    <select
                      id="orderType"
                      name="orderType"
                      value={formData.orderType}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full text-base border-gray-300 rounded-md px-4 py-3"
                    >
                      <option value="New Order">New Order</option>
                      <option value="Existing">Existing Order</option>
                      <option value="Existing With Changes">Existing With Modifications</option>
                    </select>
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="priority" className="block text-base font-semibold text-gray-700 mb-2">
                    Priority
                  </label>
                  <div className="mt-2">
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full text-base border-gray-300 rounded-md px-4 py-3"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="deadline" className="block text-base font-semibold text-gray-700 mb-2">
                    Deadline
                  </label>
                  <div className="mt-2">
                    <input
                      type="date"
                      name="deadline"
                      id="deadline"
                      required
                      value={formData.deadline}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full text-base border-gray-300 rounded-md px-4 py-3"
                    />
                  </div>
                </div>
              </div>
                  </div>
                </div>
                
          {/* Technical Specifications */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-6 py-6 sm:px-8">
              <h3 className="text-xl leading-7 font-semibold text-gray-900">Technical Specifications</h3>
            </div>
            <div className="border-t border-gray-200 px-6 py-8 sm:p-8">
              <div className="grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-6">
                {/* Dimensions */}
                <div className="sm:col-span-6">
                  <h4 className="text-lg font-semibold text-gray-700 mb-6">Dimensions</h4>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label htmlFor="width" className="block text-base font-semibold text-gray-700 mb-2">
                        Width
                      </label>
                      <div className="mt-2">
                        <input
                          type="number"
                          name="dimensions.width"
                          id="width"
                          required
                          min="1"
                          step="0.1"
                          value={formData.specifications.dimensions.width}
                          onChange={handleChange}
                          className="focus:ring-primary-500 focus:border-primary-500 block w-full text-base border-gray-300 rounded-md px-4 py-3"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="widthRepeatCount" className="block text-base font-semibold text-gray-700 mb-2">
                        Width Repeat
                      </label>
                      <div className="mt-2">
                        <input
                          type="number"
                          name="dimensions.widthRepeatCount"
                          id="widthRepeatCount"
                          required
                          min="1"
                          step="1"
                          value={formData.specifications.dimensions.widthRepeatCount}
                          onChange={handleChange}
                          className="focus:ring-primary-500 focus:border-primary-500 block w-full text-base border-gray-300 rounded-md px-4 py-3"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="height" className="block text-base font-semibold text-gray-700 mb-2">
                        Height
                      </label>
                      <div className="mt-2">
                        <input
                          type="number"
                          name="dimensions.height"
                          id="height"
                          required
                          min="1"
                          step="0.1"
                          value={formData.specifications.dimensions.height}
                          onChange={handleChange}
                          className="focus:ring-primary-500 focus:border-primary-500 block w-full text-base border-gray-300 rounded-md px-4 py-3"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="heightRepeatCount" className="block text-base font-semibold text-gray-700 mb-2">
                        Height Repeat
                      </label>
                      <div className="mt-2">
                        <input
                          type="number"
                          name="dimensions.heightRepeatCount"
                          id="heightRepeatCount"
                          required
                          min="1"
                          step="1"
                          value={formData.specifications.dimensions.heightRepeatCount}
                          onChange={handleChange}
                          className="focus:ring-primary-500 focus:border-primary-500 block w-full text-base border-gray-300 rounded-md px-4 py-3"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Material and Settings */}
                <div className="sm:col-span-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="material" className="block text-base font-semibold text-gray-700 mb-2">
                        Material Type
                      </label>
                      <div className="mt-2">
                        <select
                          id="material"
                          name="specifications.material"
                          value={formData.specifications.material}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full text-base border-gray-300 rounded-md px-4 py-3"
                        >
                          <option value="Flint">Flint</option>
                          <option value="Strong">Strong</option>
                          <option value="Taiwan">Taiwan</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="materialThickness" className="block text-base font-semibold text-gray-700 mb-2">
                        Material Thickness (microns)
                      </label>
                      <div className="mt-2">
                        <select
                          id="materialThickness"
                          name="specifications.materialThickness"
                          value={formData.specifications.materialThickness}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full text-base border-gray-300 rounded-md px-4 py-3"
                        >
                          <option value={1.14}>1.14</option>
                          <option value={1.7}>1.7</option>
                          <option value={2.54}>2.54</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="sm:col-span-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="printingMode" className="block text-base font-semibold text-gray-700 mb-2">
                        Printing Mode
                      </label>
                      <div className="mt-2">
                        <select
                          id="printingMode"
                          name="specifications.printingMode"
                          value={formData.specifications.printingMode}
                          onChange={handleChange}
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full text-base border-gray-300 rounded-md px-4 py-3"
                        >
                          <option value="Surface Printing">Surface Printing</option>
                          <option value="Reverse Printing">Reverse Printing</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="colors" className="block text-base font-semibold text-gray-700 mb-2">
                        Number of Colors
                      </label>
                      <div className="mt-2">
                        <div className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full text-base border-gray-300 rounded-md py-3 px-4 bg-gray-50">
                          {(() => {
                            const cmykWeight = formData.specifications.usedColors.includes('CMYK Combined') ? 4 : 0;
                            const otherColorsCount = formData.specifications.usedColors.filter(c => c !== 'CMYK Combined').length;
                            const customColorsCount = formData.specifications.customColors?.filter(c => c.trim() !== '').length || 0;
                            return Math.max(cmykWeight + otherColorsCount + customColorsCount, 1);
                          })()}
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Based on your selected colors below (CMYK Combined counts as 4 colors)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Color Selection */}
                <div className="sm:col-span-6">
                  <fieldset>
                    <legend className="text-lg font-semibold text-gray-700 mb-4">Select Colors</legend>
                    <div className="mt-4 space-y-3">
                      <p className="text-sm text-gray-600">Choose the colors you need for this order:</p>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                        {standardColorOptions.map((colorOption) => {
                          // Determine text color based on background for better contrast
                          const getTextColor = (colorValue) => {
                            const darkColors = ['Black', 'Blue', 'Red', 'Green', 'Magenta', 'CMYK Combined'];
                            return darkColors.includes(colorValue) ? '#ffffff' : '#000000';
                          };

                          return (
                            <div key={colorOption.value} className="relative flex items-center mb-2">
                              <div className="flex items-center h-5">
                                <input
                                  id={`color-${colorOption.value}`}
                                  name={`color-${colorOption.value}`}
                                  type="checkbox"
                                  checked={formData.specifications.usedColors.includes(colorOption.value)}
                                  onChange={() => handleColorToggle(colorOption.value)}
                                  className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                                />
                              </div>
                              <div className="ml-3">
                                <label 
                                  htmlFor={`color-${colorOption.value}`} 
                                  className="inline-block font-medium px-4 py-2 rounded-full cursor-pointer text-sm shadow-sm border" 
                                  style={{ 
                                    backgroundColor: colorOption.value === 'Other' ? '#f3f4f6' : colorOption.color,
                                    color: colorOption.value === 'Other' ? '#000000' : getTextColor(colorOption.value),
                                    // Special handling for different color types
                                    background: colorOption.value === 'Other' 
                                      ? 'linear-gradient(45deg, #f3f4f6, #f3f4f6 2px, #e5e7eb 2px, #e5e7eb 4px)' 
                                      : colorOption.value === 'CMYK Combined'
                                        ? 'linear-gradient(45deg, #00FFFF 0%, #FF00FF 25%, #FFFF00 50%, #000000 75%, #00FFFF 100%)'
                                        : colorOption.color,
                                    // Add border for all colors for better definition
                                    borderColor: colorOption.value === 'White' ? '#d1d5db' : 'rgba(0,0,0,0.1)',
                                    // Add text shadow for better readability on similar colors
                                    textShadow: colorOption.value === 'Yellow' || colorOption.value === 'Cyan' || colorOption.value === 'CMYK Combined' ? '0 0 2px rgba(0,0,0,0.8)' : 'none'
                                  }}
                                >
                                  {colorOption.label}
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Custom Colors */}
                      <div className="mt-6">
                        <p className="text-base font-semibold text-gray-700 mb-2">Custom Colors</p>
                        <p className="text-sm text-gray-600 mb-4">Add any specific colors not listed above:</p>
                        
                        {formData.specifications.customColors.map((color, index) => {
                          // Determine text color for custom colors
                          const getCustomTextColor = (colorName) => {
                            if (!colorName || colorName.trim() === '') return '#000000';
                            const darkColorNames = ['black', 'blue', 'red', 'green', 'navy', 'maroon', 'purple', 'brown'];
                            return darkColorNames.some(dark => colorName.toLowerCase().includes(dark)) ? '#ffffff' : '#000000';
                          };

                          return (
                            <div key={index} className="flex mt-3 items-center">
                              <input
                                type="text"
                                value={color}
                                onChange={(e) => handleCustomColorChange(index, e.target.value)}
                                placeholder="Enter custom color"
                                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full text-base rounded-full px-4 py-3 font-medium border"
                                style={{
                                  backgroundColor: color.trim() !== '' ? getColorForCustomColor(color) : '#ffffff',
                                  color: getCustomTextColor(color),
                                  borderColor: color.trim() !== '' ? 'rgba(0,0,0,0.2)' : '#d1d5db',
                                  textShadow: color.trim() !== '' && (color.toLowerCase().includes('yellow') || color.toLowerCase().includes('cyan') || color.toLowerCase().includes('lime')) ? '0 0 2px rgba(0,0,0,0.5)' : 'none'
                                }}
                              />
                                <button
                                  type="button"
                                  onClick={() => removeCustomColorField(index)}
                                  className="ml-3 inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                  <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                                </button>
                              </div>
                            );
                          })}
                        
                        <button
                          type="button"
                          onClick={addCustomColorField}
                          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          + Add Custom Color
                        </button>
                      </div>
                    </div>
                  </fieldset>
                </div>
                
                <div className="sm:col-span-6">
                  <label htmlFor="additionalDetails" className="block text-base font-semibold text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <div className="mt-2">
                    <textarea
                      id="additionalDetails"
                      name="specifications.additionalDetails"
                      rows={4}
                      value={formData.specifications.additionalDetails}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full text-base border-gray-300 rounded-md px-4 py-3"
                      placeholder="Any additional details or special instructions..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Price Estimation */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-6 py-6 sm:px-8">
              <h3 className="text-xl leading-7 font-semibold text-gray-900">Estimated Price</h3>
              <p className="mt-2 max-w-2xl text-base text-gray-600">
                Based on your specifications, the estimated price for this order is:
              </p>
            </div>
            <div className="border-t border-gray-200 px-6 py-8 sm:p-8">
              <div className="text-center">
                <span className="text-4xl font-bold text-gray-900">${estimatedPrice}</span>
                <p className="mt-4 text-base text-gray-600">
                  This is an estimate based on the dimensions, colors, and material you've selected.
                </p>
                <p className="mt-4 text-base text-gray-600">
                  Final pricing may vary based on additional factors.
                </p>
                <div className="mt-6 text-sm text-gray-500 text-left">
       
                </div>
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="pt-8">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/client/orders')}
                className="bg-white py-3 px-6 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Order'}
              </button>
            </div>
          </div>
          
        </div>
      </form>

      {/* Info Section */}
      <div className="mt-10 bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
        <p className="font-medium text-gray-700">What happens next?</p>
        <ol className="mt-2 list-decimal list-inside space-y-1">
          <li>Your order will be reviewed by our team.</li>
          <li>We'll process your request and estimate delivery times.</li>
          <li>You can check the status of your order in the Orders page.</li>
          <li>You can upload reference files in the order details page after submission.</li>
        </ol>
      </div>
    </div>
  );
};

export default NewOrder;