export const environment = {
  production: false,
  apiUrl: 'https://apifamilyhub.craftologix.de/api',
  enableServiceWorker: false,
  enableTracing: true,
  logLevel: 'debug',
  cacheTimeout: 0, // No caching in development
  features: {
    analytics: false,
    errorReporting: false,
    performanceMonitoring: false,
  },
};
