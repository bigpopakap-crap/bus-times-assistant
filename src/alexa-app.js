'use strict';

const express = require('express');
const alexa = require('alexa-app');

const expressApp = express();
const alexaApp = new alexa.app('');

const INTENTS = require('./ai-config-intents.js');

const {
  handleGetMyLocation,
  handleUpdateMyLocation,
  handleNearestBusTimesByRoute,
  handleDefault
} = require('./alexa-handlers.js');

function configureIntent(alexaApp, intent, handler) {
  alexaApp.intent(
    intent.getName(),
    intent.getAlexaSlots(),
    handler
  );
}

// base URL for checking status
expressApp.get('/status', function(request, response) {
  response.sendStatus(200);
});

configureIntent(alexaApp, INTENTS.GET_MY_LOCATION, handleGetMyLocation);
configureIntent(alexaApp, INTENTS.UPDATE_MY_LOCATION, handleUpdateMyLocation);
configureIntent(alexaApp, INTENTS.GET_NEAREST_BUS_BY_ROUTE, handleNearestBusTimesByRoute);
configureIntent(alexaApp, INTENTS.DEFAULT, handleDefault);

alexaApp.express({ expressApp });

// TODO add a log when the expressApp starts

module.exports = expressApp;