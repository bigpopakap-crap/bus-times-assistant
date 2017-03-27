/* global process require module */
'use strict';

const { contains } = require('./utils.js');

const THIS_COMPONENT_NAME = 'nextbus-adapter';
const logger = require('./logger.js').forComponent(THIS_COMPONENT_NAME);
const perf = require('./logger-perf.js').forComponent(THIS_COMPONENT_NAME);
const request = require('request-json');

const nbClient = request.createClient(process.env.RESTBUS_BASE_URL);
const AGENCY = 'sf-muni';

const NEXTBUS_ERRORS = {
  NOT_FOUND: 'NOT_FOUND',
  GENERIC: 'GENERIC'
};

function cleanStopTitle(stopTitle) {
  const prefixLower = 'stop:';

  if (stopTitle.toLowerCase().startsWith(prefixLower)) {
    stopTitle = stopTitle.substring(prefixLower.length).trim();
  }

  return stopTitle;
}

function cleanResult(result) {
  return {
    busStop: cleanStopTitle(result.stop.title),
    // TODO(kapil) map these values too?
    values: result.values
  };
}

function processNbResponse(body, busRoute, busDirection) {
  let results = body || [];

  // filter for the right agency and bus route
  results = results.filter(r => r.agency.id === AGENCY)
                   .filter(r => r.route.id === `${busRoute}`);

  // now filter by direction, and remove those without stops in the right direction
  results = results.map(r => {
    r.values = r.values.filter(v => contains(v.direction.title, busDirection));
    return r;
  }).filter(r => r.values && r.values.length > 0);

  // check if there are any valid results
  if (results.length <= 0) {
    return null;
  }

  // now sort by the stop's distance to the user (increasing)
  results = results.sort((a, b) => parseFloat(a.stop.distance) - parseFloat(b.stop.distance));

  // now get the closest stop results, and sort them by time
  const result = results[0];
  result.values = result.values.sort((a, b) => a.epochTime - b.epochTime);

  // clean up the stop title and return the final result of the
  // closest stop, with the timings sorted from soonest to latest
  return cleanResult(result);
}

function forRequest(requestContext) {
  return new NextbusAdapter(requestContext);
}

function NextbusAdapter(requestContext) {
  this.logger = logger.forRequest(requestContext);
  this.perf = perf.forRequest(requestContext);
}

NextbusAdapter.prototype.getNearestStopResult = function(deviceLocation, busRoute, busDirection, callBackFn) {
  const { latitude, longitude } = deviceLocation;

  const queryUrl = `/locations/${latitude},${longitude}/predictions`;

  const logger = this.logger;
  logger.debug('pre_nextbus_query', {
    queryUrl
  });
  const perfBeacon = this.perf.start('getNearestStopResult');

  nbClient.get(queryUrl, (err, res, body) => {
    if (err) {
      logger.error('post_nextbus_query', {
        queryUrl,
        success: false,
        error: JSON.stringify(err)
      });

      callBackFn(NEXTBUS_ERRORS.GENERIC);
      perfBeacon.logEnd(NEXTBUS_ERRORS.GENERIC);
      return;
    }

    logger.debug('post_nextbus_query', {
      queryUrl,
      success: true,
      body: JSON.stringify(body)
    });

    const result = processNbResponse(body, busRoute, busDirection);

    logger.debug('nextbus_response_processed', {
      queryUrl,
      success: true,
      body: JSON.stringify(body),
      result: JSON.stringify(result)
    });

    if (result) {
      callBackFn(null, result);
      perfBeacon.logEnd();
    } else {
      callBackFn(NEXTBUS_ERRORS.NOT_FOUND);
      perfBeacon.logEnd(NEXTBUS_ERRORS.NOT_FOUND);
    }
  });
};

module.exports = {
  ERRORS: NEXTBUS_ERRORS,
  forRequest
};
