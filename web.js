'use strict';

// Enable actions client library debugging
process.env.DEBUG = 'actions-on-google:*';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-json');

const app = express();
app.set('port', (process.env.PORT || 8080));
app.use(bodyParser.json({type: 'application/json'}));

const nbClient = request.createClient('http://restbus.info/');

const ApiAiAssistant = require('actions-on-google').ApiAiAssistant;
const GET_NEAREST_BUS_TIMES_BY_ROUTE = 'get_nearest_bus_times_by_route';

function generatePredictionResponse(p) {
  const pTypeLabel = p.isScheduleBased ? 'is scheduled to arrive' : 'will arrive';
  const minuteLabel = p.minutes == 1 ? 'minute' : 'minutes';
  return `${pTypeLabel} in ${p.minutes} ${minuteLabel}`;
}

function handleNearestBusTimesByRoute(assistant) {
  assistant.tell('It worked!');
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