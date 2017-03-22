/*
 * DON'T USE THIS LOGGER DIRECTLY
 * THIS IS FOR USE IN THE REGULAR LOGGER ONLY
 */
const Mixpanel = require('mixpanel');
const logger = require('./logger.js').forComponent('mixpanel-logger');

const mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN, {
  protocol: 'https'
});

function forRequest(appSource = 'unset', userId) {
  return new MixpanelLogger(appSource, userId);
}

function MixpanelLogger(appSource = 'unset', userId) {
  this.appSource = appSource;
  this.userId = userId;
  this.logger = logger.forRequest(appSource, userId);
}

// TODO track their location as well?
MixpanelLogger.prototype.metricsUser = function() {
  const appSource = this.appSource;
  const userId = this.userId;
  const now = new Date().toISOString();

  if (userId) {
    const mixpanelParams = {
      appSource,
      $created: now,
      last_use: now
    };

    mixpanel.people.set(userId, mixpanelParams);

    mixpanel.people.set_once(userId, {
      first_use: now
    });

    this.logger.debug('mixpanel_user', prefixObject('data.', mixpanelParams));
  }
};

MixpanelLogger.prototype.metricsUsage = function(action, params = {}) {
  const userId = this.userId;

  this.metricsUser();

  const mixpanelParams = extendObject(
    this.context,
    prefixObject('params.', params),
    { distinct_id: userId }
  );

  mixpanel.track(action, mixpanelParams);

  this.logger.debug('mixpanel_event', extendObject(
    { action },
    prefixObject('data.', mixpanelParams)
  ));
};

module.exports = {
  forRequest
};
