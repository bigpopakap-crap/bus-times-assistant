const geocoder = require('./geocoder.js');
const { NEXTBUS_ERRORS, getNearestStopResult } = require('./nextbus-adapter.js');
const { pluralPhrase } = require('./utils.js');

const GENERIC_ERROR_RESPONSE = 'Sorry, there was an error. Please try again.';

function reportMyLocation(db, userId, responseCallback) {
  db.getLocation(userId).then(location => {
    if (location) {
      responseCallback(`Your location is set to ${location.address}`);
    } else {
      responseCallback('You haven\'t set a location yet. Simply ask for bus times to use your device\'s location, or say "Update my location"');
    }
  });
}

function reportMyLocationUpdate(db, userId, address, responseCallback) {
  if (!address) {
    responseCallback('You must specify the address. For example, "Set my location to 100 Van Ness, San Francisco".');
    return;
  }

  geocoder.geocode(address).then(
    location => {
      db.saveLocation(userId, location);
      responseCallback(`There. Your location has been updated to ${location.address}`);
    },
    err => {
      responseCallback(`Hmm. I could not find that address. Try saying the full address again`);
    }
  );
}

function generatePredictionResponse(p) {
  // special case for arriving
  if (p.minutes === 0) {
    return p.isScheduleBased ? 'is scheduled to arrive now' : 'is arriving now';
  } else {
    const pTypeLabel = p.isScheduleBased ? 'is scheduled to arrive' : 'will arrive';
    const minutePhrase = pluralPhrase(p.minutes, 'minute', 'minutes');
    return `${pTypeLabel} in ${minutePhrase}`;
  }
}

function reportNearestStopResult(deviceLocation, busRoute, busDirection, responseCallback) {
  if (!busRoute) {
    responseCallback('You must specify a bus number. For example, "When is the next 12 to downtown?"');
    return;
  } else if (!busDirection) {
    responseCallback('You must specify a direction. For example, "When is the next 12 to downtown?" or "When is the next inbound 12?"');
    return;
  }

  getNearestStopResult(deviceLocation, busRoute, busDirection, function(err, result) {
    if (err) {
      switch (err) {
        case NEXTBUS_ERRORS.NOT_FOUND:
          responseCallback(`No nearby stops found for ${busDirection} route ${busRoute}.`);
          break;
        default:
          responseCallback(GENERIC_ERROR_RESPONSE);
          break;
      }

      return;
    }

    const predictions = (result && result.values) || [];
    if (predictions.length <= 0) {
      responseCallback(`No predictions found for ${busDirection} route ${busRoute}`);
      return;
    }

    const p1 = predictions[0];
    const p1Response = generatePredictionResponse(p1);

    let response = `The next ${busDirection} ${busRoute} from ${result.busStop} ${p1Response}`;

    if (predictions.length > 1) {
      const p2 = predictions[1];

      if (p1.isScheduleBased !== p2.isScheduleBased) {
        const p2Response = generatePredictionResponse(p2);
        response = `${response}. After that, the next one ${p2Response}`;
      } else {
        const minutePhrase = pluralPhrase(p2.minutes, 'minute', 'minutes');
        response = `${response}, then again in ${minutePhrase}`;
      }
    }

    responseCallback(`${response}.`);
  });
}

module.exports = {
  reportMyLocation,
  reportMyLocationUpdate,
  reportNearestStopResult
};
