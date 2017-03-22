const Promise = require('promise');
const firebase = require("firebase-admin");
const logger = require('./logger.js').forComponent('db-firebase');

const LOCATION_KEY = 'location';

logger.info('pre_firebase_connect');
try {
  firebase.initializeApp({
    credential: firebase.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIV_KEY
    }),
    databaseURL: process.env.FIREBASE_URL
  });

  logger.info('post_firebase_connect', {
    success: true
  });
} catch (ex) {
  logger.error('post_firebase_connect', {
    success: false,
    error: ex
  });
}

// firebase doesn't like ".", "#", "$", "[", or "]" in keys
// also, each part shouldn't have a / in it
function cleanFirebaseKeyPart(keyPart) {
  return keyPart && keyPart.replace(/[#$\.\/[\]]/g, '-');
}

function createFirebaseKey(appSource, userId) {
  const cleanUserId = cleanFirebaseKeyPart(userId);
  return `${appSource}/users/${cleanUserId}`;
}

function forRequest(appSource, userId, requestContext) {
  return new Firebase(appSource, userId, requestContext);
}

function Firebase(appSource, userId, requestContext = {}) {
  this.appSource = appSource;
  this.userId = userId;
  this.logger = logger.forRequest(appSource, userId, requestContext);
}

Firebase.prototype.getLocation = function() {
  const firebaseKey = createFirebaseKey(this.appSource, this.userId);

  const logger = this.logger;
  logger.debug('pre_get_location', {
    firebaseKey
  });

  return new Promise(resolve => {
    firebase.database().ref(firebaseKey).once('value', data => {
      const locationValue = data && data.val() && data.val()[LOCATION_KEY];

      logger.debug('post_get_location', {
        firebaseKey,
        success: true,
        foundValue: Boolean(locationValue),
        locationValue
      });

      resolve(locationValue);
    }, error => {
      logger.error('post_get_location', {
        firebaseKey,
        success: false,
        error: JSON.stringify(error.toJSON())
      });

      reject(error);
    });
  });
};

Firebase.prototype.saveLocation = function(location) {
  const firebaseKey = createFirebaseKey(this.appSource, this.userId);

  const logger = this.logger;
  logger.debug('pre_update_location', {
    firebaseKey,
    location: JSON.stringify(location)
  });

  firebase.database().ref(firebaseKey).update({
    [LOCATION_KEY]: location
  }, error => {
    const success = !Boolean(error);
    const logLevel = success ? logger.LEVEL.DEBUG : logger.LEVEL.ERROR;

    logger.log(logLevel, 'post_get_location', {
      firebaseKey,
      location: JSON.stringify(location),
      success,
      error: error && JSON.stringify(error.toJSON())
    });
  });
};

module.exports = {
  forRequest
};
