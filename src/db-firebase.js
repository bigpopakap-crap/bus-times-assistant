const Promise = require('promise');
const firebase = require("firebase-admin");

const LOCATION_KEY = 'location';

firebase.initializeApp({
  credential: firebase.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIV_KEY
  }),
  databaseURL: process.env.FIREBASE_URL
});

// firebase doesn't like ".", "#", "$", "[", or "]" in keys
// also, each part shouldn't have a / in it
function cleanFirebaseKeyPart(keyPart) {
  return keyPart && keyPart.replace(/[#$\.\/[\]]/g, '-');
}

function createFirebaseKey(appSource, userId) {
  const cleanUserId = cleanFirebaseKeyPart(userId);
  return `${appSource}/users/${cleanUserId}`;
}

function getLocation(appSource, userId) {
  const firebaseKey = createFirebaseKey(appSource, userId);

  return new Promise(resolve => {
    firebase.database().ref(firebaseKey).once('value', data => {
      resolve(data && data.val() && data.val()[LOCATION_KEY]);
    });
  });
}

function saveLocation(appSource, userId, location) {
  const firebaseKey = createFirebaseKey(appSource, userId);

  firebase.database().ref(firebaseKey).update({
    [LOCATION_KEY]: location
  });
}

module.exports = {
  getLocation,
  saveLocation
};
