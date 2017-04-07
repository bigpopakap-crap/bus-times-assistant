/* global require module */
'use strict';

const Promise = require('promise');

const INTENTS = require('./ai-config-intents.js');

const Db = require('./db.js');

const THIS_COMPONENT_NAME = 'alexa-handlers';
const metrics = require('./logger-metrics.js').forComponent(THIS_COMPONENT_NAME);
const perf = require('./logger-perf.js').forComponent(THIS_COMPONENT_NAME);

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
  const startDate = new Date();

  const busRoute = busRouteFromInput(
    INTENTS.GET_NEAREST_BUS_BY_ROUTE.getAlexaValue('busRoute', request)
  );
  const busDirection = busDirectionFromInput(
    INTENTS.GET_NEAREST_BUS_BY_ROUTE.getAlexaValue('busDirection', request)
  );

  metrics.forRequest(requestContext)
         .logIntent(INTENTS.GET_NEAREST_BUS_BY_ROUTE, {
           busRoute,
           busDirection
         });
  const perfBeacon = perf.forRequest(requestContext)
          .start('handleNearestBusTimesByRoute', {
            busRoute,
            busDirection
          });

  const db = Db.forRequest(requestContext);
  const commonAss = new AlexaAssistant(response, requestContext);

  // TODO handle errors
  return db.getLocation().then(location => {
    return new Promise(resolve => {
      commonAss.reportNearestStopResult(location, busRoute, busDirection, responseText => {
        resolve(responseText);
      });
    });
  }).then(function(responseText) {
    metrics.forRequest(requestContext)
           .logIntentResponse(INTENTS.GET_NEAREST_BUS_BY_ROUTE, startDate, responseText, {
             busRoute,
             busDirection
           });
    perfBeacon.logEnd();
    response.say(responseText);
  });
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
