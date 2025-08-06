import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import {
  SwatchIcon,
  PaintBrushIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  ClockIcon,
  CpuChipIcon,
  ArrowDownTrayIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  PhotoIcon,
  CursorArrowRaysIcon,
  PaperClipIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const TemplateCustomize = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [template, setTemplate] = useState(null);
  const [customizationOptions, setCustomizationOptions] = useState(null);
  const [customizations, setCustomizations] = useState({});
  const [selectedColorScheme, setSelectedColorScheme] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedElement, setSelectedElement] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);
  const [uploadedImages, setUploadedImages] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Order assignment states
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [showOrderAssignment, setShowOrderAssignment] = useState(false);
  const [isSubmittingToOrder, setIsSubmittingToOrder] = useState(false);

  useEffect(() => {
    fetchCustomizationOptions();
    fetchAssignedOrders();
  }, [templateId]);

  useEffect(() => {
    if (customizationOptions) {
      drawCanvas();
    }
  }, [customizations, customizationOptions, canvasScale, uploadedImages]);

  const fetchCustomizationOptions = async () => {
    try {
      const [templateResponse, customizationResponse] = await Promise.all([
        api.get(`/api/templates/${templateId}`),
        api.get(`/api/templates/${templateId}/customize`)
      ]);
      
      setTemplate(templateResponse.data);
      setCustomizationOptions(customizationResponse.data);
      
      // Initialize customizations with default values
      const initialCustomizations = {};
      if (customizationResponse.data?.elements && Array.isArray(customizationResponse.data.elements)) {
        customizationResponse.data.elements.forEach(element => {
          // Filter out character/mascot elements
          if (!element.label.toLowerCase().includes('character') && 
              !element.label.toLowerCase().includes('mascot')) {
            initialCustomizations[element.elementId] = element.defaultValue || '';
          }
        });
      }
      setCustomizations(initialCustomizations);
      
      // Set default color scheme if available
      if (customizationResponse.data?.colorSchemes && Array.isArray(customizationResponse.data.colorSchemes)) {
        const defaultScheme = customizationResponse.data.colorSchemes.find(scheme => scheme.isDefault);
        if (defaultScheme) {
          setSelectedColorScheme(defaultScheme.name);
        }
      }
    } catch (error) {
      console.error('Error fetching customization options:', error);
      toast.error('Failed to load template customization options');
      navigate('/employee/templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedOrders = async () => {
    try {
      const response = await api.get('/api/orders');
      // Filter orders that are not completed and are assigned to current user
      const activeOrders = response.data.orders?.filter(order => 
        !['Completed', 'Delivered', 'Cancelled'].includes(order.status)
      ) || [];
      setAssignedOrders(activeOrders);
    } catch (error) {
      console.error('Error fetching assigned orders:', error);
    }
  };

  const submitTemplateToOrder = async () => {
    if (!selectedOrderId) {
      toast.error('Please select an order to submit to');
      return;
    }

    try {
      setIsSubmittingToOrder(true);

      // Create a design submission with the customized template
      const designData = {
        templateId: template._id,
        customizations,
        uploadedImages: Object.keys(uploadedImages).reduce((acc, key) => {
          // Convert image data to base64 for submission
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = uploadedImages[key].image;
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          acc[key] = {
            dataUrl: canvas.toDataURL('image/png'),
            position: {
              x: uploadedImages[key].x,
              y: uploadedImages[key].y
            }
          };
          return acc;
        }, {}),
        notes: `Template "${template.name}" customized and submitted by employee`
      };

      // Submit to order
      const response = await api.post(`/api/orders/${selectedOrderId}/submit-design`, designData);
      
      toast.success('Template successfully submitted to order!');
      setShowOrderAssignment(false);
      setSelectedOrderId('');
      
      // Optionally navigate to the order
      navigate(`/employee/orders/${selectedOrderId}`);
      
    } catch (error) {
      console.error('Error submitting template to order:', error);
      toast.error('Failed to submit template to order');
    } finally {
      setIsSubmittingToOrder(false);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !customizationOptions) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = customizationOptions.flexoSpecs.standardDimensions;
    
    // Scale the canvas to fit the preview area
    const maxWidth = 500;
    const maxHeight = 600;
    const scaleX = maxWidth / width;
    const scaleY = maxHeight / height;
    const scale = Math.min(scaleX, scaleY, 3); // Increased max scale for better detail
    
    setCanvasScale(scale);
    canvas.width = width * scale;
    canvas.height = height * scale;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw package shape based on template type
    drawPackageShape(ctx, template.subCategory, scale);
    
    // Draw elements
    customizationOptions.elements?.forEach(element => {
      if (element.label.toLowerCase().includes('character') || 
          element.label.toLowerCase().includes('mascot')) {
        return; // Skip character/mascot elements
      }
      
      const value = customizations[element.elementId];
      if (!value && element.elementType !== 'image') return;
      
      const x = (element.constraints?.position?.x || 50) * scale;
      const y = (element.constraints?.position?.y || 50) * scale;
      
      ctx.save();
      
      switch (element.elementType) {
        case 'text':
          drawTextElement(ctx, element, value, x, y, scale);
          break;
        case 'color':
          drawColorElement(ctx, element, value, x, y, scale);
          break;
        case 'logo':
          drawLogoElement(ctx, element, value, x, y, scale);
          break;
        case 'image':
          drawImageElement(ctx, element, x, y, scale);
          break;
      }
      
      // Draw selection border if selected
      if (selectedElement === element.elementId) {
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        const elementWidth = element.elementType === 'image' ? 100 * scale : 120 * scale;
        const elementHeight = element.elementType === 'image' ? 80 * scale : 30 * scale;
        ctx.strokeRect(x - 5, y - 5, elementWidth + 10, elementHeight + 10);
        ctx.setLineDash([]);
      }
      
      ctx.restore();
    });
  };

  const drawPackageShape = (ctx, subCategory, scale) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    ctx.save();
    
    switch (subCategory) {
      case 'Rice Package':
        drawRicePackageShape(ctx, width, height, scale);
        break;
      case 'Juice Pouch':
        drawJuicePouchShape(ctx, width, height, scale);
        break;
      case 'Coffee Package':
        drawCoffeePackageShape(ctx, width, height, scale);
        break;
      case 'Tea Package':
        drawTeaPackageShape(ctx, width, height, scale);
        break;
      default:
        // Default rectangle
        ctx.fillStyle = customizations['background-color'] || '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, width, height);
    }
    
    ctx.restore();
  };



  const drawRicePackageShape = (ctx, width, height, scale) => {
    const bgColor = customizations['background-color'] || '#FFFFFF';
    const mainColor = customizations['main-color'] || '#D35400';
    
    // Main package
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    // Traditional border pattern
    ctx.fillStyle = mainColor;
    ctx.fillRect(0, 0, width, height * 0.08);
    ctx.fillRect(0, height * 0.92, width, height * 0.08);
    ctx.fillRect(0, 0, width * 0.05, height);
    ctx.fillRect(width * 0.95, 0, width * 0.05, height);
    
    // Central panel
    ctx.fillStyle = adjustBrightness(bgColor, 3);
    ctx.fillRect(width * 0.08, height * 0.12, width * 0.84, height * 0.76);
    
    // Decorative corners
    ctx.fillStyle = adjustBrightness(mainColor, -20);
    drawCornerDecorations(ctx, width, height, scale);
    
    // Outline
    ctx.strokeStyle = '#2D3748';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);
  };

  const drawJuicePouchShape = (ctx, width, height, scale) => {
    const bgColor = customizations['background-color'] || '#FFFFFF';
    const mainColor = customizations['main-color'] || '#FF8C00';
    
    // Pouch shape (rounded)
    const radius = width * 0.1;
    ctx.fillStyle = bgColor;
    drawRoundedRect(ctx, 0, 0, width, height, radius);
    
    // Top seal area
    ctx.fillStyle = adjustBrightness(bgColor, -8);
    drawRoundedRect(ctx, width * 0.1, 0, width * 0.8, height * 0.15, radius * 0.5);
    
    // Brand area
    ctx.fillStyle = mainColor;
    drawRoundedRect(ctx, width * 0.15, height * 0.2, width * 0.7, height * 0.25, radius * 0.3);
    
    // Outline
    ctx.strokeStyle = '#2D3748';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, 0, 0, width, height, radius, true);
  };

  const drawCoffeePackageShape = (ctx, width, height, scale) => {
    const bgColor = customizations['background-color'] || '#FFFFFF';
    const brandColor = customizations['brand-color'] || '#8B4513';
    
    // Main package
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    // Coffee bean pattern background
    ctx.fillStyle = adjustBrightness(bgColor, -3);
    drawCoffeeBeanPattern(ctx, width, height);
    
    // Central label area
    ctx.fillStyle = brandColor;
    drawRoundedRect(ctx, width * 0.1, height * 0.25, width * 0.8, height * 0.5, 10);
    
    // Premium border
    ctx.strokeStyle = adjustBrightness(brandColor, -30);
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, width * 0.08, height * 0.23, width * 0.84, height * 0.54, 12, true);
    
    // Package outline
    ctx.strokeStyle = '#2D3748';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);
  };

  const drawTeaPackageShape = (ctx, width, height, scale) => {
    const bgColor = customizations['background-color'] || '#FFFFFF';
    const elegantColor = customizations['elegant-color'] || '#2E8B57';
    
    // Main package
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    // Elegant border frame
    ctx.fillStyle = elegantColor;
    ctx.fillRect(width * 0.05, height * 0.05, width * 0.9, height * 0.08);
    ctx.fillRect(width * 0.05, height * 0.87, width * 0.9, height * 0.08);
    ctx.fillRect(width * 0.05, height * 0.05, width * 0.08, height * 0.9);
    ctx.fillRect(width * 0.87, height * 0.05, width * 0.08, height * 0.9);
    
    // Inner decorative frame
    ctx.strokeStyle = adjustBrightness(elegantColor, -20);
    ctx.lineWidth = 1;
    ctx.strokeRect(width * 0.15, height * 0.15, width * 0.7, height * 0.7);
    
    // Tea leaf pattern
    ctx.fillStyle = adjustBrightness(elegantColor, 40);
    drawTeaLeafPattern(ctx, width, height);
    
    // Main outline
    ctx.strokeStyle = '#2D3748';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);
  };

  // Helper drawing functions
  const drawRoundedRect = (ctx, x, y, width, height, radius, strokeOnly = false) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    
    if (strokeOnly) {
      ctx.stroke();
    } else {
      ctx.fill();
    }
  };

  const drawCornerDecorations = (ctx, width, height, scale) => {
    const size = Math.min(width, height) * 0.06;
    // Top-left corner
    ctx.fillRect(width * 0.08, height * 0.12, size, size);
    // Top-right corner
    ctx.fillRect(width * 0.84, height * 0.12, size, size);
    // Bottom-left corner
    ctx.fillRect(width * 0.08, height * 0.8, size, size);
    // Bottom-right corner
    ctx.fillRect(width * 0.84, height * 0.8, size, size);
  };

  const drawCoffeeBeanPattern = (ctx, width, height) => {
    // Simple coffee bean dots pattern
    const dotSize = 3;
    for (let x = width * 0.15; x < width * 0.85; x += 20) {
      for (let y = height * 0.15; y < height * 0.85; y += 20) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const drawTeaLeafPattern = (ctx, width, height) => {
    // Simple leaf shapes
    const leafWidth = 8;
    const leafHeight = 12;
    for (let x = width * 0.2; x < width * 0.8; x += 25) {
      for (let y = height * 0.2; y < height * 0.8; y += 30) {
        ctx.beginPath();
        ctx.ellipse(x, y, leafWidth/2, leafHeight/2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const adjustBrightness = (hex, percent) => {
    // Convert hex to RGB
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;
    
    let r = parseInt(result[1], 16);
    let g = parseInt(result[2], 16);
    let b = parseInt(result[3], 16);
    
    // Adjust brightness
    r = Math.max(0, Math.min(255, r + (r * percent / 100)));
    g = Math.max(0, Math.min(255, g + (g * percent / 100)));
    b = Math.max(0, Math.min(255, b + (b * percent / 100)));
    
    // Convert back to hex
    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
  };

  const drawTextElement = (ctx, element, text, x, y, scale) => {
    // Calculate better font size based on package dimensions and scale
    const maxFontSize = element.constraints?.fontSize?.max || 16;
    const minFontSize = element.constraints?.fontSize?.min || 10;
    const baseFontSize = Math.min(maxFontSize, 14); // Reduced maximum base font size
    const fontSize = Math.max(minFontSize, baseFontSize * scale * 0.8); // Further reduced with 0.8 multiplier
    
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Calculate text width to ensure it fits
    const textWidth = ctx.measureText(text).width;
    const availableWidth = (customizationOptions?.flexoSpecs.standardDimensions?.width || 100) * scale * 0.8; // 80% of package width
    
    // If text is too wide, reduce font size further
    let adjustedFontSize = fontSize;
    if (textWidth > availableWidth) {
      adjustedFontSize = fontSize * (availableWidth / textWidth) * 0.9; // Leave 10% margin
      ctx.font = `bold ${adjustedFontSize}px Arial, sans-serif`;
    }
    
    // Center the text properly within package bounds
    const packageWidth = (customizationOptions?.flexoSpecs.standardDimensions?.width || 100) * scale;
    const centerX = packageWidth / 2;
    const centerY = y + (15 * scale); // Offset for proper vertical centering
    
    // Draw text with outline for better visibility
    ctx.strokeStyle = '#2D3748';
    ctx.lineWidth = Math.max(1, adjustedFontSize * 0.08); // Proportional outline width
    ctx.fillStyle = '#FFFFFF';
    
    // Draw outline first, then fill
    ctx.strokeText(text, centerX, centerY);
    ctx.fillText(text, centerX, centerY);
  };

  const drawColorElement = (ctx, element, color, x, y, scale) => {
    // This is now integrated into the package shape itself
    // We don't draw separate color elements as they're part of the design
  };

  const drawLogoElement = (ctx, element, text, x, y, scale) => {
    const width = 100 * scale;
    const height = 60 * scale;
    
    // Draw logo area with elegant styling
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    drawRoundedRect(ctx, x, y, width, height, 8);
    
    ctx.strokeStyle = '#CBD5E0';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, x, y, width, height, 8, true);
    
    // Draw logo text
    ctx.fillStyle = '#4A5568';
    ctx.font = `${14 * scale}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + width / 2, y + height / 2);
  };

  const drawImageElement = (ctx, element, x, y, scale) => {
    const imageData = uploadedImages[element.elementId];
    if (!imageData) {
      // No placeholder drawn - clean appearance before photo upload
      return;
    }
    
    // Draw the uploaded image
    const img = imageData.image;
    const imgX = imageData.x || x;
    const imgY = imageData.y || y;
    const imgWidth = 100 * scale;
    const imgHeight = 80 * scale;
    
    ctx.save();
    // Clip to rounded rectangle
    drawRoundedRect(ctx, imgX, imgY, imgWidth, imgHeight, 8);
    ctx.clip();
    
    // Draw image
    ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
    ctx.restore();
    
  };

  // Rest of the component methods remain the same but I'll add image handling
  const handleImageUpload = (elementId, event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setUploadedImages(prev => ({
          ...prev,
          [elementId]: {
            image: img,
            x: null, // Will use default position
            y: null,
            file: file
          }
        }));
        toast.success('Image uploaded successfully!');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleCanvasMouseDown = (event) => {
    const canvas = canvasRef.current;
    if (!canvas || !customizationOptions) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / canvasScale;
    const y = (event.clientY - rect.top) / canvasScale;
    
    // Check for image elements that can be dragged
    let clickedElement = null;
    let isImageElement = false;
    
    customizationOptions.elements?.forEach(element => {
      if (element.label.toLowerCase().includes('character') || 
          element.label.toLowerCase().includes('mascot')) {
        return;
      }
      
      const elementX = element.constraints?.position?.x || 50;
      const elementY = element.constraints?.position?.y || 50;
      const elementWidth = element.elementType === 'image' ? 100 : 120;
      const elementHeight = element.elementType === 'image' ? 80 : 30;
      
      if (x >= elementX && x <= elementX + elementWidth && 
          y >= elementY && y <= elementY + elementHeight) {
        clickedElement = element.elementId;
        if (element.elementType === 'image' && uploadedImages[element.elementId]) {
          isImageElement = true;
          setIsDragging(true);
          setDragOffset({
            x: x - (uploadedImages[element.elementId].x || elementX),
            y: y - (uploadedImages[element.elementId].y || elementY)
          });
        }
      }
    });
    
    setSelectedElement(clickedElement);
    
    // Handle image upload click
    if (clickedElement && !isImageElement) {
      const element = customizationOptions.elements.find(e => e.elementId === clickedElement);
      if (element?.elementType === 'image') {
        fileInputRef.current?.click();
      }
    }
  };

  const handleCanvasMouseMove = (event) => {
    if (!isDragging || !selectedElement) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / canvasScale;
    const y = (event.clientY - rect.top) / canvasScale;
    
    setUploadedImages(prev => ({
      ...prev,
      [selectedElement]: {
        ...prev[selectedElement],
        x: x - dragOffset.x,
        y: y - dragOffset.y
      }
    }));
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  const downloadCanvasAsImage = (format = 'png') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `${template.name.replace(/\s+/g, '-').toLowerCase()}-design.${format}`;
    link.href = canvas.toDataURL(`image/${format}`, 0.9);
    link.click();
    
    toast.success(`Design downloaded as ${format.toUpperCase()}!`);
  };

  const handleCustomizationChange = (elementId, value) => {
    setCustomizations(prev => ({
      ...prev,
      [elementId]: value
    }));
  };

  const applyColorScheme = (schemeName) => {
    setSelectedColorScheme(schemeName);
    if (!customizationOptions?.colorSchemes) return;
    
    const scheme = customizationOptions.colorSchemes.find(s => s.name === schemeName);
    if (scheme && customizationOptions?.elements && Array.isArray(customizationOptions.elements)) {
      const newCustomizations = { ...customizations };
      
      // Apply color scheme to color elements
      customizationOptions.elements.forEach(element => {
        if (element.elementType === 'color') {
          const colorForElement = scheme.colors?.find(color => 
            color.application === element.label.toLowerCase() || 
            color.name.toLowerCase().includes(element.label.toLowerCase())
          );
          if (colorForElement) {
            newCustomizations[element.elementId] = colorForElement.hex;
          }
        }
      });
      
      setCustomizations(newCustomizations);
      toast.success(`Applied ${schemeName} color scheme`);
    }
  };

  const getFilteredElements = () => {
    if (!customizationOptions?.elements) return [];
    return customizationOptions.elements.filter(element => 
      !element.label.toLowerCase().includes('character') && 
      !element.label.toLowerCase().includes('mascot')
    );
  };

  const renderCustomizationElement = (element) => {
    const isSelected = selectedElement === element.elementId;
    
    switch (element.elementType) {
      case 'text':
        return (
          <div key={element.elementId} className={`space-y-3 p-4 rounded-lg border-2 transition-colors ${
            isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-2">
              <DocumentTextIcon className="h-5 w-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">
                {element.label}
              </label>
              {isSelected && <span className="text-xs text-blue-600 font-medium">SELECTED</span>}
            </div>
            <input
              type="text"
              value={customizations[element.elementId] || ''}
              onChange={(e) => handleCustomizationChange(element.elementId, e.target.value)}
              maxLength={element.constraints?.maxLength}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              placeholder={`Enter ${element.label.toLowerCase()}`}
            />
            {element.constraints?.maxLength && (
              <p className="text-xs text-gray-500">
                {(customizations[element.elementId] || '').length}/{element.constraints.maxLength} characters
              </p>
            )}
          </div>
        );

      case 'color':
        return (
          <div key={element.elementId} className={`space-y-3 p-4 rounded-lg border-2 transition-colors ${
            isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-2">
              <SwatchIcon className="h-5 w-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">
                {element.label}
              </label>
              {isSelected && <span className="text-xs text-blue-600 font-medium">SELECTED</span>}
            </div>
            
            <div className="flex items-center space-x-3">
              <div
                className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition-colors shadow-sm"
                style={{ backgroundColor: customizations[element.elementId] || '#ffffff' }}
                onClick={() => setShowColorPicker(element.elementId)}
              />
              
              <input
                type="text"
                value={customizations[element.elementId] || ''}
                onChange={(e) => handleCustomizationChange(element.elementId, e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                placeholder="#000000"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>

            {/* Color Options */}
            {element.colorOptions && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {element.colorOptions.map((colorOption, index) => (
                  <button
                    key={index}
                    className="relative group"
                    onClick={() => handleCustomizationChange(element.elementId, colorOption.hex)}
                    title={`${colorOption.name}${colorOption.pantone ? ` (${colorOption.pantone})` : ''}`}
                  >
                    <div
                      className="w-10 h-10 rounded-md border border-gray-300 hover:scale-110 transition-transform shadow-sm"
                      style={{ backgroundColor: colorOption.hex }}
                    />
                    {customizations[element.elementId] === colorOption.hex && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Color Picker */}
            {showColorPicker === element.elementId && (
              <div className="mt-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Custom Color</label>
                  <button
                    onClick={() => setShowColorPicker(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
                <input
                  type="color"
                  value={customizations[element.elementId] || '#ffffff'}
                  onChange={(e) => handleCustomizationChange(element.elementId, e.target.value)}
                  className="w-full h-20 border border-gray-300 rounded-md cursor-pointer"
                />
              </div>
            )}
          </div>
        );

      case 'image':
        const hasImage = uploadedImages[element.elementId];
        return (
          <div key={element.elementId} className={`space-y-3 p-4 rounded-lg border-2 transition-colors ${
            isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-2">
              <PhotoIcon className="h-5 w-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">
                {element.label}
              </label>
              {isSelected && <span className="text-xs text-blue-600 font-medium">SELECTED</span>}
            </div>
            
            <div className="space-y-3">
              {hasImage ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <PhotoIcon className="h-4 w-4" />
                    <span>{uploadedImages[element.elementId].file.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <CursorArrowRaysIcon className="h-3 w-3" />
                    <span>Drag the image on the canvas to reposition</span>
                  </div>
                  <button
                    onClick={() => {
                      setUploadedImages(prev => {
                        const newImages = { ...prev };
                        delete newImages[element.elementId];
                        return newImages;
                      });
                    }}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSelectedElement(element.elementId);
                    fileInputRef.current?.click();
                  }}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
                >
                  <PhotoIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <span className="text-sm font-medium text-gray-700">Upload Image</span>
                  <p className="text-xs text-gray-500 mt-1">Click to select an image file</p>
                </button>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div key={element.elementId} className={`space-y-3 p-4 rounded-lg border-2 transition-colors ${
            isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-2">
              <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">
                {element.label}
              </label>
              {isSelected && <span className="text-xs text-blue-600 font-medium">SELECTED</span>}
            </div>
            <input
              type="text"
              value={customizations[element.elementId] || ''}
              onChange={(e) => handleCustomizationChange(element.elementId, e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              placeholder={`Enter ${element.label.toLowerCase()}`}
            />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!template || !customizationOptions) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-xl font-semibold text-gray-900">Template not found</h1>
          <Link
            to="/employee/templates"
            className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-800"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Templates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hidden file input for image uploads */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => selectedElement && handleImageUpload(selectedElement, e)}
          className="hidden"
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              to="/employee/templates"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Templates
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Professional Package Designer
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {template.name} • {template.category} • Realistic Design
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            
            
            
            {/* Download Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => downloadCanvasAsImage('png')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                PNG
              </button>
              <button
                onClick={() => downloadCanvasAsImage('jpeg')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                JPG
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Interactive Design Preview */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
               Package Design
            </h3>
            <div className="flex justify-center mb-4">
              <div className="border-2 border-gray-300 rounded-lg p-6 bg-gradient-to-br from-gray-50 to-gray-100">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  className="cursor-pointer border border-gray-200 rounded bg-white shadow-lg"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </div>
            </div>
            <div className="space-y-2 text-xs text-gray-600">
              <p className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Click on elements to select them
              </p>
              <p className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Drag uploaded images to reposition
              </p>
            </div>
            
            {selectedElement && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  Selected: {getFilteredElements().find(e => e.elementId === selectedElement)?.label}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Use the customization panel to edit this element
                </p>
              </div>
            )}
          </div>

          {/* Customization Panel */}
          <div className="space-y-6">
            {/* Element Customization */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Customize Package Elements
              </h3>
              <div className="space-y-4">
                {getFilteredElements().map(renderCustomizationElement)}
              </div>
            </div>
          </div>
        </div>

        {/* Order Assignment Modal */}
        {showOrderAssignment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Submit Template to Order</h3>
                  <button
                    onClick={() => setShowOrderAssignment(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Order
                  </label>
                  <select
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Choose an order...</option>
                    {assignedOrders.map((order) => (
                      <option key={order._id} value={order._id}>
                        #{order.orderNumber} - {order.title} ({order.status})
                      </option>
                    ))}
                  </select>
                </div>

                {assignedOrders.length === 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      No active orders assigned to you. Contact your manager to get orders assigned.
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-500 mb-4">
                  This will submit your customized template design to the selected order for client review.
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowOrderAssignment(false)}
                    disabled={isSubmittingToOrder}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitTemplateToOrder}
                    disabled={isSubmittingToOrder || !selectedOrderId}
                    className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 flex items-center"
                  >
                    {isSubmittingToOrder ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Submit Template
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateCustomize; 