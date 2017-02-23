'use strict';

// default the config vars
process.env.DEBUG = process.env.DEBUG || 'actions-on-google:*';
process.env.PORT = process.env.PORT || 8080;

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-json');

const app = express();
app.set('port', process.env.PORT);
app.use(bodyParser.json({ type: 'application/json' }));

const nbClient = request.createClient('http://restbus.info/');
const AGENCY = 'sf-muni';

const ApiAiAssistant = require('actions-on-google').ApiAiAssistant;
const GET_NEAREST_BUS_TIMES_BY_ROUTE = 'get_nearest_bus_times_by_route';
const GET_NEAREST_BUS_TIMES_BY_ROUTE_FALLBACK = 'get_nearest_bus_times_by_route_fallback';

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

function pluralPhrase(count, singularLabel, pluralLabel) {
  return count == 1 ? `${count} ${singularLabel}` : `${count} ${pluralLabel}`;
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

function cleanStopTitle(stopTitle) {
  const prefixLower = 'stop:';

  if (stopTitle.toLowerCase().startsWith(prefixLower)) {
    stopTitle = stopTitle.substring(prefixLower.length).trim();
  }
  
  return stopTitle;
}

function getNearestStopResult(assistant, deviceLocation, busRoute, busDirection, callBackFn) {
  const { latitude, longitude } = deviceLocation.coordinates;
  const queryUrl = `/api/locations/${latitude},${longitude}/predictions`;
  nbClient.get(queryUrl, function(err, res, body) {
    if (err) {
      callBackFn(true);
      genericError(assistant);
      return;
    }

    const allResults = body || [];
    const busResults = allResults.filter(r => r.agency.id === AGENCY)
                                 .filter(r => r.route.id === `${busRoute}`);
                                 // TODO(kapil) filter by direction!
    if (busResults.length <= 0) {
      assistant.tell(`No nearby stops found for ${busDirection} route ${busRoute}.`);
      callBackFn(true);
    } else {
      const sortedResults = busResults.sort((a, b) => parseFloat(a.stop.distance) - parseFloat(b.stop.distance));
      callBackFn(false, sortedResults[0]);
    }
  });
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

  getNearestStopResult(assistant, deviceLocation, busRoute, busDirection, function(err, result) {
    if (err) {
      // don't do anything else... the function should have already returned
      // an error to the user
      return;
    }
    
    const busStop = cleanStopTitle(result.stop.title);

    const allPredictions = (result && result.values) || [];
    const relevantPredictions = allPredictions
      .filter(p => contains(p.direction.title, busDirection))
      .sort((a, b) => a.epochTime - b.epochTime);

    if (relevantPredictions.length > 0) {
      const p1 = relevantPredictions[0];
      const p1Response = generatePredictionResponse(p1);

      let response = `The next ${busDirection} ${busRoute} from ${busStop} ${p1Response}`;

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

function handleAskForPermission(assistant) {
  // TODO(kapil) validate that direction is a valid enum, and route is valid
  const busRoute = assistant.getArgument('busRoute');
  const busDirection = assistant.getArgument('busDirection');
  assistant.data.busRoute = busRoute;
  assistant.data.busDirection = busDirection;

  const permission = assistant.SupportedPermissions.DEVICE_PRECISE_LOCATION;
  assistant.askForPermission('To look up routes near you', permission);
}

app.get('/', function(request, response) {
  response.sendStatus(200);
});

app.post('/', function (request, response) {
  const assistant = new ApiAiAssistant({request: request, response: response});

  const actionMap = new Map();
  actionMap.set(GET_NEAREST_BUS_TIMES_BY_ROUTE, handleAskForPermission);
  actionMap.set(GET_NEAREST_BUS_TIMES_BY_ROUTE_FALLBACK, handleNearestBusTimesByRoute);

  assistant.handleRequest(actionMap);
});

// Start the server
var server = app.listen(app.get('port'), function () {
  console.log('App listening on port %s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});
