/**
 * SEO Helper Functions
 * Generate JSON-LD structured data for different page types
 */

const siteUrl = import.meta.env.VITE_SITE_URL || 'https://thekapdaco.com';
const siteName = 'The Kapda Co.';

/**
 * Generate Organization JSON-LD
 */
export const getOrganizationJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: siteName,
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  description: 'Premium customizable fashion and designer streetwear platform',
  sameAs: [
    // Add social media URLs when available
    // 'https://www.facebook.com/thekapdaco',
    // 'https://www.instagram.com/thekapdaco',
    // 'https://twitter.com/thekapdaco',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    email: 'support@thekapdaco.com',
    availableLanguage: ['English', 'Hindi'],
  },
});

/**
 * Generate Product JSON-LD
 */
export const getProductJsonLd = (product) => {
  if (!product) return null;

  const {
    id,
    name,
    price,
    originalPrice,
    image,
    images = [],
    description,
    rating,
    reviewCount,
    currency = 'INR',
    availability = 'InStock',
    brand,
    category,
  } = product;

  const offers = {
    '@type': 'Offer',
    price: price || 0,
    priceCurrency: currency,
    availability: `https://schema.org/${availability}`,
    url: `${siteUrl}/product/${id}`,
  };

  if (originalPrice && originalPrice > price) {
    offers.priceValidUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: name || 'Product',
    image: images.length > 0 ? images : [image],
    description: description || '',
    sku: id,
    brand: brand ? {
      '@type': 'Brand',
      name: brand,
    } : undefined,
    category: category,
    offers,
  };

  if (rating && reviewCount) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating,
      reviewCount: reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return jsonLd;
};

/**
 * Generate Breadcrumb JSON-LD
 */
export const getBreadcrumbJsonLd = (items) => {
  if (!items || items.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url ? `${siteUrl}${item.url}` : undefined,
    })),
  };
};

/**
 * Generate WebSite JSON-LD with SearchAction
 */
export const getWebsiteJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteName,
  url: siteUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/shop?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
});

/**
 * Generate CollectionPage JSON-LD (for Shop/PLP)
 */
export const getCollectionPageJsonLd = (category, products = []) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category || 'Shop',
    url: `${siteUrl}/shop${category ? `/${category}` : ''}`,
  };

  if (products.length > 0) {
    jsonLd.mainEntity = {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.slice(0, 10).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.name,
          url: `${siteUrl}/product/${product.id}`,
          image: product.image,
          offers: {
            '@type': 'Offer',
            price: product.price || 0,
            priceCurrency: 'INR',
          },
        },
      })),
    };
  }

  return jsonLd;
};

