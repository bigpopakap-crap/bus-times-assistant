/* global require module process */
'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const { APP_SOURCE } = require('./ai-config-appSource.js');
const RequestContext = require('./request-context.js');
const GoogleAssistant = require('./google-assistant.js');

const app = express();
app.use(bodyParser.json({ type: 'application/json' }));

const ApiAiAssistant = require('actions-on-google').ApiAiAssistant;
const INTENTS = require('./ai-config-intents.js');

const dashbot = require('dashbot')(process.env.DASHBOT_API_KEY).google;

const {
  handleGetMyLocation,
  handleUpdateMyLocation,
  handleNearestBusTimesByRoute,
  handleNearestBusTimesByRoute_fallback,
  handleWelcome,
  handleHelp,
  handleThankYou,
  handleCancel
} = require('./google-handlers.js');

function configureIntent(request, actionMap, intent, handler) {
  actionMap.set(intent.getName(), assistant => {
    const requestContext = new RequestContext(request);
    handler(requestContext, assistant);
  });
}

app.use(function(request, response, next) {
  // set appSource
  const requestContext = new RequestContext(request);
  requestContext.setAppSource(APP_SOURCE.GOOGLE);

  // set userId
  const assistant = new ApiAiAssistant({ request, response });
  const userId = assistant.getUser().userId;
  requestContext.setUserId(userId);

  next();
});

// base URL for checking status
app.get('/status', function(request, response) {
  response.sendStatus(200);
});

app.post('/', function (request, response) {
  const requestContext = new RequestContext(request);
  const assistant = new ApiAiAssistant({ request, response });
  const googleAss = new GoogleAssistant(assistant, requestContext);

  if (!googleAss.isHealthCheck()) {
    dashbot.configHandler(assistant);
  }

  const actionMap = new Map();
  configureIntent(request, actionMap, INTENTS.WELCOME, handleWelcome);
  configureIntent(request, actionMap, INTENTS.GET_MY_LOCATION, handleGetMyLocation);
  configureIntent(request, actionMap, INTENTS.UPDATE_MY_LOCATION, handleUpdateMyLocation);
  configureIntent(request, actionMap, INTENTS.GET_NEAREST_BUS_BY_ROUTE, handleNearestBusTimesByRoute);
  configureIntent(request, actionMap, INTENTS.GET_NEAREST_BUS_BY_ROUTE_FALLBACK, handleNearestBusTimesByRoute_fallback);
  configureIntent(request, actionMap, INTENTS.HELP, handleHelp);
  configureIntent(request, actionMap, INTENTS.THANK_YOU, handleThankYou);
  configureIntent(request, actionMap, INTENTS.CANCEL, handleCancel);

  assistant.handleRequest(actionMap);
});

// TODO add a log when the app starts

module.exports = app;
