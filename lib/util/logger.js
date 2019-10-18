// https://github.com/winstonjs/winston/issues/1017#issuecomment-450754806
const config = require("../config/config");
const winston = require('winston');

const _gconfig = {
  level: _resolveLogLevel(),
  dateFormat: 'YYYY-MM-DD HH:mm:ss'
}

function _resolveLogLevel() {
  return config.isDebugEnabled() ? 'debug' : 'error';
}

function _logFormat({ level, message, label, timestamp }) {
  return `${timestamp} [${label}] [${level}]: ${message}`
}

function getLogger(loggerLabel) {
  if (!winston.loggers.has(loggerLabel)) {
    winston.loggers.add(loggerLabel,
      {
        level: _gconfig.level,
        format: winston.format.combine(
          winston.format.label({label: loggerLabel}),
          winston.format.timestamp({format: _gconfig.dateFormat}),
          winston.format.printf(_logFormat),
        ),
        transports: [
          new winston.transports.Console({level: _gconfig.level})
          //new winston.transports.File({ filename: `${consts.PACKAGE_NAME}.log`})
        ]
      }
    );
  }
  return winston.loggers.get(loggerLabel);
}

function setLevel(level, logger) {
  if (!logger) {
    _gconfig.level = level || _gconfig.level;
    winston.loggers.loggers.forEach( l => {
      l.level = level;
      l.transports.forEach(t => t.level = level);
    });
  } else {
    if (typeof logger === "string" && winston.loggers.has(logger)) {
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

function enableDebug() {
  setLevel('debug');
}
function disableDebug() {
  setLevel('error');
}

function dispose() {
  try {
    winston.loggers.loggers
    .forEach((l, k) => {
      winston.loggers.close(k);
    });
  } catch(err) {
    this._logger.error(err);
    throw err;
  }
}

module.exports = { getLogger, setLevel, enableDebug, disableDebug, dispose};