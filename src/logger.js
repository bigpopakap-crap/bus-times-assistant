const logfmt = require('logfmt');

const { prefixObject, extendObject } = require('./utils.js');

const LEVEL = {
  // no value 0 because then it's falsy, and that makes edge cases
  DEBUG: { value: 1, name: 'DEBUG' },
  INFO: { value: 2, name: 'INFO' },
  WARN: { value: 3, name: 'WARN' },
  ERROR:{ value: 4, name: 'ERROR' },
};

function getCurrentLogLevel() {
  return LEVEL[process.env.LOG_LEVEL] || LEVEL.INFO;
}

function forComponent(componentName, extraContext = {}, namespace = '') {
  const context = prefixObject('component.', {
    name: componentName
  });

  namespace = namespace && `${namespace}.`
  extraContext = prefixObject(namespace, extraContext);

  return {
    // TODO this really needs to be cleaned up so it's not so damn gross
    forRequest(appSource = 'unset', userId, requestContext = {}) {
      requestContext = extendObject(requestContext, {
        appSource,
        userId
      });

      const allContext = extendObject(context, extraContext, requestContext);

      return new Logger(appSource, userId, allContext);
    }
  }
}

function Logger(appSource, userId, context = {}) {
  this.context = context;
}

Logger.LEVEL = LEVEL;
Logger.prototype.LEVEL = LEVEL;

Logger.prototype.log = function(level, event, data = {}) {
  try {
    if (level.value >= getCurrentLogLevel().value) {
      const logData = extendObject(
        prefixObject('log.', { level: level.name }),
        this.context,
        prefixObject('event.', { name: event }),
        prefixObject('event.data.', data)
      );

      logfmt.log(logData);
    }
  } catch (ex) {
    // just don't blow up the app if anything fails
    console.log('Error while logging!');
    console.log(ex);
  }
}

Logger.prototype.debug = function(event, data = {}) {
  this.log(LEVEL.DEBUG, event, data);
}

Logger.prototype.info = function(event, data = {}) {
  this.log(LEVEL.INFO, event, data);
}

Logger.prototype.warn = function(event, data = {}) {
  this.log(LEVEL.WARN, event, data);
}

Logger.prototype.error = function(event, data = {}) {
  this.log(LEVEL.ERROR, event, data);
}

module.exports = {
  forComponent
};
