// config/sentry.js - Sentry error tracking for frontend (optional)
// Install: npm install @sentry/react
// If you don't need Sentry, you can safely ignore this file

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

let Sentry = null;

// Initialize Sentry only if DSN is provided
if (SENTRY_DSN) {
  // Use Function constructor to create truly dynamic import
  // This prevents Vite from statically analyzing the import path
  // The app will work even if @sentry/react is not installed
  try {
    // Create import function at runtime - Vite cannot statically analyze this
    const createImport = new Function('p', 'return import(p)');
    // Construct package name using template to avoid static analysis
    const packagePath = `@${'sentry'}/${'react'}`;
    
    createImport(packagePath)
      .then((sentryModule) => {
        Sentry = sentryModule.default;
        
        if (Sentry) {
          Sentry.init({
            dsn: SENTRY_DSN,
            environment: import.meta.env.MODE || 'development',
            integrations: [
              Sentry.browserTracingIntegration(),
              Sentry.replayIntegration(),
            ],
            tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
            replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
            replaysOnErrorSampleRate: 1.0,
          });
          console.log('✅ Sentry initialized');
        }
      })
      .catch(() => {
        // Package not installed - this is expected and safe to ignore
        Sentry = null;
      });
  } catch (error) {
    // If initialization fails, Sentry is not available
    Sentry = null;
  }
}

// Export helper functions
export const captureException = (error, context = {}) => {
  if (Sentry && SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error('Error:', error, context);
  }
};

export const captureMessage = (message, level = 'info') => {
  if (Sentry && SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[${level}]`, message);
  }
};

export default Sentry;

