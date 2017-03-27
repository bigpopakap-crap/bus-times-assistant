const Promise = require('promise');
const Firebase = require('./db-firebase.js');

const metrics = require('./logger-metrics.js').forComponent('db');

const { prefixObject } = require('./utils.js');
const { APP_SOURCE } = require('./ai-config-appSource.js');

function forRequest(requestContext) {
  return new Db(requestContext);
}

function Db(requestContext) {
  this.firebase = Firebase.forRequest(requestContext);
  this.metrics = metrics.forRequest(requestContext);
}

Db.prototype.getLocation = function() {
  const metrics = this.metrics;

  return this.firebase.getLocation().then(location => {
    return new Promise(resolve => {
      resolve(location);
      metrics.logUserLocation(location);
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
  this.metrics.logUserLocation(location);
}

module.exports = {
  forRequest
};
