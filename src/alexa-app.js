/* global require module */
'use strict';

const express = require('express');
const alexa = require('alexa-app');

const { APP_SOURCE } = require('./ai-config-appSource.js');
const RequestContext = require('./request-context.js');

const expressApp = express();
const alexaApp = new alexa.app('');

const INTENTS = require('./ai-config-intents.js');

const {
  handleGetMyLocation,
  handleUpdateMyLocation,
  handleNearestBusTimesByRoute,
  handleWelcome,
  handleHelp,
  handleCancel
} = require('./alexa-handlers.js');

function preRequest(alexaRequest, expressRequest) {
  // here we need to copy over the request context
  // so that we can pass it through to alexa
  const requestContext = new RequestContext(expressRequest);
  requestContext.copyTo(alexaRequest);
  return alexaRequest;
}

function configureIntent(alexaApp, intent, handler) {
  [ intent.getName(), intent.getAlexaName() ].forEach(intentName => {
    alexaApp.intent(
      intentName,
      intent.getAlexaSlots(),
      function(request, response) {
        return execHandler(request, response, handler);
      }
    );
  });
}

function execHandler(request, response, handler) {
  const requestContext = new RequestContext(request.data);

  const userId = request.sessionDetails.userId;
  requestContext.setUserId(userId);

  return handler(requestContext, request, response);
}

expressApp.use(function(request, response, next) {
  const requestContext = new RequestContext(request);
  requestContext.setAppSource(APP_SOURCE.ALEXA);
  next();
});

// base URL for checking status
expressApp.get('/status', function(request, response) {
  response.sendStatus(200);
});

configureIntent(alexaApp, INTENTS.WELCOME, handleWelcome);
configureIntent(alexaApp, INTENTS.GET_MY_LOCATION, handleGetMyLocation);
configureIntent(alexaApp, INTENTS.UPDATE_MY_LOCATION, handleUpdateMyLocation);
configureIntent(alexaApp, INTENTS.GET_NEAREST_BUS_BY_ROUTE, handleNearestBusTimesByRoute);
configureIntent(alexaApp, INTENTS.HELP, handleHelp);
configureIntent(alexaApp, INTENTS.CANCEL, handleCancel);

alexaApp.launch(function(request, response) {
  return execHandler(request, response, handleWelcome);
});

alexaApp.sessionEnded(function(request, response) {
  return execHandler(request, response, handleCancel);
});

alexaApp.express({
  expressApp,
  preRequest
});

// TODO add a log when the expressApp starts

module.exports = expressApp;