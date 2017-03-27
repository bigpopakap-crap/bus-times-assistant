/* global process require module */
'use strict';

const Promise = require('promise');
const firebase = require('firebase-admin');

const THIS_COMPONENT_NAME = 'db-firebase';
const initLogger = require('./logger.js').forComponent(THIS_COMPONENT_NAME).forRequest();
const logger = require('./logger.js').forComponent(THIS_COMPONENT_NAME);
const perf = require('./logger-perf.js').forComponent(THIS_COMPONENT_NAME);

const LOCATION_KEY = 'location';

initLogger.info('pre_firebase_connect');
try {
  firebase.initializeApp({
    credential: firebase.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIV_KEY
    }),
    databaseURL: process.env.FIREBASE_URL
  });

  initLogger.info('post_firebase_connect', {
    success: true
  });
} catch (ex) {
  initLogger.error('post_firebase_connect', {
    success: false,
    error: ex
  });
}

// firebase doesn't like ".", "#", "$", "[", or "]" in keys
// also, each part shouldn't have a / in it
function cleanFirebaseKeyPart(keyPart) {
  return keyPart && keyPart.replace(/[#$\.\/[\]]/g, '-');
}

function createFirebaseKey(requestContext) {
  const appSource = requestContext.getAppSource();
  const userId = requestContext.getUserId();

  const cleanUserId = cleanFirebaseKeyPart(userId);
  return `${appSource}/users/${cleanUserId}`;
}

function forRequest(requestContext) {
  return new Firebase(requestContext);
}

function Firebase(requestContext) {
  this.requestContext = requestContext;
  this.logger = logger.forRequest(requestContext);
  this.perf = perf.forRequest(requestContext);
}

Firebase.prototype.getLocation = function() {
  const firebaseKey = createFirebaseKey(this.requestContext);

  const logger = this.logger;
  logger.debug('pre_get_location', {
    firebaseKey
  });
  const perfBeacon = this.perf.start('getLocation');

  return new Promise((resolve, reject) => {
    firebase.database().ref(firebaseKey).once('value', data => {
      const locationValue = data && data.val() && data.val()[LOCATION_KEY];

      logger.debug('post_get_location', {
        firebaseKey,
        success: true,
        foundValue: Boolean(locationValue),
        locationValue
      });

      resolve(locationValue);
      perfBeacon.logEnd();
    }, error => {
      logger.error('post_get_location', {
        firebaseKey,
        success: false,
        error: JSON.stringify(error.toJSON())
      });

      reject(error);
      perfBeacon.logEnd(error);
    });
  });
};

Firebase.prototype.saveLocation = function(location) {
  const firebaseKey = createFirebaseKey(this.requestContext);

  const logger = this.logger;
  logger.debug('pre_update_location', {
    firebaseKey,
    location: JSON.stringify(location)
  });
  const perfBeacon = this.perf.start('getLocation');

  return new Promise((resolve, reject) => {
    firebase.database().ref(firebaseKey).update({
      [LOCATION_KEY]: location
    }, error => {
      const success = !error;
      const logLevel = success ? logger.LEVEL.DEBUG : logger.LEVEL.ERROR;

      logger.log(logLevel, 'post_get_location', {
        firebaseKey,
        location: JSON.stringify(location),
        success,
        error: error && JSON.stringify(error.toJSON())
      });

      if (success) {
        resolve(location);
        perfBeacon.logEnd();
      } else {
        reject(error);
        perfBeacon.logEnd(error);
      }
    });
  });
};

module.exports = {
  forRequest
};
