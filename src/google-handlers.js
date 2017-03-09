'use strict';

const { busDirectionFromInput } = require('./ai-config-busDirection.js');
const { reportNearestStopResult } = require('./nextbus-assistant.js');

function handleAskForPermission(assistant) {
  // TODO(kapil) validate that direction is a valid enum, and route is valid
  const busRoute = assistant.getArgument('busRoute');
  const busDirection = busDirectionFromInput(
    assistant.getArgument('busDirection')
  );

  assistant.data.busRoute = busRoute;
  assistant.data.busDirection = busDirection;

  const permission = assistant.SupportedPermissions.DEVICE_PRECISE_LOCATION;
  assistant.askForPermission('To look up routes near you', permission);
}

function handleNearestBusTimesByRoute(assistant) {
  if (!assistant.isPermissionGranted()) {
    assistant.tell('Sorry, you must grant permission to proceed');
    return;
  }

  const deviceLocation = assistant.getDeviceLocation();
  const busRoute = assistant.data.busRoute;
  const busDirection = assistant.data.busDirection;

  reportNearestStopResult(deviceLocation, busRoute, busDirection, function(response) {
    assistant.tell(response);
  });
}

module.exports = {
  handleAskForPermission,
  handleNearestBusTimesByRoute
};
