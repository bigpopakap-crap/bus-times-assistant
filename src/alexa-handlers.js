/* global require module */
'use strict';

const INTENTS = require('./ai-config-intents.js');

const { busDirectionFromInput } = require('./ai-config-busDirection.js');
const { busRouteFromInput } = require('./ai-config-busRoute.js');
const AlexaAssistant = require('./alexa-assistant.js');

function handleGetMyLocation(requestContext, request, response) {
  return new AlexaAssistant(response, requestContext).handleGetMyLocation();
}

function handleUpdateMyLocation(requestContext, request, response) {
  const address = INTENTS.UPDATE_MY_LOCATION.getAlexaValue('address', request);
  return new AlexaAssistant(response, requestContext).handleUpdateMyLocation(address);
}

function handleNearestBusTimesByRoute(requestContext, request, response) {
  const busRoute = busRouteFromInput(
    INTENTS.GET_NEAREST_BUS_BY_ROUTE.getAlexaValue('busRoute', request)
  );
  const busDirection = busDirectionFromInput(
    INTENTS.GET_NEAREST_BUS_BY_ROUTE.getAlexaValue('busDirection', request)
  );

  return new AlexaAssistant(response, requestContext)
    .handleNearestBusTimesByRoute(busRoute, busDirection);
}

function handleDefault(requestContext, request, response) {
  return new AlexaAssistant(response, requestContext).handleDefault();
}

function handleHelp(requestContext, request, response) {
  return new AlexaAssistant(response, requestContext).handleHelp();
}

module.exports = {
  handleGetMyLocation,
  handleUpdateMyLocation,
  handleNearestBusTimesByRoute,
  handleDefault,
  handleHelp
};
