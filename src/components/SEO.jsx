import { Helmet } from 'react-helmet-async';

/**
 * SEO Component for dynamic meta tags per page
 * Usage: <SEO title="Page Title" description="Page description" jsonLd={...} />
 */
export const SEO = ({ 
  title, 
  description, 
  image, 
  url,
  type = 'website',
  keywords,
  jsonLd,
  canonical,
  robots = 'index, follow',
  noindex = false,
}) => {
  const siteTitle = 'The Kapda Co.';
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://thekapdaco.com';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const defaultDescription = 'Shop premium customizable fashion and designer streetwear. Create unique designs with our atelier tool, explore curated collections, and discover independent designers.';
  const defaultImage = `${siteUrl}/og-image.jpg`;
  const canonicalUrl = canonical || url || siteUrl;
  const robotsContent = noindex ? 'noindex, nofollow' : robots;
  
  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robotsContent} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url || siteUrl} />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:site_name" content={siteTitle} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={image || defaultImage} />
      
      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;

