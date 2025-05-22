// Environment check
const isDevelopment = process.env.NODE_ENV === 'development';

// Log levels
const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

// Logger configuration
const config = {
  enabled: isDevelopment,
  level: LOG_LEVELS.DEBUG
};

// Logger utility
const logger = {
  debug: (...args) => {
    if (config.enabled && config.level === LOG_LEVELS.DEBUG) {
      console.log('🔍 DEBUG:', ...args);
    }
  },
  
  info: (...args) => {
    if (config.enabled) {
      console.log('ℹ️ INFO:', ...args);
    }
  },
  
  warn: (...args) => {
    if (config.enabled) {
      console.warn('⚠️ WARN:', ...args);
    }
  },
  
  error: (...args) => {
    if (config.enabled) {
      console.error('❌ ERROR:', ...args);
    }
  },

  // Method to update logger configuration
  configure: (newConfig) => {
    Object.assign(config, newConfig);
  }
};

export default logger; 