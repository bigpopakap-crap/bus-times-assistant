const Mixpanel = require('mixpanel');
const logger = require('./logger.js').forComponent('mixpanel-logger');

const { prefixObject, extendObject } = require('./utils.js');

const mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN, {
  protocol: 'https'
});

function forRequest(appSource, userId, requestContext = {}) {
  return new MetricsLogger(appSource, userId);
}

function MetricsLogger(appSource, userId, requestContext = {}) {
  this.appSource = appSource;
  this.userId = userId;
  this.requestContext = requestContext;
  this.logger = logger.forRequest(appSource, userId, requestContext);
}

// TODO track their location as well?
MetricsLogger.prototype.logUser = function() {
  const appSource = this.appSource;
  const userId = this.userId;
  const now = new Date().toISOString();

  const mixpanelParams = {
    appSource,
    $created: now,
    last_use: now
  };

  mixpanel.people.set(userId, mixpanelParams);

  mixpanel.people.set_once(userId, {
    first_use: now
  });

  this.logger.debug('mixpanel_user',
      prefixObject('mixpanel.user.params.', mixpanelParams));
};

MetricsLogger.prototype.logUsage = function(action, params = {}) {
  const appSource = this.appSource;
  const userId = this.userId;

  this.logUser();

  const mixpanelParams = extendObject(
    prefixObject('params.request.', this.requestContext),
    prefixObject('params.', params),
    { appSource, userId },
    { distinct_id: userId }
  );

  mixpanel.track(action, mixpanelParams);

  this.logger.debug('mixpanel_event', extendObject(
    prefixObject('mixpanel.', { event: action }),
    prefixObject('mixpanel.params.', mixpanelParams)
  ));
};

module.exports = {
  forRequest
};
