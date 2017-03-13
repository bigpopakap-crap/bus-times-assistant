"use strict";

const Promise = require('promise');
const { alexaDb } = require('./db.js');

const { busDirectionFromInput } = require('./ai-config-busDirection.js');
const {
  reportMyLocation,
  reportMyLocationUpdate,
  reportNearestStopResult
} = require('./common-assistant.js');

// Alexa doesn't like ampersands in SSML
function cleanResponse(response) {
  return response.replace(/&/g, 'and');
}

function handleGetMyLocation(request, response) {
  const userId = request.sessionDetails.userId;

  // TODO handle errors
  return new Promise(resolve => {
    reportMyLocation(alexaDb, userId, responseText => {
      resolve(responseText);
    });
  }).then(responseText => {
    response.say(responseText);
  });
}

function handleUpdateMyLocation(request, response) {
  const userId = request.sessionDetails.userId;
  const address = request.slot('address');

  // TODO handle errors
  return new Promise(resolve => {
    reportMyLocationUpdate(alexaDb, userId, address, responseText => {
      resolve(responseText);
    });
  }).then(responseText => {
    response.say(responseText);
  });
}

function handleNearestBusTimesByRoute(request, response) {
  const userId = request.sessionDetails.userId;

  const busRoute = request.slot("busRoute");
  const busDirection = busDirectionFromInput(
    request.slot("busDirection")
  );

  // TODO handle errors
  return alexaDb.getLocation(userId).then(location => {
    return new Promise(resolve => {
      if (location) {
        reportNearestStopResult(location, busRoute, busDirection, function(responseText) {
          resolve(responseText);
        });
      } else {
        resolve('You have not set your location yet. You can set one by saying "Update my location".');
      }
    });
  }).then(function(responseText) {
    response.say(cleanResponse(responseText));
  });
}

module.exports = {
  handleGetMyLocation,
  handleUpdateMyLocation,
  handleNearestBusTimesByRoute
};
