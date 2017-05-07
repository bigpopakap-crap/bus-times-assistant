/* global require module */
'use strict';

const { busDirectionFromInput } = require('./ai-config-busDirection.js');
const { busRouteFromInput } = require('./ai-config-busRoute.js');
const { addressFromInput } = require('./ai-config-address.js');

// TODO update how we create the object
const FacebookAssistant = require('./facebook-assistant.js');

function handleGetMyLocation(requestContext) {
  new FacebookAssistant(requestContext).handleGetMyLocation();
}

function handleUpdateMyLocation(requestContext) {
  const address = null; // TODO get params
  new FacebookAssistant(requestContext).handleUpdateMyLocation(address);
}

/**
 * Handles the initial request for bus times. Here, we check if we already
 * have the user's location, and either ask for permission or
 * answer the query immediately
 */
function handleNearestBusTimesByRoute(requestContext) {
  const busRoute = null; // TODO get params
  const busDirection = null; // TODO get params
  new FacebookAssistant(requestContext)
    .handleNearestBusTimesByRoute(busRoute, busDirection);
}

// TODO handle locaiton permission?

function handleWelcome(requestContext) {
  new FacebookAssistant().handleWelcome();
}

function handleHelp(requestContext) {
  new FacebookAssistant(requestContext).handleHelp();
}

function handleThankYou(requestContext) {
  new FacebookAssistant(requestContext).handleCancel(true);
}

function handleCancel(requestContext) {
  new FacebookAssistant(requestContext).handleCancel();
}

module.exports = {
  handleGetMyLocation,
  handleUpdateMyLocation,
  handleNearestBusTimesByRoute,
  handleWelcome,
  handleHelp,
  handleThankYou,
  handleCancel
};
