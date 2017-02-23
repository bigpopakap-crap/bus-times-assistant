'use strict';

// default the config vars
process.env.DEBUG = process.env.DEBUG || 'actions-on-google:*';
process.env.PORT = process.env.PORT || 8080;

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.set('port', process.env.PORT);
app.use(bodyParser.json({ type: 'application/json' }));

const ApiAiAssistant = require('actions-on-google').ApiAiAssistant;
const GET_NEAREST_BUS_TIMES_BY_ROUTE = 'get_nearest_bus_times_by_route';
const GET_NEAREST_BUS_TIMES_BY_ROUTE_FALLBACK = 'get_nearest_bus_times_by_route_fallback';

const {
  handleAskForPermission,
  handleNearestBusTimesByRoute
} = require('./handlers.js');

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
