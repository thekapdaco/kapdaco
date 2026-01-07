// config/sentry.js - Sentry error tracking (optional)
// Install: npm install @sentry/node

const SENTRY_DSN = process.env.SENTRY_DSN;

let Sentry = null;

if (SENTRY_DSN) {
  try {
    // Dynamic import - only load if DSN is provided
    import('@sentry/node').then((sentryModule) => {
      Sentry = sentryModule.default;
      Sentry.init({
        dsn: SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      });
      console.log('✅ Sentry initialized');
    }).catch((err) => {
      console.warn('⚠️  Sentry module not installed. Install with: npm install @sentry/node');
    });
  } catch (error) {
    console.warn('⚠️  Sentry initialization skipped:', error.message);
  }
} else {
  console.log('ℹ️  Sentry DSN not provided, error tracking disabled');
}

// Export helper functions
export const captureException = (error, context = {}) => {
  if (Sentry && SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
};

export const captureMessage = (message, level = 'info') => {
  if (Sentry && SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  }
};

export default Sentry;

