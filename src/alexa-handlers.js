"use strict";

const Promise = require('promise');

const { APP_SOURCE } = require('./ai-config-appSource.js');
const INTENTS = require('./ai-config-intents.js');

const Db = require('./db.js');

const THIS_COMPONENT_NAME = 'alexa-handlers';
const logger = require('./logger.js').forComponent(THIS_COMPONENT_NAME);
const metrics = require('./logger-metrics.js').forComponent(THIS_COMPONENT_NAME);
const perf = require('./logger-perf.js').forComponent(THIS_COMPONENT_NAME);

const { busDirectionFromInput } = require('./ai-config-busDirection.js');
const CommonAssistant = require('./common-assistant.js');

// Alexa doesn't like ampersands in SSML
function cleanResponse(response) {
  return response.replace(/&/g, 'and');
}

function handleGetMyLocation(requestContext, request, response) {
  const userId = request.sessionDetails.userId;

  // TODO add requestContext
  metrics.forRequest(APP_SOURCE.ALEXA, userId)
         .logIntent(INTENTS.GET_MY_LOCATION);
  const perfBeacon = perf.forRequest(APP_SOURCE.ALEXA, userId)
        .start('handleGetMyLocation');

  const assistant = CommonAssistant.forRequest(requestContext.getAppSource(),
                        requestContext.getUserId(), requestContext.toJSON());

  // TODO handle errors
  return new Promise(resolve => {
    assistant.reportMyLocation(responseText => {
      resolve(responseText);
    });
  }).then(responseText => {
    response.say(responseText);

    perfBeacon.logEnd();
  });
}

function handleUpdateMyLocation(requestContext, request, response) {
  const userId = request.sessionDetails.userId;
  const address = request.slot('address');

  // TODO add requestContext
  metrics.forRequest(APP_SOURCE.ALEXA, userId)
         .logIntent(INTENTS.UPDATE_MY_LOCATION, {
           address
         });
  const perfBeacon = perf.forRequest(APP_SOURCE.ALEXA, userId)
        .start('handleUpdateMyLocation', {
          address
        });

  const assistant = CommonAssistant.forRequest(requestContext.getAppSource(),
                          requestContext.getUserId(), requestContext.toJSON());

  // TODO handle errors
  return new Promise(resolve => {
    assistant.reportMyLocationUpdate(address, responseText => {
      resolve(responseText);
    });
  }).then(responseText => {
    response.say(responseText);

    perfBeacon.logEnd();
  });
}

function handleNearestBusTimesByRoute(requestContext, request, response) {
  const userId = request.sessionDetails.userId;

  const busRoute = request.slot("busRoute");
  const busDirection = busDirectionFromInput(
    request.slot("busDirection")
  );

  // TODO add requestContext
  metrics.forRequest(APP_SOURCE.ALEXA, userId)
         .logIntent(INTENTS.GET_NEAREST_BUS_BY_ROUTE, {
           busRoute,
           busDirection
         });
  const perfBeacon = perf.forRequest(APP_SOURCE.ALEXA, userId)
          .start('handleNearestBusTimesByRoute', {
            busRoute,
            busDirection
          });

  // TODO add requestContext
  const alexaDb = Db.forRequest(APP_SOURCE.ALEXA, userId);
  const assistant = CommonAssistant.forRequest(requestContext.getAppSource(),
                          requestContext.getUserId(), requestContext.toJSON());

  // TODO handle errors
  return alexaDb.getLocation().then(location => {
    return new Promise(resolve => {
      if (location) {
        assistant.reportNearestStopResult(location, busRoute, busDirection, responseText => {
          resolve(responseText);
        });
      } else {
        resolve('You have not set your location yet. You can set one by saying "Update my location".');
      }
    });
  }).then(function(responseText) {
    response.say(cleanResponse(responseText));

    perfBeacon.logEnd();
  });
}

function handleDefault(requestContext, request, response) {
  const userId = request.sessionDetails.userId;

  // TODO add requestContext
  metrics.forRequest(APP_SOURCE.ALEXA, userId)
         .logIntent(INTENTS.DEFAULT);
  const perfBeacon = perf.forRequest(APP_SOURCE.ALEXA, userId)
          .start('handleDefault');

  // TODO add requestContext
  const alexaDb = Db.forRequest(APP_SOURCE.ALEXA, userId);

  return alexaDb.getLocation().then(location => {
    const baseResponse = 'Hello there! I can look up bus times for you. For example you can say, "When is the next 12 to downtown?"';
    const noLocationResponse = `${baseResponse}. But first, you'll need to tell me your location by saying "Set my location".`;

    const responseText = location ? baseResponse : noLocationResponse;
    response.say(cleanResponse(responseText));

    perfBeacon.logEnd();
  });
}

module.exports = {
  handleGetMyLocation,
  handleUpdateMyLocation,
  handleNearestBusTimesByRoute,
  handleDefault
};
