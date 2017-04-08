/* global require module */
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
  handleNearestBusTimesByRoute_fallback,
  handleDefault,
  handleHelp
} = require('./google-handlers.js');

function configureIntent(request, actionMap, intent, handler) {
  actionMap.set(
    intent.getName(),
    function(assistant) {
      const requestContext = new RequestContext(request);

      const userId = assistant.getUser().userId;
      requestContext.setUserId(userId);

      handler(requestContext, assistant);
    }
  );
}

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

  const actionMap = new Map();
  configureIntent(request, actionMap, INTENTS.GET_MY_LOCATION, handleGetMyLocation);
  configureIntent(request, actionMap, INTENTS.UPDATE_MY_LOCATION, handleUpdateMyLocation);
  configureIntent(request, actionMap, INTENTS.GET_NEAREST_BUS_BY_ROUTE, handleNearestBusTimesByRoute);
  configureIntent(request, actionMap, INTENTS.GET_NEAREST_BUS_BY_ROUTE_FALLBACK, handleNearestBusTimesByRoute_fallback);
  configureIntent(request, actionMap, INTENTS.DEFAULT, handleDefault);
  configureIntent(request, actionMap, INTENTS.HELP, handleHelp);

  assistant.handleRequest(actionMap);
});

// TODO add a log when the app starts

module.exports = app;