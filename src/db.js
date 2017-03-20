const Promise = require('promise');
const logger = require('./logger.js');
const firebase = require('./db-firebase.js');

const { APP_SOURCE } = require('./ai-config-appSource.js');

function db(appSource) {
  var data = {};

  this.getLocation = function(userId) {
    return firebase.getLocation(appSource, userId).then(location => {
      return new Promise(resolve => {
        logger.debug(`Got location for ${appSource} user ${userId}: ${JSON.stringify(location)}`);
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
  this.saveLocation = function(userId, location) {
    firebase.saveLocation(appSource, userId, location);
    logger.debug(`Saved location for ${appSource} user ${userId}: ${JSON.stringify(location)}`);
  }
};

const googleDb = new db(APP_SOURCE.GOOGLE);
const alexaDb = new db(APP_SOURCE.ALEXA);

module.exports = {
  googleDb,
  alexaDb
};
