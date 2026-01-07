import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { useNavigate } from 'react-router-dom';
import {
  Palette,
  Type,
  UploadCloud,
  Layers,
  Ruler,
  Brush,
  ClipboardList,
  Sparkles,
  Package,
  X,
} from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';
import { KCButton, KCInput, KCAlert } from '../../components/ui';
import { PRODUCTS, COLORS, APPAREL_SIZES } from './customizeConstants';
import StudioHeader from '../../components/studio/StudioHeader.jsx';
import PreviewCanvas from '../../components/studio/PreviewCanvas.jsx';
import StudioNavigator from '../../components/studio/StudioNavigator.jsx';
import LayersList from '../../components/studio/LayersList.jsx';
import PriceBreakdown from '../../components/studio/PriceBreakdown.jsx';
import FitGuideModal from '../../components/studio/FitGuideModal.jsx';
import InspirationCarousel from '../../components/studio/InspirationCarousel.jsx';
import BundleStrip from '../../components/studio/BundleStrip.jsx';
import TrustBadges from '../../components/studio/TrustBadges.jsx';
import FAQDrawer from '../../components/studio/FAQDrawer.jsx';

const backgroundNoise = 'var(--kc-noise)';

const templates = [
  {
    id: 'minimal-moon',
    title: 'Lunar Minimal',
    category: 'Minimal',
    text: 'Moonlight',
    fontFamily: 'Playfair Display',
    gradient: 'linear-gradient(135deg, var(--kc-white), var(--kc-gray-500))',
    image: 'https://images.unsplash.com/photo-1521570513286-8184aa33b4c6?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 'vintage-script',
    title: 'Velvet Club',
    category: 'Vintage',
    text: 'Velvet Lounge 1984',
    fontFamily: 'Poppins',
    fontWeight: 700,
    gradient: 'linear-gradient(135deg, var(--kc-gold), var(--kc-gold-300))',
    image: 'https://images.unsplash.com/photo-1542293787938-4d2226c12e80?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 'street-graph',
    title: 'Street Grid',
    category: 'Street',
    text: 'Concrete Rhythm',
    fontFamily: 'Manrope',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 'nature-flow',
    title: 'Verdant Drift',
    category: 'Nature',
    text: 'Verdant Drift',
    fontFamily: 'Inter',
    gradient: 'linear-gradient(135deg, #88d7a2, #3a9970)',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 'abstract-wave',
    title: 'Prism Wave',
    category: 'Abstract',
    text: 'Prism Wave',
    fontFamily: 'Poppins',
    image: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 'type-stack',
    title: 'Typeface Stack',
    category: 'Typography',
    text: 'Typeface Stack',
    fontFamily: 'Playfair Display',
    gradient: 'linear-gradient(135deg, var(--kc-gold), var(--kc-white))',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=400&q=70',
  },
];

const inspirationImageIds = [
  '1521572267360-ee0c2909d518',
  '1521335629791-ce4aec67dd47',
  '1512436991641-6745cdb1723f',
  '1503342217505-b0a15ec3261c',
  '1524504388940-b1c1722653e1',
];

const inspirationItems = Array.from({ length: 10 }).map((_, index) => ({
  id: `insp-${index}`,
  title: index % 2 === 0 ? 'Aurora Drop' : 'Mixtape Edit',
  category: index % 2 === 0 ? 'Limited Drop' : 'Typographic',
  designer: index % 2 === 0 ? 'Aanya Kapoor' : 'Leo Fernandes',
  image: `https://images.unsplash.com/photo-${inspirationImageIds[index % inspirationImageIds.length]}?auto=format&fit=crop&w=360&q=70`,
}));

const defaultTextConfig = {
  fontFamily: 'Playfair Display',
  fontWeight: 600,
  letterSpacing: 0,
  lineHeight: 1.2,
  fontSize: 34,
  color: 'var(--kc-white)',
  gradient: null,
  textAlign: 'center',
  uppercase: false,
  shadow: false,
  outline: false,
  blur: 0,
};

const getDefaultDesignState = () => ({
  imagePosition: { x: 50, y: 40 },
  textPosition: { x: 50, y: 70 },
  imageSize: { width: 180, height: 180 },
  textSize2: { width: 220, height: 80 },
  imageRotation: 0,
  textRotation: 0,
  imageOpacity: 1,
  textOpacity: 1,
  customText: '',
  textConfig: defaultTextConfig,
  uploadedImage: null,
});

const Customize = () => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const previewRef = useRef(null);

  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedOption, setSelectedOption] = useState('');

  const [uploadedImage, setUploadedImage] = useState(null);
  const [customText, setCustomText] = useState('');
  const [textConfig, setTextConfig] = useState(defaultTextConfig);

  const [imagePosition, setImagePosition] = useState({ x: 50, y: 40 });
  const [textPosition, setTextPosition] = useState({ x: 50, y: 70 });
  const [imageSize, setImageSize] = useState({ width: 180, height: 180 });
  const [textBoxSize, setTextBoxSize] = useState({ width: 240, height: 100 });
  const [imageRotation, setImageRotation] = useState(0);
  const [textRotation, setTextRotation] = useState(0);
  const [imageOpacity, setImageOpacity] = useState(1);
  const [textOpacity, setTextOpacity] = useState(1);
  const [selectedElement, setSelectedElement] = useState(null);

  const [previewMode, setPreviewMode] = useState('front');
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [showSafeArea, setShowSafeArea] = useState(true);
  const [backdropColor, setBackdropColor] = useState('#101012');
  const [snapEnabled, setSnapEnabled] = useState(true);

  const [activeTab, setActiveTab] = useState('products');
  const [showHelp, setShowHelp] = useState(false);
  const [showFitGuide, setShowFitGuide] = useState(false);

  const [frontState, setFrontState] = useState(() => getDefaultDesignState());
  const [backState, setBackState] = useState(() => getDefaultDesignState());
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [layers, setLayers] = useState([
    { id: 'image', name: 'Artwork', type: 'Graphic', visible: true, locked: false },
    { id: 'text', name: 'Typography', type: 'Text', visible: true, locked: false },
  ]);

  const [finishing, setFinishing] = useState({ method: 'DTG', placements: ['front'] });
  const [aiPalettes, setAiPalettes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showCartNotification, setShowCartNotification] = useState(false);

  const currentState = useMemo(
    () => ({
      imagePosition,
      textPosition,
      imageSize,
      textBoxSize,
      imageRotation,
      textRotation,
      imageOpacity,
      textOpacity,
      customText,
      textConfig,
      uploadedImage,
    }),
    [
      imagePosition,
      textPosition,
      imageSize,
      textBoxSize,
      imageRotation,
      textRotation,
      imageOpacity,
      textOpacity,
      customText,
      textConfig,
      uploadedImage,
    ]
  );

  const productImage = useMemo(() => {
    const colorVariant = selectedProduct?.colorVariants?.[selectedColor.name];
    if (colorVariant && typeof colorVariant === 'object' && colorVariant.front) {
      return previewMode === 'front' ? colorVariant.front : colorVariant.back;
    }
    return colorVariant || selectedProduct?.imageUrl;
  }, [selectedProduct, selectedColor, previewMode]);

  const priceBreakdown = useMemo(() => {
    const basePrice = selectedProduct.price;
    const sizeSurcharge = selectedProduct.hasSize && ['XL', 'XXL'].includes(selectedSize) ? 120 : 0;
    const printPrice = uploadedImage ? 160 : customText ? 110 : 0;
    const finishPrice = finishing.method === 'Embroidery' ? 280 : finishing.method === 'Screen' ? 200 : 150;
    const placementPrice = (finishing.placements?.length || 1) * 60;
    const subtotal = basePrice + sizeSurcharge + printPrice + finishPrice + placementPrice;
    const tax = Math.round(subtotal * 0.12);
    return {
      rows: [
        { label: 'Base garment', value: basePrice },
        { label: 'Size & placement', value: sizeSurcharge + placementPrice },
        { label: 'Print & finishes', value: printPrice + finishPrice },
        { label: 'Tax estimate (12%)', value: tax },
      ],
      total: subtotal + tax,
    };
  }, [selectedProduct, selectedSize, uploadedImage, customText, finishing]);

  const handleNotification = (message, variant = 'danger') => {
    setNotifications([{ message, variant }]);
    setTimeout(() => setNotifications([]), 3000);
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      handleNotification('Please upload images smaller than 10MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      handleNotification('Only image uploads are supported.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedImage(event.target.result);
        setSelectedElement('image');
      }
    };
    reader.readAsDataURL(file);
  };

  const restoreState = useCallback(
    (state) => {
      setImagePosition(state.imagePosition);
      setTextPosition(state.textPosition);
      setImageSize(state.imageSize);
      setTextBoxSize(state.textBoxSize);
      setImageRotation(state.imageRotation);
      setTextRotation(state.textRotation);
      setImageOpacity(state.imageOpacity);
      setTextOpacity(state.textOpacity);
      setCustomText(state.customText);
      setTextConfig(state.textConfig);
      setUploadedImage(state.uploadedImage);
    },
    []
  );

  const saveSnapshot = useCallback(() => {
    const next = history.slice(0, historyIndex + 1);
    next.push(currentState);
    setHistory(next);
    setHistoryIndex(next.length - 1);
  }, [history, historyIndex, currentState]);

  const undo = useCallback(() => {
    if (history.length === 0 || historyIndex <= 0) return;
    restoreState(history[historyIndex - 1]);
    setHistoryIndex(historyIndex - 1);
  }, [history, historyIndex, restoreState]);

  const redo = useCallback(() => {
    if (history.length === 0 || historyIndex >= history.length - 1) return;
    restoreState(history[historyIndex + 1]);
    setHistoryIndex(historyIndex + 1);
  }, [history, historyIndex, restoreState]);

  const resetDesign = useCallback(() => {
    const defaults = getDefaultDesignState();
    restoreState(defaults);
    setSelectedElement(null);
    // Reset history to the fresh baseline so undo/redo feel predictable
    setHistory([defaults]);
    setHistoryIndex(0);
  }, [restoreState]);

  const duplicateActiveLayer = () => {
    if (selectedElement === 'image' && uploadedImage) {
      setImagePosition((prev) => ({ x: Math.min(prev.x + 4, 95), y: Math.min(prev.y + 4, 95) }));
    }
    if (selectedElement === 'text' && customText) {
      setTextPosition((prev) => ({ x: Math.min(prev.x + 4, 95), y: Math.min(prev.y + 4, 95) }));
    }
  };

  const handleSetPreviewMode = (mode) => {
    if (mode === previewMode) return;
    if (previewMode === 'front') setFrontState(currentState);
    if (previewMode === 'back') setBackState(currentState);
    const target = mode === 'front' ? frontState : backState;
    restoreState(target);
    setPreviewMode(mode);
  };

  const toggleFullscreen = useCallback(() => {
    const node = previewRef.current;
    if (!node) {
      console.warn('Preview ref not available for fullscreen');
      return;
    }

    const el = node.closest('[data-preview-shell]') || node;

    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch((err) => {
          console.warn('Failed to enter fullscreen:', err);
        });
      } else {
        console.warn('Fullscreen API not supported');
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.warn('Failed to exit fullscreen:', err);
        });
      }
    }
  }, []);

  const generateAiPalette = () => {
    const palette = Array.from({ length: 3 }).map(() => `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`);
    setAiPalettes(palette.map((hex) => ({ name: hex, value: hex })));
  };

  const applyTemplate = (template) => {
    setCustomText(template.text);
    setTextConfig((prev) => ({
      ...prev,
      fontFamily: template.fontFamily || prev.fontFamily,
      fontWeight: template.fontWeight || prev.fontWeight,
      gradient: template.gradient || null,
      uppercase: true,
    }));
    if (template.image) {
      setUploadedImage(template.image);
    }
  };

  const handleLayerMove = (id, direction) => {
    setLayers((prev) => {
      const index = prev.findIndex((layer) => layer.id === id);
      if (index === -1) return prev;
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const handleLayerVisibility = (id) => {
    setLayers((prev) => prev.map((layer) => (layer.id === id ? { ...layer, visible: !layer.visible } : layer)));
    if (id === 'image') {
      setImageOpacity((prev) => (prev === 0 ? 1 : prev));
    }
    if (id === 'text') {
      setTextOpacity((prev) => (prev === 0 ? 1 : prev));
    }
  };

  const handleLayerLock = (id) => {
    setLayers((prev) => prev.map((layer) => (layer.id === id ? { ...layer, locked: !layer.locked } : layer)));
  };

  const handleLayerDuplicate = (id) => {
    if (id === 'image') duplicateActiveLayer();
    if (id === 'text') duplicateActiveLayer();
  };

  const handleLayerSelect = (id) => {
    setSelectedElement(id === 'image' ? 'image' : id === 'text' ? 'text' : null);
  };

  const handleAddToCart = async () => {
    const capturePngFor = async (mode) => {
      if (previewMode === 'front') setFrontState(currentState);
      if (previewMode === 'back') setBackState(currentState);
      if (mode !== previewMode) handleSetPreviewMode(mode);
      await new Promise((resolve) => setTimeout(resolve, 60));
      if (!previewRef.current) return null;
      try {
        return await toPng(previewRef.current, { cacheBust: true, pixelRatio: 2 });
      } catch (err) {
        console.error(err);
        return null;
      }
    };

    const chosenSize = selectedProduct.hasSize ? selectedSize : selectedOption;
    const frontPng = await capturePngFor('front');
    const backPng = selectedProduct?.hasFrontBack !== false ? await capturePngFor('back') : null;

    await addToCart({
      productId: `custom-${selectedProduct.id}`,
      title: selectedProduct.name,
      price: priceBreakdown.total,
      image: frontPng || productImage,
      quantity: 1,
      size: chosenSize,
      color: selectedColor?.name,
      previews: { front: frontPng, back: backPng },
      customization: {
        text: customText,
        textConfig,
        image: uploadedImage,
        placements: finishing.placements,
        method: finishing.method,
      },
    });

    // Show success notification with option to view cart
    setShowCartNotification(true);
    setTimeout(() => setShowCartNotification(false), 5000);
  };

  useEffect(() => {
    if (selectedProduct.hasSize) {
      setSelectedSize('M');
      setSelectedOption('');
    } else {
      setSelectedSize('');
      setSelectedOption(selectedProduct.options?.[0] || '');
    }
  }, [selectedProduct]);

  // Ensure selected color is available for the current product
  useEffect(() => {
    if (!selectedProduct?.colorVariants || Object.keys(selectedProduct.colorVariants).length === 0) {
      return;
    }
    if (!selectedColor?.name) {
      return;
    }
    const hasColorVariant = selectedProduct.colorVariants[selectedColor.name];
    if (!hasColorVariant) {
      const firstAvailableColor = COLORS.find(color => 
        selectedProduct.colorVariants[color.name]
      );
      if (firstAvailableColor) {
        setSelectedColor(firstAvailableColor);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct]);

  useEffect(() => {
    window.showGrid = showGrid;
    window.snapToGrid = snapEnabled;
  }, [showGrid, snapEnabled]);

  // Initialize history with the initial state on mount
  useEffect(() => {
    if (history.length === 0 && historyIndex === -1) {
      const initialState = getDefaultDesignState();
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timeout = setTimeout(saveSnapshot, 500);
    return () => clearTimeout(timeout);
  }, [currentState, saveSnapshot]);

  const tabs = useMemo(
    () => [
      {
        id: 'products',
        label: 'Products',
        icon: Package,
        description: 'Choose your canvas - T-Shirts, Hoodies, Caps, and more.',
        content: (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {PRODUCTS.map((product) => {
              const productColorVariant = selectedColor?.name 
                ? product.colorVariants?.[selectedColor.name]
                : null;
              const productImage = typeof productColorVariant === 'object' && productColorVariant?.front
                ? productColorVariant.front
                : (typeof productColorVariant === 'string' ? productColorVariant : product.imageUrl);
              
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => {
                    setSelectedProduct(product);
                    // Reset design when switching products
                    const defaults = getDefaultDesignState();
                    restoreState(defaults);
                    // Set default color if available for this product
                    const availableColors = COLORS.filter(color => product.colorVariants?.[color.name]);
                    if (availableColors.length > 0 && selectedColor?.name && !availableColors.find(c => c.name === selectedColor.name)) {
                      setSelectedColor(availableColors[0]);
                    } else if (availableColors.length > 0 && !selectedColor?.name) {
                      setSelectedColor(availableColors[0]);
                    }
                  }}
                  className={`group flex flex-col gap-3 rounded-[var(--kc-radius)] border p-4 text-left text-white/80 transition hover:-translate-y-1 ${
                    selectedProduct.id === product.id
                      ? 'border-[var(--kc-gold-1)] bg-[rgba(211,167,95,0.14)] shadow-[0_10px_30px_rgba(211,167,95,0.3)]'
                      : 'border-white/10 bg-white/5 hover:border-[var(--kc-gold-1)] hover:bg-white/10'
                  }`}
                >
                  <div className="relative h-48 overflow-hidden rounded-[var(--kc-radius)] border border-white/10 bg-white/5">
                    <img 
                      src={productImage} 
                      alt={product.name} 
                      className="h-full w-full object-contain p-2" 
                      loading="lazy" 
                    />
                    {selectedProduct.id === product.id && (
                      <span className="absolute inset-x-3 top-3 flex items-center justify-center rounded-full bg-[var(--kc-gold-1)] px-3 py-1 text-xs font-semibold text-black">
                        Selected
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-white/60">{product.category}</p>
                    <p className="text-sm font-semibold text-white">{product.name}</p>
                    <p className="mt-1 text-sm text-[var(--kc-gold-2)]">₹{product.price}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ),
      },
      {
        id: 'templates',
        label: 'Templates',
        icon: Sparkles,
        description: 'Start with curated layouts handpicked by Kapda Co. designers.',
        content: (
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => applyTemplate(template)}
                className="group flex flex-col gap-3 rounded-[var(--kc-radius)] border border-white/10 bg-white/5 p-4 text-left text-white/80 transition hover:-translate-y-1 hover:border-[var(--kc-gold-1)] hover:bg-white/10"
              >
                <div className="relative h-40 overflow-hidden rounded-[var(--kc-radius)] border border-white/10">
                  <img src={template.image} alt={template.title} className="h-full w-full object-cover" loading="lazy" />
                  <span className="absolute inset-x-3 bottom-3 flex items-center justify-center rounded-full bg-black/50 px-3 py-1 text-xs text-white">
                    Use template
                  </span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-white/60">{template.category}</p>
                  <p className="text-sm font-semibold text-white">{template.title}</p>
                </div>
              </button>
            ))}
          </div>
        ),
      },
      {
        id: 'colors',
        label: 'Colors',
        icon: Palette,
        description: 'Choose garment hues or craft a bespoke palette.',
        content: (
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-white/60">Base colour</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {COLORS.filter(color => {
                  // Show color if product has color variants and this color is available
                  if (selectedProduct?.colorVariants && selectedProduct.colorVariants[color.name]) {
                    return true;
                  }
                  // If product doesn't have color variants defined, show all colors
                  if (!selectedProduct?.colorVariants || Object.keys(selectedProduct.colorVariants).length === 0) {
                    return true;
                  }
                  return false;
                }).map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition ${
                      selectedColor.name === color.name
                        ? 'border-[var(--kc-gold-1)] shadow-[0_10px_30px_rgba(211,167,95,0.3)]'
                        : 'border-white/10 hover:border-[var(--kc-gold-1)]'
                    }`}
                    aria-label={`Select ${color.name}`}
                  >
                    <span
                      className="h-10 w-10 rounded-full"
                      style={{ background: color.value }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <KCInput
                value={selectedColor.value}
                onChange={(e) => setSelectedColor({ name: 'Custom', value: e.target.value })}
                className="w-32"
                aria-label="Custom hex"
              />
              <input
                type="color"
                value={selectedColor.value}
                onChange={(e) => setSelectedColor({ name: 'Custom', value: e.target.value })}
                className="h-11 w-11 cursor-pointer rounded-full border border-white/10"
                aria-label="Pick colour"
              />
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.32em] text-white/60">AI palette</p>
              <KCButton variant="secondary" className="border border-white/15 bg-white/10 text-white hover:bg-white/15" onClick={generateAiPalette}>
                Generate palette
              </KCButton>
              {aiPalettes.length ? (
                <div className="flex gap-3">
                  {aiPalettes.map((palette) => (
                    <button
                      key={palette.value}
                      type="button"
                      className="h-12 w-12 rounded-full border-2 border-white/10"
                      style={{ background: palette.value }}
                      onClick={() => setSelectedColor(palette)}
                      aria-label={`Use palette colour ${palette.value}`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        id: 'text',
        label: 'Text',
        icon: Type,
        description: 'Add typography, adjust styling, and apply premium treatments.',
        content: (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.32em] text-white/60">Content</label>
              <textarea
                className="kc-input min-h-[120px] resize-y"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Write something iconic..."
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.32em] text-white/60">Font family</label>
                <select
                  className="kc-input"
                  value={textConfig.fontFamily}
                  onChange={(e) => setTextConfig((prev) => ({ ...prev, fontFamily: e.target.value }))}
                >
                  {['Playfair Display', 'Manrope', 'Poppins', 'Inter'].map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.32em] text-white/60">Font weight</label>
                <select
                  className="kc-input"
                  value={textConfig.fontWeight}
                  onChange={(e) => setTextConfig((prev) => ({ ...prev, fontWeight: Number(e.target.value) }))}
                >
                  {[400, 500, 600, 700, 800].map((weight) => (
                    <option key={weight} value={weight}>
                      {weight}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.32em] text-white/60">Font size (px)</label>
                <KCInput
                  type="number"
                  min="12"
                  max="120"
                  value={textConfig.fontSize}
                  onChange={(e) => setTextConfig((prev) => ({ ...prev, fontSize: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.32em] text-white/60">Letter spacing</label>
                <KCInput
                  type="number"
                  value={textConfig.letterSpacing}
                  onChange={(e) => setTextConfig((prev) => ({ ...prev, letterSpacing: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.32em] text-white/60">Line height</label>
                <KCInput
                  type="number"
                  step="0.05"
                  value={textConfig.lineHeight}
                  onChange={(e) => setTextConfig((prev) => ({ ...prev, lineHeight: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.32em] text-white/60">Text colour</label>
                <div className="flex items-center gap-3">
                  <KCInput
                    value={textConfig.color}
                    onChange={(e) => setTextConfig((prev) => ({ ...prev, color: e.target.value, gradient: null }))}
                    className="w-32"
                  />
                  <input
                    type="color"
                    value={textConfig.color}
                    onChange={(e) => setTextConfig((prev) => ({ ...prev, color: e.target.value, gradient: null }))}
                    className="h-11 w-11 cursor-pointer rounded-full border border-white/10"
                    aria-label="Pick text colour"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.32em] text-white/60">Blur</label>
                <KCInput
                  type="number"
                  min="0"
                  max="10"
                  value={textConfig.blur}
                  onChange={(e) => setTextConfig((prev) => ({ ...prev, blur: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <KCButton
                variant="secondary"
                className={`border border-white/15 bg-white/10 text-white hover:bg-white/15 ${textConfig.gradient ? 'ring-2 ring-[var(--kc-beige)]' : ''}`}
                onClick={() =>
                  setTextConfig((prev) => ({
                    ...prev,
                    gradient: prev.gradient
                      ? null
                      : 'linear-gradient(135deg, #D3A75F, #9F7860)',
                  }))
                }
              >
                Gradient
              </KCButton>
              <KCButton
                variant="secondary"
                className={`border border-white/15 bg-white/10 text-white hover:bg-white/15 ${textConfig.shadow ? 'ring-2 ring-[var(--kc-beige)]' : ''}`}
                onClick={() => setTextConfig((prev) => ({ ...prev, shadow: !prev.shadow }))}
              >
                Shadow
              </KCButton>
              <KCButton
                variant="secondary"
                className={`border border-white/15 bg-white/10 text-white hover:bg-white/15 ${textConfig.outline ? 'ring-2 ring-[var(--kc-beige)]' : ''}`}
                onClick={() => setTextConfig((prev) => ({ ...prev, outline: !prev.outline }))}
              >
                Outline
              </KCButton>
              <KCButton
                variant="secondary"
                className={`border border-white/15 bg-white/10 text-white hover:bg-white/15 ${textConfig.uppercase ? 'ring-2 ring-[var(--kc-beige)]' : ''}`}
                onClick={() => setTextConfig((prev) => ({ ...prev, uppercase: !prev.uppercase }))}
              >
                Uppercase
              </KCButton>
              <KCButton
                variant="secondary"
                className={`border border-white/15 bg-white/10 text-white hover:bg-white/15 ${textConfig.textAlign === 'left' ? 'ring-2 ring-[var(--kc-beige)]' : ''}`}
                onClick={() => setTextConfig((prev) => ({ ...prev, textAlign: 'left' }))}
              >
                Left
              </KCButton>
              <KCButton
                variant="secondary"
                className={`border border-white/15 bg-white/10 text-white hover:bg-white/15 ${textConfig.textAlign === 'center' ? 'ring-2 ring-[var(--kc-beige)]' : ''}`}
                onClick={() => setTextConfig((prev) => ({ ...prev, textAlign: 'center' }))}
              >
                Center
              </KCButton>
              <KCButton
                variant="secondary"
                className={`border border-white/15 bg-white/10 text-white hover:bg-white/15 ${textConfig.textAlign === 'right' ? 'ring-2 ring-[var(--kc-beige)]' : ''}`}
                onClick={() => setTextConfig((prev) => ({ ...prev, textAlign: 'right' }))}
              >
                Right
              </KCButton>
            </div>
          </div>
        ),
      },
      {
        id: 'upload',
        label: 'Upload',
        icon: UploadCloud,
        description: 'Import artwork, clean backgrounds, and fine-tune opacity.',
        content: (
          <div className="space-y-4">
            <label
              htmlFor="design-upload"
              className="flex h-44 cursor-pointer flex-col items-center justify-center rounded-[var(--kc-radius)] border border-dashed border-white/20 bg-white/5 p-6 text-center text-white/70 transition hover:border-[var(--kc-gold-1)] hover:bg-white/10"
            >
              <UploadCloud size={24} className="mb-3 text-[var(--kc-gold-1)]" />
              <span className="text-sm font-semibold text-white">Drag & drop or click to upload</span>
              <span className="text-xs text-white/60">PNG or SVG recommended · Max 10MB</span>
              <input
                id="design-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files?.[0])}
              />
            </label>

            {uploadedImage ? (
              <div className="flex items-center justify-between rounded-[var(--kc-radius)] border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                <span>Artwork added</span>
                <KCButton
                  variant="secondary"
                  className="border border-white/15 bg-white/10 text-white hover:bg-white/15"
                  onClick={() => setUploadedImage(null)}
                >
                  Remove
                </KCButton>
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              {[{ label: 'Remove background', key: 'removeBg' }, { label: 'Remove white', key: 'removeWhite' }, { label: 'Magic cutout', key: 'cutout' }].map((action) => (
                <KCButton
                  key={action.key}
                  variant="secondary"
                  className="border border-white/15 bg-white/10 text-white hover:bg-white/15"
                  onClick={() => handleNotification(`${action.label} applied (simulated).`, 'info')}
                >
                  {action.label}
                </KCButton>
              ))}
              <KCButton
                variant="secondary"
                className="border border-white/15 bg-white/10 text-white hover:bg-white/15"
                onClick={() => setImageOpacity((prev) => Math.max(0, Math.min(1, prev - 0.1)))}
              >
                Reduce opacity
              </KCButton>
              <KCButton
                variant="secondary"
                className="border border-white/15 bg-white/10 text-white hover:bg-white/15"
                onClick={() => setImageOpacity((prev) => Math.max(0, Math.min(1, prev + 0.1)))}
              >
                Increase opacity
              </KCButton>
            </div>
          </div>
        ),
      },
      {
        id: 'layers',
        label: 'Layers',
        icon: Layers,
        description: 'Reorder, lock, and duplicate design elements with precision.',
        content: (
          <LayersList
            layers={layers}
            onToggleVisibility={handleLayerVisibility}
            onToggleLock={handleLayerLock}
            onDuplicate={handleLayerDuplicate}
            onMoveLayer={handleLayerMove}
            onSelect={handleLayerSelect}
            activeLayerId={selectedElement}
          />
        ),
      },
      {
        id: 'sizes',
        label: 'Sizes',
        icon: Ruler,
        description: 'Select inclusive sizing and review fit guidance.',
        content: (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(selectedProduct.hasSize ? APPAREL_SIZES : selectedProduct.options || ['One Size']).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() =>
                    selectedProduct.hasSize ? setSelectedSize(size) : setSelectedOption(size)
                  }
                  className={`kc-pill border text-sm font-semibold transition ${
                    (selectedProduct.hasSize ? selectedSize === size : selectedOption === size)
                      ? 'border-[var(--kc-gold-1)] bg-[rgba(211,167,95,0.14)] text-[var(--kc-gold-2)]'
                      : 'border-white/10 bg-white/5 text-white/70 hover:text-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
              <span>Stock: Ready in 48h</span>
              <span>Model reference: 6’0” wearing L</span>
              <KCButton variant="secondary" className="border border-white/15 bg-white/10 text-white hover:bg-white/15" onClick={() => setShowFitGuide(true)}>
                Fit guide
              </KCButton>
            </div>
            <KCButton className="w-full" onClick={handleAddToCart}>
              Add to cart
            </KCButton>
          </div>
        ),
      },
      {
        id: 'finishes',
        label: 'Finishes',
        icon: Brush,
        description: 'Pick print methods and choose placement presets.',
        content: (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.32em] text-white/60">Method</p>
              <div className="flex flex-wrap gap-3">
                {['DTG', 'Screen', 'Embroidery'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    className={`kc-pill border text-sm font-semibold transition ${
                      finishing.method === method
                        ? 'border-[var(--kc-gold-1)] bg-[rgba(211,167,95,0.14)] text-[var(--kc-gold-2)]'
                        : 'border-white/10 bg-white/5 text-white/70 hover:text-white'
                    }`}
                    onClick={() => setFinishing((prev) => ({ ...prev, method }))}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.32em] text-white/60">Placements</p>
              <div className="flex flex-wrap gap-3">
                {['front', 'back', 'left-sleeve', 'right-sleeve', 'pocket'].map((placement) => {
                  const active = finishing.placements.includes(placement);
                  return (
                    <button
                      key={placement}
                      type="button"
                      className={`kc-pill border text-sm font-semibold capitalize transition ${
                        active
                          ? 'border-[var(--kc-gold-1)] bg-[rgba(211,167,95,0.14)] text-[var(--kc-gold-2)]'
                          : 'border-white/10 bg-white/5 text-white/70 hover:text-white'
                      }`}
                      onClick={() =>
                        setFinishing((prev) => ({
                          ...prev,
                          placements: active
                            ? prev.placements.filter((item) => item !== placement)
                            : [...prev.placements, placement],
                        }))
                      }
                    >
                      {placement.replace('-', ' ')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'summary',
        label: 'Summary',
        icon: ClipboardList,
        description: 'Review selections, care details, and order terms before checkout.',
        content: (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-[var(--kc-radius)] border border-white/10">
                <img src={productImage} alt={selectedProduct.name} className="h-full w-full object-cover" />
              </div>
              <div className="text-sm text-white/80">
                <p className="text-white">{selectedProduct.name}</p>
                <p>{selectedColor.name}</p>
                <p>{selectedProduct.hasSize ? selectedSize : selectedOption}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-white/70">
              <p>Material: 100% combed cotton • 230 GSM</p>
              <p>Care: Cold wash, dry shade, do not tumble dry</p>
              <p>Delivery ETA: 6-8 business days</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <KCButton className="flex-1" onClick={handleAddToCart}>
                Add to cart
              </KCButton>
              <KCButton
                variant="secondary"
                className="flex-1 border border-white/15 bg-white/10 text-white hover:bg-white/15"
                onClick={() => handleNotification('Design saved to favourites (simulated).', 'info')}
              >
                Save design
              </KCButton>
              <KCButton
                variant="secondary"
                className="flex-1 border border-white/15 bg-white/10 text-white hover:bg-white/15"
                onClick={() => handleNotification('Share link copied to clipboard.', 'info')}
              >
                Share preview
              </KCButton>
            </div>
            <p className="text-xs text-white/60">
              By adding to cart, you agree to the Kapda Co. custom order terms, including made-to-order production and limited returns.
            </p>
          </div>
        ),
      },
    ],
    [selectedProduct, selectedColor, selectedSize, selectedOption, productImage, finishing, customText, uploadedImage, restoreState]
  );

  const stepIds = useMemo(() => tabs.map((tab) => tab.id), [tabs]);

  useEffect(() => {
    const handleKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
      if (mod && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        redo();
      }
      if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateActiveLayer();
      }
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleNotification('Design saved to your account (simulated).', 'info');
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveTab((prev) => {
          const currentIndex = stepIds.indexOf(prev);
          const nextIndex = Math.min(stepIds.length - 1, currentIndex + 1);
          return stepIds[nextIndex];
        });
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveTab((prev) => {
          const currentIndex = stepIds.indexOf(prev);
          const nextIndex = Math.max(0, currentIndex - 1);
          return stepIds[nextIndex];
        });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [undo, redo, stepIds]);

  const visibleUploadedImage = useMemo(() => {
    const imageLayer = layers.find((layer) => layer.id === 'image' && layer.visible);
    return imageLayer ? uploadedImage : null;
  }, [layers, uploadedImage]);

  const visibleCustomText = useMemo(() => {
    const textLayer = layers.find((layer) => layer.id === 'text' && layer.visible);
    return textLayer ? customText : '';
  }, [layers, customText]);

  return (
    <div className="min-h-screen" style={{ backgroundImage: `${backgroundNoise}, var(--kc-bg-gradient)` }}>
      <StudioHeader
        productName={selectedProduct.name}
        productColor={selectedColor}
        price={priceBreakdown.total}
        onBack={() => navigate('/')}
        onSave={() => handleNotification('Design saved to your account (simulated).', 'info')}
        onShare={() => handleNotification('Share link copied (simulated).', 'info')}
        onHelpToggle={() => setShowHelp((prev) => !prev)}
        isHelpOpen={showHelp}
        helpContent={<FAQDrawer />}
      />

      <div className="kc-container flex flex-col gap-8 py-10 lg:grid lg:grid-cols-[minmax(0,0.65fr)_minmax(0,0.35fr)] lg:items-start">
        <div className="space-y-6">
          {notifications.map((note) => (
            <KCAlert key={note.message} variant={note.variant} className="text-sm text-white">
              {note.message}
            </KCAlert>
          ))}
          
          {showCartNotification && (
            <KCAlert variant="success" className="flex items-center justify-between text-sm">
              <span className="text-white">"{selectedProduct.name}" added to cart successfully!</span>
              <div className="flex items-center gap-3 ml-4">
                <KCButton
                  variant="secondary"
                  className="border border-white/20 bg-white/10 text-white hover:bg-white/25 text-xs px-3 py-1"
                  onClick={() => {
                    setShowCartNotification(false);
                    navigate('/cart');
                  }}
                >
                  View Cart
                </KCButton>
                <button
                  type="button"
                  onClick={() => setShowCartNotification(false)}
                  className="text-white/70 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </KCAlert>
          )}

          <PreviewCanvas
            selectedProduct={selectedProduct}
            selectedColor={selectedColor}
            previewMode={previewMode}
            onModeChange={handleSetPreviewMode}
            zoom={zoom}
            onZoomChange={setZoom}
            snapEnabled={snapEnabled}
            onToggleSnap={setSnapEnabled}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            showSafeArea={showSafeArea}
            setShowSafeArea={setShowSafeArea}
            backdropColor={backdropColor}
            onBackdropColorChange={setBackdropColor}
            previewRef={previewRef}
            productImage={productImage}
            layers={layers}
            uploadedImage={visibleUploadedImage}
            imagePosition={imagePosition}
            setImagePosition={setImagePosition}
            imageSize={imageSize}
            setImageSize={setImageSize}
            imageRotation={imageRotation}
            setImageRotation={setImageRotation}
            imageOpacity={imageOpacity}
            customText={visibleCustomText}
            textConfig={textConfig}
            textBoxSize={textBoxSize}
            setTextBoxSize={setTextBoxSize}
            textPosition={textPosition}
            setTextPosition={setTextPosition}
            textRotation={textRotation}
            setTextRotation={setTextRotation}
            textOpacity={textOpacity}
            selectedElement={selectedElement}
            setSelectedElement={setSelectedElement}
            onUndo={undo}
            onRedo={redo}
            onReset={resetDesign}
            onFullscreen={toggleFullscreen}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
          />

          {activeTab !== tabs[tabs.length - 1].id ? (
            <div className="mt-4 flex justify-end">
              <KCButton
                variant="primary"
                className="px-6"
                onClick={() => {
                  const currentIndex = stepIds.indexOf(activeTab);
                  const nextIndex = Math.min(stepIds.length - 1, currentIndex + 1);
                  setActiveTab(stepIds[nextIndex]);
                }}
              >
                Next step
              </KCButton>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-6 pb-20">
          <StudioNavigator steps={tabs} activeStepId={activeTab} onStepChange={setActiveTab} />
          <div className="hidden lg:block">
            <PriceBreakdown rows={priceBreakdown.rows} total={priceBreakdown.total} />
          </div>
        </div>
      </div>

      <div className="space-y-12 pb-16">
        <InspirationCarousel items={inspirationItems} />
        <BundleStrip />
        <TrustBadges />
      </div>

      <FitGuideModal open={showFitGuide} onClose={() => setShowFitGuide(false)} productName={selectedProduct.name} />

      {/* Mobile sticky Add to Cart CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden pointer-events-none">
        <div className="kc-container px-4 pb-4 pt-3">
          <KCButton
            className="w-full min-h-[44px] pointer-events-auto"
            onClick={handleAddToCart}
          >
            Add to cart
          </KCButton>
        </div>
      </div>
    </div>
  );
};

export default Customize;