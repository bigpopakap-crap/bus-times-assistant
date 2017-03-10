'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json({ type: 'application/json' }));

const ApiAiAssistant = require('actions-on-google').ApiAiAssistant;
const GET_MY_LOCATION = 'get_my_location';
const UPDATE_MY_LOCATION = 'update_my_location';
const GET_NEAREST_BUS_TIMES_BY_ROUTE = 'get_nearest_bus_times_by_route';
const GET_NEAREST_BUS_TIMES_BY_ROUTE_FALLBACK = 'get_nearest_bus_times_by_route_fallback';

const {
  handleGetMyLocation,
  handleUpdateMyLocation,
  handleNearestBusTimesByRoute,
  handleNearestBusTimesByRoute_fallback
} = require('./google-handlers.js');

// base URL for checking status
app.get('/status', function(request, response) {
  response.sendStatus(200);
});

app.post('/', function (request, response) {
  const assistant = new ApiAiAssistant({request: request, response: response});

  const actionMap = new Map();
  actionMap.set(GET_MY_LOCATION, handleGetMyLocation);
  actionMap.set(UPDATE_MY_LOCATION, handleUpdateMyLocation);
  actionMap.set(GET_NEAREST_BUS_TIMES_BY_ROUTE, handleNearestBusTimesByRoute);
  actionMap.set(GET_NEAREST_BUS_TIMES_BY_ROUTE_FALLBACK, handleNearestBusTimesByRoute_fallback);

  assistant.handleRequest(actionMap);
});

// TODO add a log when the app starts

module.exports = app;