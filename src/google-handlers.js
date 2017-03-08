'use strict';

const { busDirectionFromInput } = require('./ai-config-busDirection.js');
const { contains, pluralPhrase } = require('./utils.js');
const { NEXTBUS_ERRORS, getNearestStopResult } = require('./nextbus-adapter.js');

function genericError(assistant) {
  assistant.tell('Sorry, there was an error. Please try again.');
}

function generatePredictionResponse(p) {
  // special case for arriving
  if (p.minutes === 0) {
    return p.isScheduleBased ? 'is scheduled to arrive now' : 'is arriving now';
  } else {
    const pTypeLabel = p.isScheduleBased ? 'is scheduled to arrive' : 'will arrive';
    const minutePhrase = pluralPhrase(p.minutes, 'minute', 'minutes');
    return `${pTypeLabel} in ${minutePhrase}`;
  }
}

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

  // TODO(kapil) is there a cleaner way to get these params?
  const busRoute = assistant.data.busRoute;
  const busDirection = assistant.data.busDirection;

  const deviceLocation = assistant.getDeviceLocation();

  getNearestStopResult(deviceLocation, busRoute, busDirection, function(err, result) {
    if (err) {
      switch (err) {
        case NEXTBUS_ERRORS.NOT_FOUND:
          assistant.tell(`No nearby stops found for ${busDirection} route ${busRoute}.`);
          break;
        default:
          genericError(assistant);
          break;
      }

      return;
    }

    const allPredictions = (result && result.values) || [];
    const relevantPredictions = allPredictions
      .filter(p => contains(p.direction.title, busDirection))
      .sort((a, b) => a.epochTime - b.epochTime);

    if (relevantPredictions.length > 0) {
      const p1 = relevantPredictions[0];
      const p1Response = generatePredictionResponse(p1);

      let response = `The next ${busDirection} ${busRoute} from ${result.busStop} ${p1Response}`;

      if (relevantPredictions.length > 1) {
        const p2 = relevantPredictions[1];

        if (p2.isScheduleBased) {
          const p2Response = generatePredictionResponse(p2);
          response = `${response}. After that, the next one ${p2Response}`;
        } else {
          const minutePhrase = pluralPhrase(p2.minutes, 'minute', 'minutes');
          response = `${response}, then again in ${minutePhrase}`;
        }
      }

      assistant.tell(`${response}.`);
    } else {
      assistant.tell(`No predictions found for ${busDirection} route ${busRoute}`);
    }
  });
}

module.exports = {
  handleAskForPermission,
  handleNearestBusTimesByRoute
};
