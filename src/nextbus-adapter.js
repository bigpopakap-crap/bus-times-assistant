'use strict';

const { contains } = require('./utils.js');

const request = require('request-json');

const nbClient = request.createClient('http://restbus.info/');
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

function getNearestStopResult(deviceLocation, busRoute, busDirection, callBackFn) {
  const { latitude, longitude } = deviceLocation.coordinates;
  const locationString = process.env.NEXTBUS_MOCK_LOCATION || `${latitude},${longitude}`;

  const queryUrl = `/api/locations/${locationString}/predictions`;
  nbClient.get(queryUrl, function(err, res, body) {
    if (err) {
      callBackFn(NEXTBUS_ERRORS.GENERIC);
      return;
    }

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
      callBackFn(NEXTBUS_ERRORS.NOT_FOUND);
      return;
    }

    // now sort by the stop's distance to the user (increasing)
    results = results.sort((a, b) => parseFloat(a.stop.distance) - parseFloat(b.stop.distance));

    // now get the closest stop results, and sort them by time
    const result = results[0];
    result.values = result.values.sort((a, b) => a.epochTime - b.epochTime);

    // clean up the stop title and return the final result of the
    // closest stop, with the timings sorted from soonest to latest
    callBackFn(null, cleanResult(result));
  });
}

module.exports = {
  NEXTBUS_ERRORS,
  getNearestStopResult
};
