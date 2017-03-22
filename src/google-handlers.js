'use strict';

const { APP_SOURCE } = require('./ai-config-appSource.js');
const INTENTS = require('./ai-config-intents.js');
const { busDirectionFromInput } = require('./ai-config-busDirection.js');
const {
  reportMyLocation,
  reportMyLocationUpdate,
  reportNearestStopResult
} = require('./common-assistant.js');

const Db = require('./db.js');
const logger = require('./logger.js').forComponent('google-handlers');

function cleanDeviceLocation(deviceLocation) {
  return {
    latitude: deviceLocation.coordinates.latitude,
    longitude: deviceLocation.coordinates.longitude,
    address: deviceLocation.address,
    originalAddressInput: deviceLocation.address,
    originalAddressSource: 'google device'
  };
}

function handleGetMyLocation(assistant) {
  const userId = assistant.getUser().user_id;

  // TODO add requestContext
  logger.forRequest(APP_SOURCE.GOOGLE, userId)
        .metricsUsage(INTENTS.GET_MY_LOCATION.getName());

  reportMyLocation(APP_SOURCE.GOOGLE, userId, response => {
    assistant.tell(response);
  });
}

function handleUpdateMyLocation(assistant) {
  const userId = assistant.getUser().user_id;
  const address = assistant.getArgument('address');

  // TODO add requestContext
  logger.forRequest(APP_SOURCE.GOOGLE, userId)
        .metricsUsage(INTENTS.UPDATE_MY_LOCATION.getName(), {
          address
        });

  reportMyLocationUpdate(APP_SOURCE.GOOGLE, userId, address, response => {
    assistant.tell(response);
  });
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

  logger.forRequest(APP_SOURCE.GOOGLE, userId)
          .metricsUsage(INTENTS.GET_NEAREST_BUS_BY_ROUTE.getName(), {
            busRoute,
            busDirection
          });

  // TODO add requestContext
  const googleDb = Db.forRequest(APP_SOURCE.GOOGLE, userId);

  // TODO handle errors
  googleDb.getLocation().then(location => {
    if (location) {
      // just answer the query because we have a saved location
      reportNearestStopResult(APP_SOURCE.GOOGLE, userId, location, busRoute, busDirection, response => {
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

  const busRoute = assistant.data.busRoute;
  const busDirection = assistant.data.busDirection;

  logger.forRequest(APP_SOURCE.GOOGLE, userId)
            .metricsUsage(INTENTS.GET_NEAREST_BUS_BY_ROUTE_FALLBACK.getName(), {
              wasPermissionGranted: assistant.isPermissionGranted(),
              busRoute,
              busDirection
            });

  if (!assistant.isPermissionGranted()) {
    assistant.tell('To proceed, I\'ll need your location. If you do not want to grant access, you can update your address by saying "Update my location"');
    return;
  }
  const deviceLocation = cleanDeviceLocation(assistant.getDeviceLocation());

  // save the user's location, but we don't need to wait for that call to succeed
  // TODO add requestContext
  const googleDb = Db.forRequest(APP_SOURCE.GOOGLE, userId);
  googleDb.saveLocation(deviceLocation);

  reportNearestStopResult(APP_SOURCE.GOOGLE, userId, deviceLocation, busRoute, busDirection, response => {
    assistant.tell(response);
  });
}

module.exports = {
  handleGetMyLocation,
  handleUpdateMyLocation,
  handleNearestBusTimesByRoute,
  handleNearestBusTimesByRoute_fallback
};
