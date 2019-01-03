/* eslint-disable no-console */

  class Logger {
    log (...args) {
      console.log(...args);
    }

    error(...args) {
      console.error(...args);
    }

    debug(...args) {
      if (/retrowave-fs/.test(process.env.NODE_DEBUG)) {
        console.log(...args);
      }
    }
  }

const logger = new Logger();

export default logger;
