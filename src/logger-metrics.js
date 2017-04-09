/* global process require module */
'use strict';

const Mixpanel = require('mixpanel');
const RequestContext = require('./request-context.js');

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

function createIntentParams(intent, params = {}) {
  return extendObject(params, {
    userAction: intent.getHumanName(),
    intentName: intent.getName(),
    intentAlexaName: intent.getAlexaName()
  });
}

function forComponent(componentName) {
  return {
    forRequest(requestContext = new RequestContext()) {
      return new MetricsLogger(componentName, requestContext);
    }
  };
}

function MetricsLogger(componentName, requestContext = new RequestContext()) {
  this.componentName = componentName;
  this.requestContext = requestContext;
  this.logger = logger.forRequest(requestContext);
}

/*
 * THIS REALLY SHOULD BE PRIVATE. DON'T CALL THIS, AND INSTEAD USE (OR MAKE)
 * A METHOD SPECIFIC TO THE TYPE OF THING YOU ARE LOGGING
 * EX. logIntent(), or logPerf()
 */
MetricsLogger.prototype.logEvent = function(eventType, eventName, params = {}) {
  const componentName = this.componentName;
  const userId = this.requestContext.getUserId();

  this.logUser();

  const mixpanelParams = extendObject(
    prefixObject('request.', this.requestContext.toJSON()),
    prefixObject('params.', params),
    prefixObject('context.', { componentName }),
    {
      mixpanelLogType: eventType,
      distinct_id: userId
    }
  );

  mixpanel.track(eventName, mixpanelParams);

  this.logger.trace('mixpanel_event',  prefixObject('mixpanel.', {
    eventType,
    params: JSON.stringify(mixpanelParams)
  }));
};

MetricsLogger.prototype.logUser = function(extraParams = {}) {
  const appSource = this.requestContext.getAppSource();
  const userId = this.requestContext.getUserId();
  const now = new Date().toISOString();

  const mixpanelParams = extendObject(extraParams, {
    appSource
  });

  mixpanel.people.set(userId, mixpanelParams);
  mixpanel.people.set_once(userId, '$created', now);

  this.logger.trace('mixpanel_user', prefixObject('mixpanel.', {
    params: JSON.stringify(mixpanelParams)
  }));
};

MetricsLogger.prototype.logUserLocation = function(location) {
  this.logUser(prefixObject('location.', location.toJSON()));
};

MetricsLogger.prototype.logIntent = function(intent, params = {}) {
  const eventType = METRICS_EVENT_TYPE.INTENT;

  this.logEvent(
    eventType,
    `${eventType}: ${intent.getHumanName()}`,
    createIntentParams(intent, params)
  );
};

MetricsLogger.prototype.logIntentResponse = function(intent, startDate, response, params = {}) {
  const eventType = METRICS_EVENT_TYPE.INTENT_RESPONSE;

  const durationMillis = new Date().getTime() - startDate.getTime();

  this.logEvent(
    eventType,
    `${eventType}: ${intent.getHumanName()}`,
    extendObject(
      createIntentParams(intent, params),
      prefixObject('stats.', {
        responseKey: response.getKey(),
        response: response.getPlainStr(),
        durationMillis
      })
    )
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

MetricsLogger.prototype.logLocationWarning = function(location) {
  this.logEvent(
    METRICS_EVENT_TYPE.LOCATION_WARNING,
    METRICS_EVENT_TYPE.LOCATION_WARNING,
    {
      location: JSON.stringify(location.toJSON()),
      city: location.getCity()
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
