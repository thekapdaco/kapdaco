/**
 * ProductDetail Variant Selection Tests
 * 
 * Tests for color variant selection, image swapping, and variantId in cart
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductDetail from '../ProductDetail';
import { CartProvider } from '../../context/CartContext';
import { AuthProvider } from '../../context/AuthContext';

// Mock API
vi.mock('../../lib/api.js', () => ({
  api: vi.fn(),
}));

// Mock product data with variants
const mockProduct = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Oversized Classic T-Shirt',
  price: 999,
  description: 'Premium cotton t-shirt',
  images: ['default-1.jpg', 'default-2.jpg'],
  sizes: ['S', 'M', 'L', 'XL'],
  colors: ['White', 'Black'],
  variants: [
    {
      _id: '507f191e810c19729de860ea',
      color: 'White',
      size: 'L',
      slug: 'white-l',
      images: ['white-1.jpg', 'white-2.jpg'],
      stock: 10,
    },
    {
      _id: '507f191e810c19729de860eb',
      color: 'Black',
      size: 'L',
      slug: 'black-l',
      images: ['black-1.jpg', 'black-2.jpg'],
      stock: 5,
    },
  ],
};

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          {component}
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('ProductDetail - Variant Selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock API response
    const { api } = require('../../lib/api.js');
    api.mockResolvedValue({ product: mockProduct });
  });

  it('should display color variants as radio buttons', async () => {
    renderWithProviders(<ProductDetail />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Select color White')).toBeInTheDocument();
      expect(screen.getByLabelText('Select color Black')).toBeInTheDocument();
    });
  });

  it('should swap images when color variant is selected', async () => {
    renderWithProviders(<ProductDetail />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Select color White')).toBeInTheDocument();
    });

    // Select Black variant
    const blackButton = screen.getByLabelText('Select color Black');
    fireEvent.click(blackButton);

    // Verify image changed to black variant image
    await waitFor(() => {
      const img = screen.getByAltText(/Black/);
      expect(img).toBeInTheDocument();
      expect(img.src).toContain('black-1.jpg');
    });
  });

  it('should preload variant images', async () => {
    const preloadSpy = vi.spyOn(Image.prototype, 'src', 'set');
    
    renderWithProviders(<ProductDetail />);
    
    await waitFor(() => {
      // Check that images are being preloaded
      expect(preloadSpy).toHaveBeenCalled();
    });

    // Verify both variant image sets were preloaded
    const preloadedUrls = preloadSpy.mock.calls.map(call => call[1]);
    expect(preloadedUrls).toContain('white-1.jpg');
    expect(preloadedUrls).toContain('black-1.jpg');
  });

  it('should include variantId in add-to-cart payload', async () => {
    const addToCartSpy = vi.fn();
    
    // Mock CartContext
    vi.mock('../../context/CartContext', () => ({
      useCart: () => ({
        addToCart: addToCartSpy,
      }),
    }));

    renderWithProviders(<ProductDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Add To Bag')).toBeInTheDocument();
    });

    // Select a variant
    const whiteButton = screen.getByLabelText('Select color White');
    fireEvent.click(whiteButton);

    // Click add to cart
    const addButton = screen.getByText('Add To Bag');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(addToCartSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          variantId: '507f191e810c19729de860ea',
          color: 'White',
        })
      );
    });
  });

  it('should support keyboard navigation for variants', async () => {
    renderWithProviders(<ProductDetail />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Select color White')).toBeInTheDocument();
    });

    const whiteButton = screen.getByLabelText('Select color White');
    whiteButton.focus();

    // Press Arrow Right to navigate to Black
    fireEvent.keyDown(whiteButton, { key: 'ArrowRight' });

    await waitFor(() => {
      const blackButton = screen.getByLabelText('Select color Black');
      expect(blackButton).toHaveFocus();
    });
  });

  it('should have proper ARIA attributes', async () => {
    renderWithProviders(<ProductDetail />);
    
    await waitFor(() => {
      const colorGroup = screen.getByRole('radiogroup');
      expect(colorGroup).toHaveAttribute('aria-label', 'Select color variant');
      
      const whiteRadio = screen.getByRole('radio', { name: /Select color White/ });
      expect(whiteRadio).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('should fallback to product images if variant has no images', async () => {
    const productWithoutVariantImages = {
      ...mockProduct,
      variants: [
        {
          _id: '507f191e810c19729de860ea',
          color: 'White',
          images: [], // No variant images
        },
      ],
    };

    const { api } = require('../../lib/api.js');
    api.mockResolvedValue({ product: productWithoutVariantImages });

    renderWithProviders(<ProductDetail />);
    
    await waitFor(() => {
      // Should use product default images
      const img = screen.getByAltText(/White/);
      expect(img.src).toContain('default-1.jpg');
    });
  });

  it('should apply fade transition when switching variants', async () => {
    renderWithProviders(<ProductDetail />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Select color White')).toBeInTheDocument();
    });

    const blackButton = screen.getByLabelText('Select color Black');
    
    // Check for AnimatePresence (framer-motion fade)
    fireEvent.click(blackButton);

    await waitFor(() => {
      // Image should transition smoothly
      const img = screen.getByAltText(/Black/);
      expect(img).toBeInTheDocument();
    }, { timeout: 300 }); // Allow time for transition
  });
});

