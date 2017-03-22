const logfmt = require('logfmt');
const Mixpanel = require('mixpanel');

const { prefixObject, extendObject } = require('./utils.js');

const mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN, {
  protocol: 'https'
});

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

function forComponent(componentName) {
  const context = prefixObject('component.', {
    name: componentName
  });

  return new Logger(context);
}

function Logger(context = {}) {
  this.context = context;
}

Logger.LEVEL = LEVEL;
Logger.prototype.LEVEL = LEVEL;

Logger.prototype.withContext = function(extraContext = {}, namespace = '') {
  namespace = namespace && `${namespace}.`;

  const context = extendObject(
    this.context,
    prefixObject(namespace, extraContext)
  );

  return new Logger(context);
}

Logger.prototype.forRequest = function(appSource, userId, requestContext = {}) {
  requestContext = extendObject(requestContext, {
    appSource,
    userId
  });
  return this.withContext(requestContext, 'request');
}

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

/* BEGIN STUFF FOR METRICS *****************************/
// TODO track their location as well?
Logger.prototype.metricsUser = function() {
  const appSource = this.context.appSource;
  const userId = this.context.userId;
  const now = new Date().toISOString();

  if (userId) {
    mixpanel.people.set(userId, {
      appSource,
      $created: now,
      last_use: now
    });

    mixpanel.people.set_once(userId, {
      first_use: now
    });
  }
}

Logger.prototype.metricsUsage = function(action, params = {}) {
  const userId = this.context.userId;

  this.metricsUser();

  const mixpanelParams = extendObject(
    this.context,
    prefixObject('params.', params),
    { distinct_id: userId }
  );

  mixpanel.track(action, mixpanelParams);
}

module.exports = {
  forComponent
};
