'use strict';

const express = require('express');
const alexa = require('alexa-app');

const expressApp = express();
const alexaApp = new alexa.app('');

const GET_MY_LOCATION = 'Get_my_location';
const UPDATE_MY_LOCATION = 'Update_my_location';
const GET_BUS_TIMES = 'Get_next_bus_by_number';
const DEFAULT_INTENT = 'DefaultWelcomeIntent';

const UPDATE_MY_LOCATION_SLOTS = {
  slots: { address: 'AMAZON.PostalAddress' }
};
const GET_BUS_TIMES_SLOTS = {
  slots: { busRoute: 'AMAZON.NUMBER',
           busDirection: 'BUSDIRECTION' }
};

const {
  handleGetMyLocation,
  handleUpdateMyLocation,
  handleNearestBusTimesByRoute,
  handleDefault
} = require('./alexa-handlers.js');

// base URL for checking status
expressApp.get('/status', function(request, response) {
  response.sendStatus(200);
});

alexaApp.intent(GET_MY_LOCATION, {}, handleGetMyLocation);
alexaApp.intent(UPDATE_MY_LOCATION, UPDATE_MY_LOCATION_SLOTS, handleUpdateMyLocation);
alexaApp.intent(GET_BUS_TIMES, GET_BUS_TIMES_SLOTS, handleNearestBusTimesByRoute);
alexaApp.intent(DEFAULT_INTENT, {}, handleDefault);

alexaApp.express({ expressApp });

// TODO add a log when the expressApp starts

module.exports = expressApp;