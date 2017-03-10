'use strict';

const { busDirectionFromInput } = require('./ai-config-busDirection.js');
const { reportNearestStopResult } = require('./nextbus-assistant.js');

const { googleDb } = require('./db.js');

function cleanDeviceLocation(deviceLocation) {
  return {
    latitude: deviceLocation.coordinates.latitude,
    longitude: deviceLocation.coordinates.longitude,
    originalAddressInput: deviceLocation.address
  };
}

/**
 * Handles the initial request for bus times. Here, we check if we already
 * have the user's location, and either ask for permission or
 * answer the query immediately
 */
function handleNearestBusTimesByRoute(assistant) {
  const userId = assistant.getUser().user_id;

  const busRoute = assistant.getArgument('busRoute');
  const busDirection = busDirectionFromInput(
    assistant.getArgument('busDirection')
  );

  // TODO handle errors
  googleDb.getLocation(userId).then(location => {
    if (location) {
      // just answer the query because we have a saved location
      reportNearestStopResult(location, busRoute, busDirection, function(response) {
        assistant.tell(response);
      });
    } else {
      // request permission for location, and save parameters
      assistant.data.busRoute = busRoute;
      assistant.data.busDirection = busDirection;

      const permission = assistant.SupportedPermissions.DEVICE_PRECISE_LOCATION;
      assistant.askForPermission('To look up routes near you', permission);
    }
  });
}

/**
 * Handles the request for bus times AFTER prompting the user for location
 * permission. Here, we check if they granted permission and save it before
 * answering the query
 */
function handleNearestBusTimesByRoute_fallback(assistant) {
  const userId = assistant.getUser().user_id;

  if (!assistant.isPermissionGranted()) {
    assistant.tell('Sorry, you must grant permission to proceed');
    return;
  }

  const deviceLocation = process.env.MOCK_DEVICE_LOCATION
              ? JSON.parse(process.env.MOCK_DEVICE_LOCATION)
              : cleanDeviceLocation(assistant.getDeviceLocation());
  const busRoute = assistant.data.busRoute;
  const busDirection = assistant.data.busDirection;

  // save the user's location, but we don't need to wait for that call to succeed
  googleDb.saveLocation(userId, deviceLocation);

  reportNearestStopResult(deviceLocation, busRoute, busDirection, function(response) {
    assistant.tell(response);
  });
}

module.exports = {
  handleNearestBusTimesByRoute,
  handleNearestBusTimesByRoute_fallback
};
