'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const { APP_SOURCE } = require('./ai-config-appSource.js');
const RequestContext = require('./request-context.js');

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

app.use(function(request, response, next) {
  const requestContext = new RequestContext(request);
  requestContext.setAppSource(APP_SOURCE.GOOGLE);
  next();
});

// base URL for checking status
app.get('/status', function(request, response) {
  response.sendStatus(200);
});

app.post('/', function (request, response) {
  const assistant = new ApiAiAssistant({
    request,
    response
  });

  console.log(assistant.request_);

  const actionMap = new Map();
  actionMap.set(INTENTS.GET_MY_LOCATION.getName(), handleGetMyLocation);
  actionMap.set(INTENTS.UPDATE_MY_LOCATION.getName(), handleUpdateMyLocation);
  actionMap.set(INTENTS.GET_NEAREST_BUS_BY_ROUTE.getName(), handleNearestBusTimesByRoute);
  actionMap.set(INTENTS.GET_NEAREST_BUS_BY_ROUTE_FALLBACK.getName(), handleNearestBusTimesByRoute_fallback);

  assistant.handleRequest(actionMap);
});

// TODO add a log when the app starts

module.exports = app;