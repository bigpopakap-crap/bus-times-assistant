var logfmt = require('logfmt');
const { prefixObject, extendObject } = require('./utils.js');

const LEVEL = {
  // no value 0 because then it's falsy, and that makes edge cases
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4
};

function getCurrentLogLevel() {
  return LEVEL[process.env.LOG_LEVEL] || LEVEL.INFO;
}

function createLogData(event, context, data) {
  return extendObject(
    context,
    prefixObject('event.', { name: event }),
    prefixObject('event.data.', data)
  );
}

function forComponent(componentName) {
  const context = prefixObject('component.', {
    name: componentName
  });

  return new Logger(context);
}

function Logger(context = {}) {
  this.context = context;
}

Logger.prototype.LEVEL = LEVEL;

Logger.prototype.withContext = function(extraContext = {}, namespace = '') {
  namespace = namespace && `.${namespace}`;

  const context = extendObject(
    this.context,
    prefixObject(namespace, extraContext)
  );

  return new Logger(context);
}

Logger.prototype.forRequest = function(requestContext) {
  return this.withContext(requestContext, 'request');
}

Logger.prototype.log = function(level, event, data) {
  try {
    if (level >= getCurrentLogLevel()) {
      logfmt.log(createLogData(event, this.context, data));
    }
  } catch (ex) {
    // just don't blow up the app if anything fails
    console.log('Error while logging!');
    console.log(ex);
  }
}

Logger.prototype.debug = function(event, data) {
  this.log(LEVEL.DEBUG, event, data);
}

Logger.prototype.info = function(event, data) {
  this.log(LEVEL.INFO, event, data);
}

Logger.prototype.warn = function(event, data) {
  this.log(LEVEL.WARN, event, data);
}

Logger.prototype.error = function(event, data) {
  this.log(LEVEL.ERROR, event, data);
}

module.exports = {
  forComponent
};
