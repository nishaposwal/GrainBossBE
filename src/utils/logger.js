import config from '../config/config.js';

const logger = {
  info: (...args) => {
    console.log(...args);
  },
  error: (...args) => {
    console.error(...args);
  },
  debug: (...args) => {
    if (config.isDevelopment) {
      console.debug(...args);
    }
  },
  warn: (...args) => {
    console.warn(...args);
  }
};

export default logger; 