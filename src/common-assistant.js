const Geocoder = require('./geocoder.js');
const NextbusAdapter = require('./nextbus-adapter.js');
const Db = require('./db.js');
const { getFeatures } = require('./ai-config-appSource.js');
const { pluralPhrase } = require('./utils.js');

const EXAMPLE_ADDRESS = '100 Van Ness Avenue, San Francisco';
const GENERIC_ERROR_RESPONSE = 'Sorry, there was an error. Please try again.';

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

function forRequest(appSource, userId, requestContext = {}) {
  return new CommonAssistant(appSource, userId, requestContext);
}

function CommonAssistant(appSource, userId, requestContext = {}) {
  this.db = Db.forRequest(appSource, userId, requestContext);
  this.geocoder = Geocoder.forRequest(appSource, userId);
  this.nextbus = NextbusAdapter.forRequest(appSource, userId);

  this.features = getFeatures(appSource);
}

CommonAssistant.prototype.reportMyLocation = function(responseCallback) {
  const { canUseDeviceLocation } = this.features;

  this.db.getLocation().then(location => {
    if (location) {
      responseCallback(`Your location is set to ${location.address}`);
    } else {
      const deviceLocationPrompt = canUseDeviceLocation
        ? 'ask for bus times to use your device\'s location, or '
        : '';
      responseCallback(`You haven't set a location yet. Simply ${deviceLocationPrompt}say "Update my location to ${EXAMPLE_ADDRESS}"`);
    }
  });
}

CommonAssistant.prototype.reportMyLocationUpdate = function(address, responseCallback) {
  if (!address) {
    responseCallback(`You must specify the address. For example, "Set my location to ${EXAMPLE_ADDRESS}".`);
    return;
  }

  const db = this.db;
  this.geocoder.geocode(address).then(
    location => {
      db.saveLocation(location);
      responseCallback(`There. Your location has been updated to ${location.address}`);
    },
    err => {
      responseCallback(`Hmm. I could not find that address. Try saying the full address again`);
    }
  );
}

CommonAssistant.prototype.reportNearestStopResult = function(deviceLocation, busRoute, busDirection, responseCallback) {
  if (!busRoute) {
    responseCallback('You must specify a bus number. For example, "When is the next 12 to downtown?"');
    return;
  } else if (!busDirection) {
    responseCallback('You must specify a direction. For example, "When is the next 12 to downtown?" or "When is the next inbound 12?"');
    return;
  }

  this.nextbus.getNearestStopResult(deviceLocation, busRoute, busDirection, function(err, result) {
    if (err) {
      switch (err) {
        case NextbusAdapter.ERRORS.NOT_FOUND:
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
  forRequest
};
