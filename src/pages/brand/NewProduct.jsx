import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { normalizeImageUrl } from '../../lib/imageUtils.js';

export default function NewProduct() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: 'mens',
    subCategory: '',
    gender: 'unisex',
    tags: '',
    styleTags: '',
    brandName: '',
    price: '',
    discountPrice: '',
    compareAtPrice: '',
    stockQty: 0,
    sku: '',
    barcode: '',
    slug: '', // SEO-friendly URL slug
    mainImage: '',
    additionalImages: ['', ''],
    colors: '',
    sizes: [],
    fit: '',
    material: '',
    fabricComposition: '',
    occasion: [],
    careInstructions: '',
    pattern: '',
    neckType: '',
    sleeveLength: '',
    season: 'all-season',
    customizable: false,
    designArea: '',
    weight: '',
    dimensions: '',
    deliveryEstimate: '',
    dispatchTimeRange: '',
    shippingTimeEstimate: '',
    returnPolicy: '',
    returnPolicySummary: '',
    returnWindowDays: 7,
    cashOnDeliveryAvailable: true,
    badges: [],
    availabilityStatus: 'in_stock',
    seoTitle: '',
    seoDescription: '',
    status: 'draft',
    // Per-variant data
    variantData: {} // { 'color-size': { stock, price, sku, image } }
  });

  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

  const categories = [
    { value: 'mens', label: "Men's Fashion" },
    { value: 'womens', label: "Women's Fashion" },
    
    { value: 'accessories', label: "Accessories" }
  ];

  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      
      // Auto-generate slug from title
      if (name === 'title' && value) {
        newData.slug = generateSlug(value);
      }
      
      // Clear sizes when switching to accessories
      if (name === 'category' && value === 'accessories') {
        newData.sizes = [];
      }
      
      return newData;
    });
  };

  const handleSizeChange = (size) => {
    setFormData(prev => {
      const newSizes = prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size];
      
      // Update variant data when sizes change
      const colors = prev.colors ? prev.colors.split(',').map(c => c.trim()).filter(Boolean) : [];
      const newVariantData = { ...prev.variantData };
      
      if (newSizes.includes(size)) {
        // Add variants for this size
        colors.forEach(color => {
          const key = `${color}-${size}`;
          if (!newVariantData[key]) {
            newVariantData[key] = {
              stock: prev.stockQty || 0,
              price: prev.price || '',
              sku: prev.sku ? `${prev.sku}-${size}-${color}` : '',
              image: ''
            };
          }
        });
      } else {
        // Remove variants for this size
        colors.forEach(color => {
          const key = `${color}-${size}`;
          delete newVariantData[key];
        });
      }
      
      return { ...prev, sizes: newSizes, variantData: newVariantData };
    });
  };

  const handleColorChange = (e) => {
    const colors = e.target.value.split(',').map(c => c.trim()).filter(Boolean);
    setFormData(prev => {
      const newVariantData = { ...prev.variantData };
      const sizes = prev.sizes;
      
      // Remove old color variants
      Object.keys(newVariantData).forEach(key => {
        const [color] = key.split('-');
        if (!colors.includes(color)) {
          delete newVariantData[key];
        }
      });
      
      // Add new color variants
      colors.forEach(color => {
        sizes.forEach(size => {
          const key = `${color}-${size}`;
          if (!newVariantData[key]) {
            newVariantData[key] = {
              stock: prev.stockQty || 0,
              price: prev.price || '',
              sku: prev.sku ? `${prev.sku}-${size}-${color}` : '',
              image: ''
            };
          }
        });
      });
      
      return { ...prev, colors: e.target.value, variantData: newVariantData };
    });
  };

  const handleVariantFieldChange = (variantKey, field, value) => {
    setFormData(prev => ({
      ...prev,
      variantData: {
        ...prev.variantData,
        [variantKey]: {
          ...prev.variantData[variantKey],
          [field]: value
        }
      }
    }));
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };
  
  const handleImageUpload = async (e, type, index) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setSubmitStatus({ type: 'error', message: 'Image size must be less than 5MB' });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSubmitStatus({ type: 'error', message: 'Please upload a valid image file' });
      return;
    }

    try {
      setUploading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('images', file);

      // Upload to server - use proxy in dev, or API_BASE_URL if set
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      const uploadUrl = API_BASE_URL 
        ? `${API_BASE_URL}/api/uploads/products`
        : '/api/uploads/products'; // Use Vite proxy in development
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || 'Image upload failed');
      }

      const data = await response.json();
      const uploadedFile = data.files[0];
      
      // Construct proper image URL using utility function
      // This ensures relative paths work with Vite proxy and avoid CORS issues
      const imageUrl = normalizeImageUrl(uploadedFile.url);
      
      console.log('Uploaded image URL:', imageUrl); // Debug log

      // Update form data with uploaded image URL
      setFormData(prev => {
        if (type === 'mainImage') {
          return { ...prev, mainImage: imageUrl };
        }
        if (type === 'additional') {
          const updated = [...prev.additionalImages];
          if (typeof index === 'number' && index >= 0 && index < updated.length) {
            updated[index] = imageUrl;
          }
          return { ...prev, additionalImages: updated };
        }
        return prev;
      });
    } catch (error) {
      console.error('Image upload error:', error);
      setSubmitStatus({ type: 'error', message: error.message || 'Failed to upload image' });
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Basic Information
    if (!formData.title.trim()) newErrors.title = 'Product title is required';
    if (formData.title.length > 200) newErrors.title = 'Title must be less than 200 characters';
    if (formData.subtitle && formData.subtitle.length > 100) 
      newErrors.subtitle = 'Subtitle must be less than 100 characters';
    if (!formData.description || formData.description.length < 10) 
      newErrors.description = 'Description must be at least 10 characters';
    if (formData.description.length > 5000) 
      newErrors.description = 'Description must be less than 5000 characters';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (formData.subCategory && formData.subCategory.length > 100) 
      newErrors.subCategory = 'Sub-category must be less than 100 characters';
    if (formData.brandName && formData.brandName.length > 100) 
      newErrors.brandName = 'Brand name must be less than 100 characters';
    
    // Pricing & Stock
    if (!formData.price || parseFloat(formData.price) <= 0) 
      newErrors.price = 'Price must be greater than 0';
    if (formData.price && parseFloat(formData.price) > 1000000) 
      newErrors.price = 'Price must be less than ₹10,00,000';
    if (formData.compareAtPrice && parseFloat(formData.compareAtPrice) <= 0)
      newErrors.compareAtPrice = 'Compare at price must be greater than 0';
    if (formData.compareAtPrice && parseFloat(formData.compareAtPrice) < parseFloat(formData.price || 0))
      newErrors.compareAtPrice = 'Compare at price must be greater than or equal to selling price';
    if (formData.discountPrice && parseFloat(formData.discountPrice) > parseFloat(formData.price || 0))
      newErrors.discountPrice = 'Discount price cannot be greater than regular price';
    if (formData.discountPrice && parseFloat(formData.discountPrice) <= 0)
      newErrors.discountPrice = 'Discount price must be greater than 0';
    if (formData.stockQty < 0) 
      newErrors.stockQty = 'Stock quantity cannot be negative';
    if (formData.stockQty > 100000) 
      newErrors.stockQty = 'Stock quantity must be less than 100,000';
    if (formData.sku && formData.sku.length > 50) 
      newErrors.sku = 'SKU must be less than 50 characters';
    if (formData.barcode && !/^\d{8,14}$/.test(formData.barcode))
      newErrors.barcode = 'Barcode must be 8-14 digits';
    
    // Variants validation
    if (formData.variantData && Object.keys(formData.variantData).length > 0) {
      Object.entries(formData.variantData).forEach(([key, variant]) => {
        if (variant.stock !== undefined && variant.stock < 0) {
          newErrors[`variant_${key}_stock`] = 'Variant stock cannot be negative';
        }
        if (variant.price !== undefined && variant.price <= 0) {
          newErrors[`variant_${key}_price`] = 'Variant price must be greater than 0';
        }
        if (variant.sku && variant.sku.length > 50) {
          newErrors[`variant_${key}_sku`] = 'Variant SKU must be less than 50 characters';
        }
      });
    }
    
    // Shipping
    if (formData.weight && (parseInt(formData.weight) < 0 || parseInt(formData.weight) > 50000))
      newErrors.weight = 'Weight must be between 0 and 50,000 grams';
    if (formData.dimensions && formData.dimensions.length > 100)
      newErrors.dimensions = 'Dimensions must be less than 100 characters';
    if (formData.deliveryEstimate && formData.deliveryEstimate.length > 100)
      newErrors.deliveryEstimate = 'Delivery estimate must be less than 100 characters';
    if (formData.dispatchTimeRange && formData.dispatchTimeRange.length > 100)
      newErrors.dispatchTimeRange = 'Dispatch time range must be less than 100 characters';
    if (formData.shippingTimeEstimate && formData.shippingTimeEstimate.length > 100)
      newErrors.shippingTimeEstimate = 'Shipping time estimate must be less than 100 characters';
    if (formData.returnWindowDays && (parseInt(formData.returnWindowDays) < 0 || parseInt(formData.returnWindowDays) > 365))
      newErrors.returnWindowDays = 'Return window must be between 0 and 365 days';
    if (formData.returnPolicy && formData.returnPolicy.length > 2000)
      newErrors.returnPolicy = 'Return policy must be less than 2000 characters';
    if (formData.returnPolicySummary && formData.returnPolicySummary.length > 200)
      newErrors.returnPolicySummary = 'Return policy summary must be less than 200 characters';
    
    // SEO
    if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug))
      newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    if (formData.slug && formData.slug.length > 100)
      newErrors.slug = 'Slug must be less than 100 characters';
    if (formData.seoTitle && formData.seoTitle.length > 60)
      newErrors.seoTitle = 'SEO title should be less than 60 characters for best results';
    if (formData.seoDescription && formData.seoDescription.length > 160)
      newErrors.seoDescription = 'SEO description should be less than 160 characters for best results';
    
    // Media
    if (!formData.mainImage) 
      newErrors.mainImage = 'Main image is required';
    
    // Status
    if (!formData.status) newErrors.status = 'Status is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      setSubmitStatus({ type: 'error', message: 'Please log in to create products' });
      setTimeout(() => navigate('/brand/login'), 2000);
      return;
    }

    if (!validateForm()) {
      setSubmitStatus({ type: 'error', message: 'Please fix the errors in the form' });
      return;
    }

    // Check if main image is uploaded
    if (!formData.mainImage) {
      setSubmitStatus({ type: 'error', message: 'Please upload a main image' });
      return;
    }

    const payload = {
      title: formData.title,
      subtitle: formData.subtitle || undefined,
      description: formData.description,
      category: formData.category,
      subCategory: formData.subCategory || undefined,
      gender: formData.gender,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      styleTags: formData.styleTags.split(',').map(t => t.trim()).filter(Boolean),
      brandName: formData.brandName || undefined,
      pricing: {
        price: parseFloat(formData.price),
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null
      },
      inventory: {
        stockQty: parseInt(formData.stockQty, 10),
        sku: formData.sku || undefined,
        barcode: formData.barcode || undefined,
        availabilityStatus: formData.availabilityStatus
      },
      media: {
        mainImage: formData.mainImage,
        galleryImages: formData.additionalImages.filter(Boolean)
      },
      variants: {
        colors: formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(Boolean) : [],
        sizes: formData.sizes,
        material: formData.material || undefined,
        fabricComposition: formData.fabricComposition || undefined,
        fit: formData.fit || undefined,
        pattern: formData.pattern || undefined,
        neckType: formData.neckType || undefined,
        sleeveLength: formData.sleeveLength || undefined,
        season: formData.season,
        occasion: formData.occasion,
        customizable: formData.customizable,
        designArea: formData.customizable ? formData.designArea : undefined
      },
      shipping: {
        weight: formData.weight ? parseInt(formData.weight) : undefined,
        dimensions: formData.dimensions || undefined,
        deliveryEstimateDays: formData.deliveryEstimate || undefined,
        dispatchTimeRange: formData.dispatchTimeRange || undefined,
        shippingTimeEstimate: formData.shippingTimeEstimate || undefined,
        returnPolicy: formData.returnPolicy || undefined,
        returnPolicySummary: formData.returnPolicySummary || undefined,
        returnWindowDays: formData.returnWindowDays || 7,
        cashOnDeliveryAvailable: formData.cashOnDeliveryAvailable
      },
      merchandising: {
        badges: formData.badges,
        careInstructions: formData.careInstructions || undefined
      },
      seo: {
        seoTitle: formData.seoTitle || undefined,
        seoDescription: formData.seoDescription || undefined,
        slug: formData.slug || undefined
      },
      status: formData.status,
      // Pass variantData separately for backend processing
      variantData: Object.keys(formData.variantData || {}).length > 0 ? formData.variantData : undefined
    };
    
    try {
      setSubmitStatus({ type: 'loading', message: 'Submitting product...' });
      
      const response = await api('/api/brand/products', {
        method: 'POST',
        body: payload,
        token
      });

      setSubmitStatus({ 
        type: 'success', 
        message: response.message || 'Product submitted successfully!' 
      });

      // Redirect after successful submission
      setTimeout(() => {
        if (formData.status === 'draft') {
          navigate('/brand/products');
        } else {
          navigate('/brand/products');
        }
      }, 2000);
    } catch (error) {
      console.error('Error submitting product:', error);
      setSubmitStatus({ 
        type: 'error', 
        message: error.message || 'Failed to submit product. Please try again.' 
      });
    }
  };

  return (
    <div className="new-product-container">
      <div className="new-product-card">
        <div className="new-product-form">
          <div className="form-header">
            <h2 className="form-title">Add New Product</h2>
            <p className="form-subtitle">Create a detailed listing for your clothing product</p>
          </div>
          
          {submitStatus.message && (
            <div className={`${submitStatus.type}-message`}>
              <p>{submitStatus.message}</p>
            </div>
          )}

          {/* Section 1: Basic Info */}
          <div className="form-section">
            <h3 className="section-title">Basic Information</h3>
            
            <div className="form-group">
              <label className="form-label">Product Title *</label>
              <input
                type="text"
                name="title"
                className={`form-input ${errors.title ? 'error' : ''}`}
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Premium Cotton T-Shirt"
              />
              {errors.title && <div className="error-text">{errors.title}</div>}
            </div>
            
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                name="description"
                className={`form-textarea ${errors.description ? 'error' : ''}`}
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Detailed description of your product..."
              />
              {errors.description && <div className="error-text">{errors.description}</div>}
            </div>
            
            <div className="form-row">
              <div className="form-group half-width">
                <label className="form-label">Category *</label>
                <select
                  name="category"
                  className={`form-select ${errors.category ? 'error' : ''}`}
                  value={formData.category}
                  onChange={handleChange}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                {errors.category && <div className="error-text">{errors.category}</div>}
              </div>
              
              <div className="form-group half-width">
                <label className="form-label">Tags</label>
                <input
                  type="text"
                  name="tags"
                  className="form-input"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="summer, cotton, streetwear"
                />
                <p className="form-help">Separate with commas. Example: summer, oversized, streetwear</p>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Stock */}
          <div className="form-section">
            <h3 className="section-title">Pricing & Stock</h3>
            
            <div className="form-row">
              <div className="form-group one-third">
                <label className="form-label">Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  className={`form-input ${errors.price ? 'error' : ''}`}
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="999.00"
                />
                {errors.price && <div className="error-text">{errors.price}</div>}
              </div>
              
              <div className="form-group one-third">
                <label className="form-label">Discount Price (₹)</label>
                <input
                  type="number"
                  name="discountPrice"
                  className={`form-input ${errors.discountPrice ? 'error' : ''}`}
                  value={formData.discountPrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="799.00"
                />
                {errors.discountPrice && <div className="error-text">{errors.discountPrice}</div>}
              </div>
              
              <div className="form-group one-third">
                <label className="form-label">Stock Quantity *</label>
                <input
                  type="number"
                  name="stockQty"
                  className={`form-input ${errors.stockQty ? 'error' : ''}`}
                  value={formData.stockQty}
                  onChange={handleChange}
                  min="0"
                  placeholder="100"
                />
                {errors.stockQty && <div className="error-text">{errors.stockQty}</div>}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group half-width">
                <label className="form-label">SKU / Product Code</label>
                <input
                  type="text"
                  name="sku"
                  className="form-input"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="e.g., TSH-001-BLK"
                />
                <p className="form-help">Base SKU (will be appended with size/color for variants)</p>
              </div>
              
              <div className="form-group half-width">
                <label className="form-label">SEO URL Slug</label>
                <input
                  type="text"
                  name="slug"
                  className="form-input"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="auto-generated-from-title"
                />
                <p className="form-help">URL-friendly identifier (auto-generated from title)</p>
              </div>
            </div>
          </div>

          {/* Section 3: Media */}
          <div className="form-section">
            <h3 className="section-title">Media</h3>
            
            <div className="form-group">
              <label className="form-label">Main Image *</label>
              <div className="file-upload-container">
                <input
                  type="file"
                  id="mainImage"
                  name="mainImage"
                  accept="image/*"
                  className="file-input"
                  onChange={(e) => handleImageUpload(e, 'mainImage')}
                  disabled={uploading}
                />
                <label htmlFor="mainImage" className="file-upload-label">
                  <span>{formData.mainImage ? 'Change Image' : 'Choose Main Image'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                </label>
                {formData.mainImage && (
                  <div className="image-preview">
                    <img 
                      src={normalizeImageUrl(formData.mainImage)} 
                      alt="Main preview" 
                      onError={(e) => {
                        // If image fails to load, try with normalized path
                        const img = e.target;
                        const normalized = normalizeImageUrl(formData.mainImage);
                        if (img.src !== normalized && normalized) {
                          img.src = normalized;
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      className="remove-image"
                      onClick={() => setFormData(prev => ({ ...prev, mainImage: '' }))}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              {errors.mainImage && <div className="error-text">{errors.mainImage}</div>}
              <p className="form-help">Recommended size: 800x800px, JPG or PNG, max 5MB</p>
            </div>
            
            <div className="form-group">
              <label className="form-label">Additional Images</label>
              <div className="additional-images">
                {formData.additionalImages.map((image, index) => (
                  <div key={index} className="image-upload-item">
                    {image ? (
                      <div className="image-preview">
                        <img 
                          src={normalizeImageUrl(image)} 
                          alt={`Preview ${index + 1}`}
                          onError={(e) => {
                            // If image fails to load, try with normalized path
                            const img = e.target;
                            const normalized = normalizeImageUrl(image);
                            if (img.src !== normalized && normalized) {
                              img.src = normalized;
                            }
                          }}
                        />
                        <button 
                          type="button"
                          className="remove-image"
                          onClick={() => {
                            const newImages = [...formData.additionalImages];
                            newImages[index] = '';
                            setFormData(prev => ({ ...prev, additionalImages: newImages }));
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="file-upload-container">
                        <input
                          type="file"
                          id={`additionalImage-${index}`}
                          accept="image/*"
                          className="file-input"
                          onChange={(e) => handleImageUpload(e, 'additional', index)}
                          disabled={uploading}
                        />
                        <label 
                          htmlFor={`additionalImage-${index}`} 
                          className="file-upload-label"
                        >
                          <span>Add Image {index + 1}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                        </label>
                      </div>
                    )}
                  </div>
                ))}
                
                {formData.additionalImages.every(img => img) && formData.additionalImages.length < 5 && (
                  <button 
                    type="button" 
                    className="add-more-button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      additionalImages: [...prev.additionalImages, '']
                    }))}
                  >
                    + Add Another Image
                  </button>
                )}
              </div>
              <p className="form-help">Add up to 5 images showing different angles and details</p>
            </div>
          </div>

          {/* Section 4: Variants */}
          <div className="form-section">
            <h3 className="section-title">Product Variants</h3>
            
            <div className="form-row">
              <div className={`form-group ${formData.category === 'accessories' ? 'full-width' : 'half-width'}`}>
                <label className="form-label">Available Colors</label>
                <input
                  type="text"
                  name="colors"
                  className="form-input"
                  value={formData.colors}
                  onChange={handleColorChange}
                  placeholder="e.g., Black, White, Navy"
                />
                <p className="form-help">Separate colors with commas</p>
              </div>
              
              {formData.category !== 'accessories' && (
                <div className="form-group half-width">
                  <label className="form-label">Available Sizes</label>
                  <div className="size-options">
                    {sizeOptions.map(size => (
                      <label key={size} className="size-option">
                        <input
                          type="checkbox"
                          checked={formData.sizes.includes(size)}
                          onChange={() => handleSizeChange(size)}
                        />
                        <span>{size}</span>
                      </label>
                    ))}
                  </div>
                  <p className="form-help">Select all sizes you will sell</p>
                </div>
              )}
            </div>
            
            <div className="form-row">
              <div className="form-group half-width">
                <label className="form-label">Material / Fabric</label>
                <input
                  type="text"
                  name="material"
                  className="form-input"
                  value={formData.material}
                  onChange={handleChange}
                  placeholder="e.g., 100% Cotton"
                />
              </div>
              <div className="form-group half-width">
                <label className="form-label">Fabric Composition</label>
                <input
                  type="text"
                  name="fabricComposition"
                  className="form-input"
                  value={formData.fabricComposition}
                  onChange={handleChange}
                  placeholder="e.g., 60% Cotton, 40% Polyester"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half-width">
                <label className="form-label">Fit</label>
                <select
                  name="fit"
                  className="form-select"
                  value={formData.fit}
                  onChange={handleChange}
                >
                  <option value="">Select fit</option>
                  <option value="oversized">Oversized</option>
                  <option value="regular">Regular</option>
                  <option value="slim">Slim</option>
                  <option value="relaxed">Relaxed</option>
                </select>
              </div>
              <div className="form-group half-width">
                <label className="form-label">Pattern</label>
                <select
                  name="pattern"
                  className="form-select"
                  value={formData.pattern}
                  onChange={handleChange}
                >
                  <option value="">Select pattern</option>
                  <option value="solid">Solid</option>
                  <option value="printed">Printed</option>
                  <option value="striped">Striped</option>
                  <option value="checkered">Checkered</option>
                  <option value="abstract">Abstract</option>
                  <option value="graphic">Graphic</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half-width">
                <label className="form-label">Neck Type</label>
                <select
                  name="neckType"
                  className="form-select"
                  value={formData.neckType}
                  onChange={handleChange}
                >
                  <option value="">Select neck type</option>
                  <option value="round">Round</option>
                  <option value="v-neck">V-Neck</option>
                  <option value="crew">Crew</option>
                  <option value="polo">Polo</option>
                  <option value="hoodie">Hoodie</option>
                </select>
              </div>
              <div className="form-group half-width">
                <label className="form-label">Sleeve Length</label>
                <select
                  name="sleeveLength"
                  className="form-select"
                  value={formData.sleeveLength}
                  onChange={handleChange}
                >
                  <option value="">Select sleeve length</option>
                  <option value="full">Full</option>
                  <option value="half">Half</option>
                  <option value="sleeveless">Sleeveless</option>
                  <option value="three-quarter">3/4</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half-width">
                <label className="form-label">Season</label>
                <select
                  name="season"
                  className="form-select"
                  value={formData.season}
                  onChange={handleChange}
                >
                  <option value="all-season">All Season</option>
                  <option value="summer">Summer</option>
                  <option value="winter">Winter</option>
                  <option value="spring">Spring</option>
                  <option value="autumn">Autumn</option>
                </select>
              </div>
              <div className="form-group half-width">
                <label className="form-label">Occasion</label>
                <input
                  type="text"
                  name="occasion"
                  className="form-input"
                  value={formData.occasion.join(', ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    occasion: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                  placeholder="casual, streetwear, party"
                />
                <p className="form-help">Separate with commas</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Care Instructions</label>
              <textarea
                name="careInstructions"
                className="form-textarea"
                value={formData.careInstructions}
                onChange={handleChange}
                rows="2"
                placeholder="Machine wash cold, tumble dry low..."
              />
            </div>
            
            <div className="form-group">
              <label className="form-label checkbox-label">
                <input
                  type="checkbox"
                  name="customizable"
                  checked={formData.customizable}
                  onChange={handleChange}
                />
                <span>This product can be customized</span>
              </label>
              
              {formData.customizable && (
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Design Area Dimensions</label>
                  <input
                    type="text"
                    name="designArea"
                    className="form-input"
                    value={formData.designArea}
                    onChange={handleChange}
                    placeholder="e.g., 30cm x 30cm"
                  />
                </div>
              )}
            </div>

            {/* Variant Management Table */}
            {formData.sizes.length > 0 && formData.colors && formData.colors.split(',').filter(c => c.trim()).length > 0 && (
              <div className="form-group" style={{ marginTop: '2rem' }}>
                <label className="form-label">Variant Inventory & Pricing</label>
                <p className="form-help" style={{ marginBottom: '1rem' }}>
                  Manage stock, pricing, and SKU for each color-size combination
                </p>
                <div style={{ overflowX: 'auto', border: '1px solid var(--kc-glass-border)', borderRadius: 'var(--kc-radius)', background: 'rgba(255, 255, 255, 0.05)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.08)', borderBottom: '2px solid var(--kc-glass-border)' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em', color: 'var(--kc-cream-100)' }}>Color / Size</th>
                        {formData.sizes.map(size => (
                          <th key={size} style={{ padding: '12px', textAlign: 'center', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em', color: 'var(--kc-cream-100)' }}>{size}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {formData.colors.split(',').map(color => color.trim()).filter(Boolean).map(color => (
                        <tr key={color} style={{ borderBottom: '1px solid var(--kc-glass-border)' }}>
                          <td style={{ padding: '12px', fontWeight: '600', color: 'var(--kc-cream-100)' }}>{color}</td>
                          {formData.sizes.map(size => {
                            const variantKey = `${color}-${size}`;
                            const variant = formData.variantData[variantKey] || { stock: 0, price: formData.price || '', sku: '', image: '' };
                            return (
                              <td key={`${color}-${size}`} style={{ padding: '8px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="Stock"
                                    value={variant.stock || ''}
                                    onChange={(e) => handleVariantFieldChange(variantKey, 'stock', parseInt(e.target.value) || 0)}
                                    className="form-input"
                                    style={{ padding: '6px 8px', fontSize: '13px' }}
                                  />
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Price"
                                    value={variant.price || ''}
                                    onChange={(e) => handleVariantFieldChange(variantKey, 'price', e.target.value)}
                                    className="form-input"
                                    style={{ padding: '6px 8px', fontSize: '13px' }}
                                  />
                                  <input
                                    type="text"
                                    placeholder="SKU"
                                    value={variant.sku || ''}
                                    onChange={(e) => handleVariantFieldChange(variantKey, 'sku', e.target.value)}
                                    className="form-input"
                                    style={{ padding: '6px 8px', fontSize: '13px' }}
                                  />
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="form-help" style={{ marginTop: '0.5rem' }}>
                  Leave price empty to use base price. Leave SKU empty to auto-generate from base SKU.
                </p>
              </div>
            )}
          </div>

          {/* Section 5: Shipping & Policies */}
          <div className="form-section">
            <h3 className="section-title">Shipping & Policies</h3>
            
            <div className="form-row">
              <div className="form-group half-width">
                <label className="form-label">Shipping Weight (g)</label>
                <input
                  type="number"
                  name="weight"
                  className="form-input"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="e.g., 250"
                />
              </div>
              
              <div className="form-group half-width">
                <label className="form-label">Package Dimensions (cm)</label>
                <input
                  type="text"
                  name="dimensions"
                  className="form-input"
                  value={formData.dimensions}
                  onChange={handleChange}
                  placeholder="e.g., 32 x 25 x 2"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Estimated Delivery</label>
              <input
                type="text"
                name="deliveryEstimate"
                className="form-input"
                value={formData.deliveryEstimate}
                onChange={handleChange}
                placeholder="e.g., 5-7 business days"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Return Policy</label>
              <textarea
                name="returnPolicy"
                className="form-textarea"
                value={formData.returnPolicy}
                onChange={handleChange}
                rows="3"
                placeholder="Describe your return policy..."
              />
            </div>
          </div>

          {/* Section 6: Status */}
          <div className="form-section">
            <h3 className="section-title">Status</h3>
            
            <div className="form-group">
              <label className="form-label">Product Status *</label>
              <select
                name="status"
                className={`form-select ${errors.status ? 'error' : ''}`}
                value={formData.status}
                onChange={handleChange}
              >
                <option value="draft">Draft</option>
                <option value="pending_review">Submit for Review</option>
                <option value="published">Publish (if approved)</option>
              </select>
              {errors.status && <div className="error-text">{errors.status}</div>}
              <p className="form-help">
                {formData.status === 'pending_review' 
                  ? "Products in 'pending_review' will not be visible to buyers until approved" 
                  : "Save as draft to continue later"}
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button 
              type="button" 
              className="submit-button"
              disabled={submitStatus.type === 'loading' || uploading}
              onClick={handleSubmit}
            >
              {uploading ? 'Uploading images...' : submitStatus.type === 'loading' ? 'Submitting...' : 'Add Product'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .new-product-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--kc-navy-900);
          padding: 2rem 1rem;
          padding-top: 90px;
          font-family: var(--kc-font-sans);
          position: relative;
        }

        .new-product-container::before {
          content: '';
          position: fixed;
          inset: 0;
          background: linear-gradient(180deg, var(--kc-navy-700) 0%, var(--kc-slate-500) 100%);
          opacity: 0.4;
          pointer-events: none;
          z-index: 0;
        }

        .new-product-container > * {
          position: relative;
          z-index: 1;
        }

        .new-product-card {
          background: var(--kc-glass-01);
          border-radius: var(--kc-radius-lg);
          box-shadow: var(--kc-shadow-lg);
          width: 100%;
          max-width: 900px;
          border: 1px solid var(--kc-glass-border);
          margin: 2rem 0;
          overflow: hidden;
          backdrop-filter: blur(20px) saturate(110%);
        }

        .new-product-form {
          padding: 2.5rem;
          width: 100%;
        }

        .form-header {
          text-align: center;
          margin-bottom: 2.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--kc-glass-border);
        }

        .form-title {
          font-family: var(--kc-font-serif);
          font-size: 2rem;
          font-weight: 700;
          color: var(--kc-cream-100);
          margin: 0 0 0.5rem 0;
          line-height: 1.2;
          letter-spacing: var(--kc-letterspacing-heading);
        }

        .form-subtitle {
          color: var(--kc-beige-300);
          font-size: 1rem;
          margin: 0;
        }

        .form-section {
          background: rgba(255, 255, 255, 0.08);
          border-radius: var(--kc-radius-lg);
          padding: 2rem;
          margin-bottom: 2rem;
          border: 1px solid var(--kc-glass-border);
          transition: all var(--kc-duration-sm) var(--kc-ease);
          backdrop-filter: blur(10px);
        }

        .form-section:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--kc-gold-200);
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--kc-cream-100);
          margin: 0 0 1.5rem 0;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid rgba(211, 167, 95, 0.3);
          font-family: var(--kc-font-serif);
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-row {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin: 0 -0.5rem 1rem;
        }

        .half-width {
          flex: 1;
          min-width: 250px;
        }

        .full-width {
          flex: 1;
          width: 100%;
        }

        .one-third {
          flex: 1;
          min-width: 200px;
          max-width: calc(33.333% - 1rem);
        }

        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: var(--kc-cream-100);
          font-size: 0.875rem;
        }

        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius);
          font-size: 0.9375rem;
          transition: all var(--kc-duration-sm) var(--kc-ease);
          background: rgba(255, 255, 255, 0.08);
          color: var(--kc-cream-100);
          font-family: inherit;
          backdrop-filter: blur(10px);
        }

        .form-input::placeholder, .form-textarea::placeholder {
          color: var(--kc-beige-300);
          opacity: 0.6;
        }

        .form-input:hover, .form-select:hover, .form-textarea:hover {
          border-color: var(--kc-gold-200);
          background: rgba(255, 255, 255, 0.1);
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: var(--kc-gold-200);
          box-shadow: 0 0 0 3px rgba(211, 167, 95, 0.1);
          background: rgba(255, 255, 255, 0.12);
        }

        .form-textarea {
          min-height: 120px;
          resize: vertical;
          line-height: 1.6;
        }

        .form-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23F8F4EE' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 1em;
          padding-right: 2.5rem;
        }

        .form-select option {
          background: var(--kc-navy-700);
          color: var(--kc-cream-100);
        }

        .form-help {
          font-size: 0.75rem;
          color: var(--kc-beige-300);
          margin: 0.25rem 0 0;
          line-height: 1.4;
        }

        .error-text {
          color: rgba(255, 179, 191, 1);
          font-size: 0.75rem;
          margin-top: 0.25rem;
          font-weight: 500;
        }

        .error {
          border-color: rgba(245, 181, 181, 0.6) !important;
        }

        /* File Upload Styles */
        .file-upload-container {
          position: relative;
        }

        .file-input {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }

        .file-upload-label {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          width: 100%;
          padding: 1.25rem;
          border: 2px dashed var(--kc-glass-border);
          border-radius: var(--kc-radius);
          background: rgba(255, 255, 255, 0.08);
          color: var(--kc-beige-300);
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--kc-duration-sm) var(--kc-ease);
          backdrop-filter: blur(10px);
        }

        .file-upload-label:hover {
          border-color: var(--kc-gold-200);
          background: rgba(255, 255, 255, 0.12);
          color: var(--kc-cream-100);
        }

        .file-upload-label svg {
          transition: transform var(--kc-duration-sm) var(--kc-ease);
        }

        .file-upload-label:hover svg {
          transform: translateY(-2px);
        }

        .image-preview {
          position: relative;
          margin-top: 1rem;
          border-radius: var(--kc-radius);
          overflow: hidden;
          border: 1px solid var(--kc-glass-border);
          background: rgba(255, 255, 255, 0.08);
          display: inline-block;
          max-width: 100%;
          backdrop-filter: blur(10px);
        }

        .image-preview img {
          display: block;
          max-width: 300px;
          max-height: 300px;
          width: 100%;
          height: auto;
          object-fit: cover;
        }

        .remove-image {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(167, 29, 42, 0.8);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
          font-size: 1.5rem;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--kc-duration-sm) var(--kc-ease);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
        }

        .remove-image:hover {
          background: rgba(167, 29, 42, 1);
          transform: scale(1.1);
        }

        .additional-images {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .image-upload-item {
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .image-upload-item .image-preview {
          width: 100%;
          margin-top: 0;
        }

        .image-upload-item .image-preview img {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }

        .add-more-button {
          grid-column: 1 / -1;
          padding: 1rem;
          border: 2px dashed var(--kc-glass-border);
          border-radius: var(--kc-radius);
          background: rgba(255, 255, 255, 0.08);
          color: var(--kc-beige-300);
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--kc-duration-sm) var(--kc-ease);
          margin-top: 0.5rem;
          backdrop-filter: blur(10px);
        }

        .add-more-button:hover {
          border-color: var(--kc-gold-200);
          background: rgba(255, 255, 255, 0.12);
          color: var(--kc-cream-100);
        }

        .success-message, .error-message, .loading-message {
          border-radius: var(--kc-radius);
          padding: 1.25rem 1.5rem;
          margin-bottom: 1.5rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          animation: slideIn 0.3s ease;
          backdrop-filter: blur(10px);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .success-message {
          background: rgba(30, 126, 52, 0.2);
          border: 1px solid rgba(161, 224, 181, 0.4);
          color: rgba(129, 199, 132, 1);
        }

        .error-message {
          background: rgba(167, 29, 42, 0.2);
          border: 1px solid rgba(245, 181, 181, 0.4);
          color: rgba(239, 154, 154, 1);
        }

        .loading-message {
          background: rgba(211, 167, 95, 0.2);
          border: 1px solid rgba(211, 167, 95, 0.4);
          color: var(--kc-gold-200);
        }

        .submit-button {
          background: var(--kc-grad-gold);
          color: var(--kc-navy-900);
          border: none;
          border-radius: var(--kc-radius);
          padding: 1rem 2.5rem;
          font-size: 1.0625rem;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          transition: all var(--kc-duration-sm) var(--kc-ease);
          box-shadow: 0 4px 16px rgba(211, 167, 95, 0.25);
          letter-spacing: 0.5px;
        }

        .submit-button:hover:not(:disabled) {
          box-shadow: 0 8px 24px rgba(211, 167, 95, 0.35);
          transform: translateY(-2px);
        }

        .submit-button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 4px 16px rgba(211, 167, 95, 0.25);
        }

        .submit-button:disabled {
          background: rgba(255, 255, 255, 0.1);
          color: var(--kc-beige-300);
          cursor: not-allowed;
          opacity: 0.5;
          box-shadow: none;
          transform: none;
        }

        .size-options {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .size-option {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--kc-glass-border);
          border-radius: var(--kc-radius);
          padding: 0.5rem 1rem;
          cursor: pointer;
          transition: all var(--kc-duration-sm) var(--kc-ease);
          font-weight: 500;
          color: var(--kc-cream-100);
          backdrop-filter: blur(10px);
        }

        .size-option:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: var(--kc-gold-200);
        }

        .size-option input:checked + span {
          color: var(--kc-gold-200);
        }

        .size-option:has(input:checked) {
          background: rgba(211, 167, 95, 0.15);
          border-color: var(--kc-gold-200);
          box-shadow: 0 2px 8px rgba(211, 167, 95, 0.2);
        }

        .size-option input {
          margin-right: 0.5rem;
          cursor: pointer;
          width: 18px;
          height: 18px;
          accent-color: var(--kc-gold-200);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          font-weight: 500;
          padding: 0.5rem 0;
          color: var(--kc-cream-100);
        }

        .checkbox-label input {
          margin-right: 0.75rem;
          cursor: pointer;
          width: 20px;
          height: 20px;
          accent-color: var(--kc-gold-200);
        }

        .form-actions {
          margin-top: 2.5rem;
          padding-top: 2rem;
          border-top: 1px solid var(--kc-glass-border);
        }

        @media (max-width: 768px) {
          .new-product-container {
            padding: 1rem;
          }

          .new-product-card {
            margin: 0;
            border-radius: 12px;
          }

          .new-product-form {
            padding: 1.5rem;
          }

          .form-header {
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
          }

          .form-title {
            font-size: 1.5rem;
          }

          .form-section {
            padding: 1.25rem;
          }

          .form-row {
            flex-direction: column;
            gap: 0;
            margin: 0;
          }

          .half-width, .one-third, .full-width {
            max-width: 100%;
            width: 100%;
            min-width: 100%;
          }

          .additional-images {
            grid-template-columns: 1fr;
          }

          .size-options {
            gap: 0.5rem;
          }

          .size-option {
            padding: 0.4rem 0.8rem;
            font-size: 0.875rem;
          }

          .submit-button {
            padding: 0.875rem 1.5rem;
            font-size: 1rem;
          }
        }

        @media (max-width: 480px) {
          .form-title {
            font-size: 1.25rem;
          }

          .form-subtitle {
            font-size: 0.875rem;
          }

          .section-title {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </div>
  );
}