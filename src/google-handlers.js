/* global require module */
'use strict';

const { busDirectionFromInput } = require('./ai-config-busDirection.js');
const { busRouteFromInput } = require('./ai-config-busRoute.js');
const GoogleAssistant = require('./google-assistant.js');

function handleGetMyLocation(requestContext, assistant) {
  new GoogleAssistant(assistant, requestContext).handleGetMyLocation();
}

function handleUpdateMyLocation(requestContext, assistant) {
  const address = assistant.getArgument('address');
  new GoogleAssistant(assistant, requestContext).handleUpdateMyLocation(address);
}

/**
 * Handles the initial request for bus times. Here, we check if we already
 * have the user's location, and either ask for permission or
 * answer the query immediately
 */
function handleNearestBusTimesByRoute(requestContext, assistant) {
  const busRoute = busRouteFromInput(assistant.getArgument('busRoute'));
  const busDirection = busDirectionFromInput(assistant.getArgument('busDirection'));

  // save these for later, for the fallback intent
  assistant.data.busRoute = busRoute;
  assistant.data.busDirection = busDirection;

  new GoogleAssistant(assistant, requestContext)
    .handleNearestBusTimesByRoute(busRoute, busDirection);
}

/**
 * Handles the request for bus times AFTER prompting the user for location
 * permission. Here, we check if they granted permission and save it before
 * answering the query
 */
function handleNearestBusTimesByRoute_fallback(requestContext, assistant) {
  const busRoute = assistant.data.busRoute;
  const busDirection = assistant.data.busDirection;

  new GoogleAssistant(assistant, requestContext)
    .handleNearestBusTimesByRoute_fallback(busRoute, busDirection);
}

function handleWelcome(requestContext, assistant) {
  new GoogleAssistant(assistant, requestContext).handleWelcome();
}

function handleHelp(requestContext, assistant) {
  new GoogleAssistant(assistant, requestContext).handleHelp();
}

function handleCancel(requestContext, assistant) {
  new GoogleAssistant(assistant, requestContext).handleCancel();
}

module.exports = {
  handleGetMyLocation,
  handleUpdateMyLocation,
  handleNearestBusTimesByRoute,
  handleNearestBusTimesByRoute_fallback,
  handleWelcome,
  handleHelp,
  handleCancel
};
