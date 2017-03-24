const Promise = require('promise');
const Firebase = require('./db-firebase.js');

const metrics = require('./logger-metrics.js').forComponent('db');

const { prefixObject } = require('./utils.js');
const { APP_SOURCE } = require('./ai-config-appSource.js');

function forRequest(appSource, userId, requestContext) {
  return new Db(appSource, userId, requestContext);
}

function Db(appSource, userId, requestContext = {}) {
  this.firebase = Firebase.forRequest(appSource, userId, requestContext);
  this.metrics = metrics.forRequest(appSource, userId, requestContext);
}

Db.prototype.getLocation = function() {
  const metrics = this.metrics;

  return this.firebase.getLocation().then(location => {
    return new Promise(resolve => {
      resolve(location);
      metrics.logUser(prefixObject('location.', location));
    });
  });
}

/**
 * location is {
 *   latitude,
 *   longitude,
 *   address,
 *   originalAddressInput,
 *   originalAddressSource
 * }
 */
Db.prototype.saveLocation = function(location) {
  this.firebase.saveLocation(location);
  this.metrics.logUser(prefixObject('location.', location));
}

module.exports = {
  forRequest
};
