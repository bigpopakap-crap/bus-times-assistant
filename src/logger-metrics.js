const Mixpanel = require('mixpanel');
const logger = require('./logger.js').forComponent('logger-metrics');

const { prefixObject, extendObject } = require('./utils.js');

const EVENT_TYPE = {
  INTENT: 'User action',
  PERF: 'Latency and error rate',
  OTHER: 'Other'
};

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

// TODO track their location as well?
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

MetricsLogger.prototype.logEvent = function(eventType, event, params = {}) {
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

  mixpanel.track(event, mixpanelParams);

  this.logger.debug('mixpanel_event',  prefixObject('mixpanel.', {
    event,
    params: JSON.stringify(mixpanelParams)
  }));
};

MetricsLogger.prototype.logIntent = function(intent, params = {}) {
  this.logEvent(EVENT_TYPE.INTENT, intent.getHumanName(), extendObject(params, {
    intent: intent.getName()
  }));
}

module.exports = {
  EVENT_TYPE,
  forComponent
};
