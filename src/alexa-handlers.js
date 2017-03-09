"use strict";

const Promise = require('promise');

const { busDirectionFromInput } = require('./ai-config-busDirection.js');
const { reportNearestStopResult } = require('./nextbus-assistant.js');

// Alexa doesn't like ampersands in SSML
function cleanResponse(response) {
  return response.replace(/&/g, 'and');
}

function handleNearestBusTimesByRoute(request, response) {
  // TODO don't hardcode the location
  const deviceLocation = {
    coordinates: {
      latitude: 37.746457,
      longitude: -122.413341
    }
  };
  const busRoute = request.slot("busRoute");
  const busDirection = busDirectionFromInput(
    request.slot("busDirection")
  );

  return new Promise(resolve => {
    reportNearestStopResult(deviceLocation, busRoute, busDirection, function(responseText) {
      resolve(responseText);
    });
  }).then(function(responseText) {
    response.say(cleanResponse(responseText));
  });
}

module.exports = {
  handleNearestBusTimesByRoute
};
