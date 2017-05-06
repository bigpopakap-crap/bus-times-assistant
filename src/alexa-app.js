/* global require process module */
'use strict';

const express = require('express');
const alexa = require('alexa-app');

const { APP_SOURCE } = require('./ai-config-appSource.js');
const { RequestContext } = require('mrkapil/logging');

const expressApp = express();
const alexaApp = new alexa.app('');

const INTENTS = require('./ai-config-intents.js');

const dashbot = require('dashbot')(process.env.DASHBOT_API_KEY).alexa;

const {
  handleGetMyLocation,
  handleUpdateMyLocation,
  handleNearestBusTimesByRoute,
  handleWelcome,
  handleHelp,
  handleThankYou,
  handleCancel
} = require('./alexa-handlers.js');

expressApp.use(function(request, response, next) {
  const requestContext = new RequestContext(request);
  requestContext.setAppSource(APP_SOURCE.ALEXA);
  next();
});

function preRequest(alexaRequest, expressRequest) {
  // we don't need to check whether this is just a health check
  // ping because Alexa doesn't do that. If it ever does, then
  // we will need to update this (and the postRequest)
  dashbot.logIncoming(expressRequest.body);

  // copy over the request context
  // so that we can pass it through to alexa
  const requestContext = new RequestContext(expressRequest);
  requestContext.copyTo(alexaRequest);

  return alexaRequest;
}

function postRequest(appResponse, expressRequest) {
  dashbot.logOutgoing(expressRequest.body, appResponse);
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

// base URL for checking status
expressApp.get('/status', function(request, response) {
  response.sendStatus(200);
});

configureIntent(alexaApp, INTENTS.WELCOME, handleWelcome);
configureIntent(alexaApp, INTENTS.GET_MY_LOCATION, handleGetMyLocation);
configureIntent(alexaApp, INTENTS.UPDATE_MY_LOCATION, handleUpdateMyLocation);
configureIntent(alexaApp, INTENTS.GET_NEAREST_BUS_BY_ROUTE, handleNearestBusTimesByRoute);
configureIntent(alexaApp, INTENTS.HELP, handleHelp);
configureIntent(alexaApp, INTENTS.THANK_YOU, handleThankYou);
configureIntent(alexaApp, INTENTS.CANCEL, handleCancel);

alexaApp.launch(function(request, response) {
  return execHandler(request, response, handleWelcome);
});

alexaApp.sessionEnded(function(request, response) {
  return execHandler(request, response, handleCancel);
});

alexaApp.express({
  expressApp,
  preRequest,
  postRequest
});

// TODO add a log when the expressApp starts

module.exports = expressApp;