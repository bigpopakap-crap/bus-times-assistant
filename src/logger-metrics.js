const Mixpanel = require('mixpanel');

const THIS_COMPONENT_NAME = 'logger-metrics';
const initLogger = require('./logger.js').forComponent(THIS_COMPONENT_NAME).forRequest();
const logger = require('./logger.js').forComponent(THIS_COMPONENT_NAME);

const { prefixObject, extendObject } = require('./utils.js');
const {
  METRICS_EVENT_TYPE,
  LOCATION_PERMISSION_PHASE
} = require('./ai-config-metricsEvents.js');

initLogger.info('pre_mixpanel_connect');
let mixpanel;
try {
  mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN, {
    protocol: 'https'
  });

  initLogger.info('post_mixpanel_connect', {
    success: true
  });
} catch (ex) {
  initLogger.error('post_mixpanel_connect', {
    success: false,
    error: ex
  });
}

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
MetricsLogger.prototype.logEvent = function(eventType, eventName, params = {}) {
  const componentName = this.componentName;
  const appSource = this.appSource;
  const userId = this.userId;

  this.logUser();

  const mixpanelParams = extendObject(
    prefixObject('request.', this.requestContext),
    prefixObject('params.', params),
    prefixObject('context.', { componentName, appSource, userId }),
    {
      mixpanelLogType: eventType,
      distinct_id: userId
    }
  );

  mixpanel.track(eventName, mixpanelParams);

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
  const eventType = METRICS_EVENT_TYPE.INTENT;

  this.logEvent(
    eventType,
    `${eventType}: ${intent.getHumanName()}`,
    extendObject(params, {
      userAction: intent.getHumanName(),
      intentName: intent.getName()
    })
  );
};

MetricsLogger.prototype.logLocationPermissionRequest = function() {
  this.logEvent(
    METRICS_EVENT_TYPE.LOCATION_PERMISSION,
    METRICS_EVENT_TYPE.LOCATION_PERMISSION,
    {
      phase: LOCATION_PERMISSION_PHASE.REQUESTED
    }
  );
};

MetricsLogger.prototype.logLocationPermissionResponse = function(wasPermissionGranted) {
  this.logEvent(
    METRICS_EVENT_TYPE.LOCATION_PERMISSION,
    METRICS_EVENT_TYPE.LOCATION_PERMISSION,
    {
      phase: LOCATION_PERMISSION_PHASE.RESPONDED,
      wasPermissionGranted
    }
  );
};

MetricsLogger.prototype.logPerf = function(params = {}) {
  this.logEvent(
    METRICS_EVENT_TYPE.PERF,
    METRICS_EVENT_TYPE.PERF,
    params
  );
};

module.exports = {
  forComponent
};
