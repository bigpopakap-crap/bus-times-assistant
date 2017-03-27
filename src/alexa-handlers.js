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

  metrics.forRequest(requestContext).logIntent(INTENTS.GET_MY_LOCATION);
  const perfBeacon = perf.forRequest(requestContext).start('handleGetMyLocation');

  const commonAss = CommonAssistant.forRequest(requestContext);

  // TODO handle errors
  return new Promise(resolve => {
    commonAss.reportMyLocation(responseText => {
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

  metrics.forRequest(requestContext)
         .logIntent(INTENTS.UPDATE_MY_LOCATION, {
           address
         });
  const perfBeacon = perf.forRequest(requestContext)
        .start('handleUpdateMyLocation', {
          address
        });

  const commonAss = CommonAssistant.forRequest(requestContext);

  // TODO handle errors
  return new Promise(resolve => {
    commonAss.reportMyLocationUpdate(address, responseText => {
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

  const alexaDb = Db.forRequest(requestContext);
  const commonAss = CommonAssistant.forRequest(requestContext);

  // TODO handle errors
  return alexaDb.getLocation().then(location => {
    return new Promise(resolve => {
      if (location) {
        commonAss.reportNearestStopResult(location, busRoute, busDirection, responseText => {
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

  metrics.forRequest(requestContext)
         .logIntent(INTENTS.DEFAULT);
  const perfBeacon = perf.forRequest(requestContext)
          .start('handleDefault');

  const alexaDb = Db.forRequest(requestContext);

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
