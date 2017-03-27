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
  handleDefault
} = require('./alexa-handlers.js');

function preRequest(alexaRequest, expressRequest) {
  // here we need to copy over the request context
  // so that we can pass it through to alexa
  const requestContext = new RequestContext(expressRequest);
  requestContext.copyTo(alexaRequest);
  return alexaRequest;
}

function configureIntent(alexaApp, intent, handler) {
  alexaApp.intent(
    intent.getName(),
    intent.getAlexaSlots(),
    function(request, response) {
      const requestContext = new RequestContext(request.data);

      const userId = request.sessionDetails.userId;
      requestContext.setUserId(userId);

      return handler(requestContext, request, response);
    }
  );
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

configureIntent(alexaApp, INTENTS.GET_MY_LOCATION, handleGetMyLocation);
configureIntent(alexaApp, INTENTS.UPDATE_MY_LOCATION, handleUpdateMyLocation);
configureIntent(alexaApp, INTENTS.GET_NEAREST_BUS_BY_ROUTE, handleNearestBusTimesByRoute);
configureIntent(alexaApp, INTENTS.DEFAULT, handleDefault);

alexaApp.express({
  expressApp,
  preRequest
});

// TODO add a log when the expressApp starts

module.exports = expressApp;