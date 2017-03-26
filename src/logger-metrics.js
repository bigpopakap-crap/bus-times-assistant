const Mixpanel = require('mixpanel');
const logger = require('./logger.js').forComponent('logger-metrics');

const { prefixObject, extendObject } = require('./utils.js');
const {
  METRICS_EVENT_TYPE,
  LOCATION_PERMISSION_PHASE
} = require('./ai-config-metricsEvents.js');

const mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN, {
  protocol: 'https'
});

function forComponent(componentName) {
  return {
    forRequest(appSource, userId, requestContext = {}) {
      return new MetricsLogger(componentName, appSource, userId, requestContext);
    }
  };
}

function MetricsLogger(componentName, appSource, userId, requestContext = {}) {
  this.componentName = componentName;
  this.appSource = appSource;
  this.userId = userId;
  this.requestContext = requestContext;
  this.logger = logger.forRequest(appSource, userId, requestContext);
}

/*
 * THIS REALLY SHOULD BE PRIVATE. DON'T CALL THIS, AND INSTEAD USE (OR MAKE)
 * A METHOD SPECIFIC TO THE TYPE OF THING YOU ARE LOGGING
 * EX. logIntent(), or logPerf()
 */
MetricsLogger.prototype.logEvent = function(eventType, params = {}) {
  const componentName = this.componentName;
  const appSource = this.appSource;
  const userId = this.userId;

  this.logUser();

  const mixpanelParams = extendObject(
    prefixObject('request.', this.requestContext),
    prefixObject('params.', params),
    prefixObject('context.', { componentName, appSource, userId }),
    {
      distinct_id: userId
    }
  );

  mixpanel.track(eventType, mixpanelParams);

  this.logger.debug('mixpanel_event',  prefixObject('mixpanel.', {
    eventType,
    params: JSON.stringify(mixpanelParams)
  }));
};

MetricsLogger.prototype.logUser = function(extraParams = {}) {
  const appSource = this.appSource;
  const userId = this.userId;
  const now = new Date().toISOString();

  const mixpanelParams = extendObject(extraParams, {
    appSource
  });

  mixpanel.people.set(userId, mixpanelParams);
  mixpanel.people.set_once(userId, '$created', now);

  this.logger.debug('mixpanel_user', prefixObject('mixpanel.', {
    params: JSON.stringify(mixpanelParams)
  }));
};

MetricsLogger.prototype.logUserLocation = function(location) {
  this.logUser(prefixObject('location.', location));
};

MetricsLogger.prototype.logIntent = function(intent, params = {}) {
  this.logEvent(METRICS_EVENT_TYPE.INTENT, extendObject(params, {
    userAction: intent.getHumanName(),
    intentName: intent.getName()
  }));
};

MetricsLogger.prototype.logLocationPermissionRequest = function() {
  this.logEvent(METRICS_EVENT_TYPE.LOCATION_PERMISSION, {
    phase: LOCATION_PERMISSION_PHASE.REQUESTED
  });
};

MetricsLogger.prototype.logLocationPermissionResponse = function(wasPermissionGranted) {
  this.logEvent(METRICS_EVENT_TYPE.LOCATION_PERMISSION, {
    phase: LOCATION_PERMISSION_PHASE.RESPONDED,
    wasPermissionGranted
  });
};

MetricsLogger.prototype.logPerf = function(params = {}) {
  this.logEvent(METRICS_EVENT_TYPE.PERF, params);
};

module.exports = {
  forComponent
};
