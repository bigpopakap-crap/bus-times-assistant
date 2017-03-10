const Promise = require('promise');
const logger = require('./logger.js');
const firebase = require('./db-firebase.js');

// TODO do we care? Should this be removed completely?
const APP_SOURCE = {
  GOOGLE: 'google',
  ALEXA: 'alexa'
};

function db(appSource) {
  var data = {};

  this.getLocation = function(userId) {
    return firebase.getLocation(appSource, userId).then(location => {
      return new Promise(resolve => {
        logger.log(`Got location for ${appSource} user ${userId}: ${JSON.stringify(location)}`);
        resolve(location);
      });
    });
  }

  /**
   * location - { latitude, longitude, originalAddressInput }
   */
  this.saveLocation = function(userId, location) {
    firebase.saveLocation(appSource, userId, location);
    logger.log(`Saved location for ${appSource} user ${userId}: ${JSON.stringify(location)}`);
  }
};

const googleDb = new db(APP_SOURCE.GOOGLE);
const alexaDb = new db(APP_SOURCE.ALEXA);

module.exports = {
  googleDb,
  alexaDb
};
