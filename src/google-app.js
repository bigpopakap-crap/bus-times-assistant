'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json({ type: 'application/json' }));

const ApiAiAssistant = require('actions-on-google').ApiAiAssistant;
const INTENTS = require('./ai-config-intents.js');

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
  actionMap.set(INTENTS.GET_MY_LOCATION.getName(), handleGetMyLocation);
  actionMap.set(INTENTS.UPDATE_MY_LOCATION.getName(), handleUpdateMyLocation);
  actionMap.set(INTENTS.GET_NEAREST_BUS_BY_ROUTE.getName(), handleNearestBusTimesByRoute);
  actionMap.set(INTENTS.GET_NEAREST_BUS_BY_ROUTE_FALLBACK.getName(), handleNearestBusTimesByRoute_fallback);

  assistant.handleRequest(actionMap);
});

// TODO add a log when the app starts

module.exports = app;