'use strict';

const { APP_SOURCE } = require('./ai-config-appSource.js');
const INTENTS = require('./ai-config-intents.js');
const { busDirectionFromInput } = require('./ai-config-busDirection.js');
const CommonAssistant = require('./common-assistant.js');

const Db = require('./db.js');

const THIS_COMPONENT_NAME = 'google-handlers';
const logger = require('./logger.js').forComponent(THIS_COMPONENT_NAME);
const metrics = require('./logger-metrics.js').forComponent(THIS_COMPONENT_NAME);
const perf = require('./logger-perf.js').forComponent(THIS_COMPONENT_NAME);

function cleanDeviceLocation(deviceLocation) {
  return {
    latitude: deviceLocation.coordinates.latitude,
    longitude: deviceLocation.coordinates.longitude,
    address: deviceLocation.address,
    originalAddressInput: deviceLocation.address,
    originalAddressSource: 'google device'
  };
}

function handleGetMyLocation(requestContext, assistant) {
  const userId = assistant.getUser().user_id;

  metrics.forRequest(requestContext)
         .logIntent(INTENTS.GET_MY_LOCATION);
  const perfBeacon = perf.forRequest(requestContext)
          .start('handleGetMyLocation');

  const commonAss = CommonAssistant.forRequest(requestContext);

  commonAss.reportMyLocation(response => {
    assistant.tell(response);

    perfBeacon.logEnd();
  });
}

function handleUpdateMyLocation(requestContext, assistant) {
  const userId = assistant.getUser().user_id;
  const address = assistant.getArgument('address');

  metrics.forRequest(requestContext)
         .logIntent(INTENTS.UPDATE_MY_LOCATION, {
           address
         });
  const perfBeacon = perf.forRequest(requestContext)
          .start('handleUpdateMyLocation', {
            address
          });

  const commonAss = CommonAssistant.forRequest(requestContext);

  commonAss.reportMyLocationUpdate(address, response => {
    assistant.tell(response);
    perfBeacon.logEnd();
  });
}

/**
 * Handles the initial request for bus times. Here, we check if we already
 * have the user's location, and either ask for permission or
 * answer the query immediately
 */
function handleNearestBusTimesByRoute(requestContext, assistant) {
  const userId = assistant.getUser().user_id;

  const busRoute = assistant.getArgument('busRoute');
  const busDirection = busDirectionFromInput(
    assistant.getArgument('busDirection')
  );

  metrics.forRequest(requestContext)
         .logIntent(INTENTS.GET_NEAREST_BUS_BY_ROUTE, {
           busRoute,
           busDirection
         });
  const perfBeacon = perf.forRequest(requestContext)
          .start('handleNearestBusTimesByRoute', {
            isFallbackIntent: false,
            busRoute,
            busDirection
          });

  const googleDb = Db.forRequest(requestContext);
  const commonAss = CommonAssistant.forRequest(requestContext);

  // TODO handle errors
  googleDb.getLocation().then(location => {
    if (location) {
      // just answer the query because we have a saved location
      commonAss.reportNearestStopResult(location, busRoute, busDirection, response => {
        assistant.tell(response);
      });

      perfBeacon.logEnd(null, {
        askedForLocationPermission: false
      });
    } else {
      // request permission for location, and save parameters
      assistant.data.busRoute = busRoute;
      assistant.data.busDirection = busDirection;

      const permission = assistant.SupportedPermissions.DEVICE_PRECISE_LOCATION;
      assistant.askForPermission('To look up routes near you', permission);

      metrics.forRequest(requestContext).logLocationPermissionRequest();

      perfBeacon.logEnd(null, {
        askedForLocationPermission: true
      });
    }
  });
}

/**
 * Handles the request for bus times AFTER prompting the user for location
 * permission. Here, we check if they granted permission and save it before
 * answering the query
 */
function handleNearestBusTimesByRoute_fallback(requestContext, assistant) {
  const userId = assistant.getUser().user_id;

  const busRoute = assistant.data.busRoute;
  const busDirection = assistant.data.busDirection;

  metrics.forRequest(requestContext)
         .logIntent(INTENTS.GET_NEAREST_BUS_BY_ROUTE_FALLBACK, {
           wasPermissionGranted: assistant.isPermissionGranted(),
           busRoute,
           busDirection
         });
  metrics.forRequest(requestContext)
         .logLocationPermissionResponse(assistant.isPermissionGranted());

  if (!assistant.isPermissionGranted()) {
    assistant.tell('To proceed, I\'ll need your location. If you do not want to grant access, you can update your address by saying "Update my location"');
    return;
  }
  const deviceLocation = cleanDeviceLocation(assistant.getDeviceLocation());

  // save the user's location, but we don't need to wait for that call to succeed
  const googleDb = Db.forRequest(requestContext);
  googleDb.saveLocation(deviceLocation);

  const perfBeacon = perf.forRequest(requestContext)
            .start('handleNearestBusTimesByRoute', {
              isFallbackIntent: true,
              wasPermissionGranted: assistant.isPermissionGranted(),
              busRoute,
              busDirection
            });

  const commonAss = CommonAssistant.forRequest(requestContext);

  commonAss.reportNearestStopResult(deviceLocation, busRoute, busDirection, response => {
    assistant.tell(response);
    perfBeacon.logEnd();
  });
}

module.exports = {
  handleGetMyLocation,
  handleUpdateMyLocation,
  handleNearestBusTimesByRoute,
  handleNearestBusTimesByRoute_fallback
};
