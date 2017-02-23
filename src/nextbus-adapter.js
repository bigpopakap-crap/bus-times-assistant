'use strict';

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

function mapResult(result) {
  return {
    busStop: cleanStopTitle(result.stop.title),
    // TODO(kapil) map these values too?
    values: result.values
  };
}

function getNearestStopResult(deviceLocation, busRoute, busDirection, callBackFn) {
  const { latitude, longitude } = deviceLocation.coordinates;
  const queryUrl = `/api/locations/${latitude},${longitude}/predictions`;
  nbClient.get(queryUrl, function(err, res, body) {
    if (err) {
      callBackFn(NEXTBUS_ERRORS.GENERIC);
      return;
    }

    const allResults = body || [];
    const busResults = allResults.filter(r => r.agency.id === AGENCY)
                                 .filter(r => r.route.id === `${busRoute}`);
                                 // TODO(kapil) filter by direction!
    if (busResults.length <= 0) {
      callBackFn(NEXTBUS_ERRORS.NOT_FOUND);
    } else {
      const sortedResults = busResults.sort((a, b) => parseFloat(a.stop.distance) - parseFloat(b.stop.distance));
      callBackFn(null, mapResult(sortedResults[0]));
    }
  });
}

module.exports = {
  NEXTBUS_ERRORS,
  getNearestStopResult
};
