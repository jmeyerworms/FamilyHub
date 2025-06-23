export const environment = {
  production: true,
  apiUrl: 'https://apifamilyhub.craftologix.de/api',
  enableServiceWorker: true,
  enableTracing: false,
  logLevel: 'error',
  cacheTimeout: 300000, // 5 minutes
  features: {
    analytics: true,
    errorReporting: true,
    performanceMonitoring: true,
  },
};
