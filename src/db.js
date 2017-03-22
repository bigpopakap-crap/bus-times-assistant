const Promise = require('promise');
const Firebase = require('./db-firebase.js');

const { APP_SOURCE } = require('./ai-config-appSource.js');

function forRequest(appSource, userId, requestContext) {
  return new Db(appSource, userId, requestContext);
}

function Db(appSource, userId, requestContext = {}) {
  this.firebase = Firebase.forRequest(appSource, userId, requestContext);
}

Db.prototype.getLocation = function() {
  return this.firebase.getLocation().then(location => {
    return new Promise(resolve => {
      resolve(location);
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
}

module.exports = {
  forRequest
};
