"use strict";

const Promise = require('promise');
const { alexaDb } = require('./db.js');

const { busDirectionFromInput } = require('./ai-config-busDirection.js');
const { reportNearestStopResult } = require('./common-assistant.js');

// Alexa doesn't like ampersands in SSML
function cleanResponse(response) {
  return response.replace(/&/g, 'and');
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
        // TODO remove this whole code path when we actually get the user's location
        const deviceLocation = {
          latitude: 37.746457,
          longitude: -122.413341
        };
        alexaDb.saveLocation(userId, deviceLocation);

        resolve('You must provide your location to continue');
      }
    });
  }).then(function(responseText) {
    response.say(cleanResponse(responseText));
  });
}

module.exports = {
  handleNearestBusTimesByRoute
};
