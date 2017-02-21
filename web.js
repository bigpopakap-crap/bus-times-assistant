'use strict';

// Enable actions client library debugging
process.env.DEBUG = 'actions-on-google:*';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-json');

const app = express();
app.set('port', (process.env.PORT || 8080));
app.use(bodyParser.json({type: 'application/json'}));

// TODO(kapil) use a more reliable backend
const nbClient = request.createClient('http://restbus.info/');

const ApiAiAssistant = require('actions-on-google').ApiAiAssistant;
const GET_NEAREST_BUS_TIMES_BY_ROUTE = 'get_nearest_bus_times_by_route';

function contains(bigStr, smallStr, caseSensitive = false) {
  if (!caseSensitive) {
    bigStr = bigStr.toLowerCase();
    smallStr = smallStr.toLowerCase();
  }

  return bigStr.indexOf(smallStr) >= 0;
}

function genericError(assistant) {
  assistant.tell('Sorry, there was an error. Please try again.');
}

function generatePredictionResponse(p) {
  const pTypeLabel = p.isScheduleBased ? 'is scheduled to arrive' : 'will arrive';
  const minuteLabel = p.minutes == 1 ? 'minute' : 'minutes';
  return `${pTypeLabel} in ${p.minutes} ${minuteLabel}`;
}

function getNearestStopId(busRoute, busDirection, callBackFn) {
  callBackFn(null, 5565);
}

function askForPermission(assistant) {
  if (assistant.getContexts().indexOf('_actions_on_google_') > 0) {
    if (!assistant.isPermissionGranted()) {
      const permission = assistant.SupportedPermissions.DEVICE_PRECISE_LOCATION;
      assistant.askForPermission('To look up routes near you', permission);
    }
    return true;
  } else {
    return false;
  }
}

function handleNearestBusTimesByRoute(assistant) {
  if (askForPermission(assistant)) {
    return; // don't do anything until they've granted permission
  }

  // TODO(kapil) validate that direction is a valid enum, and route is valid
  // TODO(kapil) don't do just numbers, also look for 14R versions
  const busRoute = assistant.getArgument('busRoute');
  const busDirection = assistant.getArgument('busDirection') || 'inbound';

  getNearestStopId(busRoute, busDirection, function(err, stopId) {
    if (err) {
      genericError(assistant);
      return;
    }

    const queryUrl = `/api/agencies/sf-muni/routes/${busRoute}/stops/${stopId}/predictions`;
    nbClient.get(queryUrl, function(err, res, body) {
      if (err) {
        genericError(assistant);
        return;
      }

      const allPredictions = (body && body[0] && body[0].values) || [];
      const relevantPredictions = allPredictions
        .filter(p => contains(p.direction.title, busDirection))
        .sort((a, b) => a.epochTime - b.epochTime);

      let response = `No predictions found for ${busDirection} route ${busRoute}`;

      if (relevantPredictions.length > 0) {
        const p1 = relevantPredictions[0];
        const p1Response = generatePredictionResponse(p1);

        response = `Next ${busDirection} ${busRoute} ${p1Response}.`;

        if (relevantPredictions.length > 1) {
          const p2 = relevantPredictions[1];
          const p2Response = generatePredictionResponse(p2);
          response = `${response} After that, the next ${busDirection} ${busRoute} ${p2Response}.`;
        }
      }

      // TODO(kapil) echo back the stop name
      assistant.tell(response);
    });
  });
}

app.get('/', function(request, response) {
  response.sendStatus(200);
});

app.post('/', function (request, response) {
  const assistant = new ApiAiAssistant({request: request, response: response});

  const actionMap = new Map();
  actionMap.set(GET_NEAREST_BUS_TIMES_BY_ROUTE, handleNearestBusTimesByRoute);

  assistant.handleRequest(actionMap);
});

// Start the server
var server = app.listen(app.get('port'), function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});