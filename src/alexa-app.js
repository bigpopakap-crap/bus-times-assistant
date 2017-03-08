'use strict';

const express = require('express');
const alexa = require('alexa-app');

const expressApp = express();
const alexaApp = new alexa.app('');

const INTENT_NAME = 'Get_next_bus_by_number';
const { handleNearestBusTimesByRoute } = require('./alexa-handlers.js');

// base URL for checking status
expressApp.get('/status', function(request, response) {
  response.sendStatus(200);
});

alexaApp.intent(
  INTENT_NAME,
  {
    slots: { busRoute: 'AMAZON.NUMBER', busDirection: 'BUSDIRECTION' }
  },
  handleNearestBusTimesByRoute
);

alexaApp.express({ expressApp });

// TODO add a console.log when the expressApp starts

module.exports = expressApp;