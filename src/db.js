const Promise = require('promise');
const logger = require('./logger.js');

const APP_SOURCE = {
  GOOGLE: 'google',
  ALEXA: 'alexa'
};

function db(appSource) {
  var data = {};

  this.getLocation = function(userId) {
    return new Promise(resolve => {
      const location = data[userId];
      logger.log(`Got location for ${appSource} user ${userId}: ${JSON.stringify(location)}`);
      resolve(location);
    });
  }

  /**
   * location - { latitude, longitude, originalAddressInput }
   */
  this.saveLocation = function(userId, location) {
    return new Promise(resolve => {
      data[userId] = location;
      logger.log(`Saved location for ${appSource} user ${userId}: ${JSON.stringify(location)}`);
      resolve();
    });
  }
};

const googleDb = new db(APP_SOURCE.GOOGLE);
const alexaDb = new db(APP_SOURCE.ALEXA);

module.exports = {
  googleDb,
  alexaDb
};
