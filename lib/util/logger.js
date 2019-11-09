'use strict';
/**
 *
 * @description Logger module. Contains functions to handle logging features.
 * @module util/logger
 * @author
 *  [{@link https://github.com/apercova|github@apercova}],
 *  [{@link https://twitter.com/apercova|twitter@apercova}],
 *  [{@link https://www.npmjs.com/~apercova|npmjs/~apercova}]
 *
 * @since 1.2.0
 */
const config = require('../config/config');
const winston = require('winston');

const _gconfig = {
  'level': _resolveLogLevel(),
  'dateFormat': 'YYYY-MM-DD HH:mm:ss'
};

/**
 * _resolveLogLevel - Resolves logg level between ERROR and DEBUG.
 *
 * @return {string}  Log level
 */
function _resolveLogLevel() {
  return config.isDebugEnabled() ? 'debug' : 'error';
}

/**
 * _logFormat - Format a message
 *
 * @param  {string} level     Logger level.
 * @param  {string} message   Log message.
 * @param  {string} label     Logger label.
 * @param  {string} timestamp Formatted timestamp.
 * @return {string}           Formatted message.
 */
function _logFormat({ level, message, label, timestamp }) {
  return `${timestamp} [${label}] [${level}]: ${message}`;
}

/**
 * getLogger - Creates a logger with given label. If already exists, returns it.
 *
 * @param  {type} loggerLabel Logger label.
 * @return {winston.Container}        Logger instance as winston container.
 */
function getLogger(loggerLabel) {
  if (!winston.loggers.has(loggerLabel)) {
    winston.loggers.add(loggerLabel, {
      'level': _gconfig.level,
      'format': winston.format.combine(
        winston.format.label({ 'label': loggerLabel }),
        winston.format.timestamp({ 'format': _gconfig.dateFormat }),
        winston.format.printf(_logFormat)
      ),
      'transports': [new winston.transports.Console({ 'level': _gconfig.level })]
    });
  }
  return winston.loggers.get(loggerLabel);
}

/**
 * setLevel - Defines logger LEVEL.
 *
 * @param  {string} level             Level to set.
 * @param  {winston.Container} logger Logger instance.
 * @return {void}
 */
function setLevel(level, logger) {
  if (!logger) {
    _gconfig.level = level || _gconfig.level;
    winston.loggers.loggers.forEach(l => {
      l.level = level;
      l.transports.forEach(t => t.level = level);
    });
  } else {
    if (typeof logger === 'string' && winston.loggers.has(logger)) {
      const _logger = winston.loggers.get(logger);
      _logger.level = level;
      _logger.transports.forEach(t => t.level = level);
    }
    if (typeof logger === 'object') {
      if (typeof logger.level === 'string') {
        logger.level = level;
      }
      if (Array.isArray(logger.transports)) {
        logger.transports.forEach(t => t.level = level);
      }
    }
  }
}

/**
 * enableDebug - Enables DEBUG level on All existing loggers.
 *
 * @return {void}
 */
function enableDebug() {
  setLevel('debug');
}

/**
 * enableDebug - Enables ERROR level on All existing loggers.
 *
 * @return {void}
 */
function enableError() {
  setLevel('error');
}

/**
 * dispose - Dispose all loggers.
 *
 * @return {void}
 */
function dispose() {
  return new Promise((resolve, reject) => {
    try {
      winston.loggers.loggers.forEach((l, k) => {
        winston.loggers.close(k);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = { getLogger, setLevel, enableDebug, enableError, dispose };
