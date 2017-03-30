/* global require module */
'use strict';

const Geocoder = require('./geocoder.js');
const NextbusAdapter = require('./nextbus-adapter.js');
const Db = require('./db.js');
const Respond = require('./respond.js');
const metrics = require('./logger-metrics.js').forComponent('common-assistant');

const { getFeatures } = require('./ai-config-appSource.js');
const { pluralPhrase } = require('./utils.js');
const { isSupportedInLocation } = require('./ai-config-supportedCities.js');

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

function forRequest(requestContext) {
  return new CommonAssistant(requestContext);
}

function CommonAssistant(requestContext) {
  this.db = Db.forRequest(requestContext);
  this.geocoder = Geocoder.forRequest(requestContext);
  this.nextbus = NextbusAdapter.forRequest(requestContext);
  this.respond = Respond.forRequest(requestContext);
  this.metrics = metrics.forRequest(requestContext);

  this.features = getFeatures(requestContext);
}

/* THIS IS PRIVATE */
CommonAssistant.prototype.maybeAppendLocationWarning = function(responseKey, location) {
  if (isSupportedInLocation(location)) {
    return responseKey;
  } else {
    this.metrics.logLocationWarning(location);
    return `${responseKey}.locationWarning`;
  }
};

CommonAssistant.prototype.reportMyLocation = function(responseCallback) {
  const { canUseDeviceLocation } = this.features;

  const respond = this.respond;
  this.db.getLocation().then(location => {
    if (location) {
      const response = respond.saying('getLocation', {
        address: location.address
      });
      responseCallback(response);
    } else {
      const response = canUseDeviceLocation
          ? respond.saying('getLocation.noLocation.deviceLocation')
          : respond.saying('getLocation.noLocation');
      responseCallback(response);
    }
  });
};

CommonAssistant.prototype.reportMyLocationUpdate = function(address, responseCallback) {
  if (!address) {
    responseCallback(this.respond.saying('updateLocation.missingAddress'));
    return;
  }

  const db = this.db;
  const maybeAppendLocationWarning = this.maybeAppendLocationWarning.bind(this);
  const respond = this.respond;
  this.geocoder.geocode(address).then(
    location => {
      db.saveLocation(location);

      const responseKey = maybeAppendLocationWarning('updateLocation', location);
      responseCallback(respond.saying(responseKey, {
        address: location.address
      }));
    },
    () => {
      responseCallback(respond.saying('updateLocation.notFound'));
    }
  );
};

CommonAssistant.prototype.reportNearestStopResult = function(deviceLocation, busRoute, busDirection, responseCallback) {
  if (busRoute === null || busRoute === '' || typeof busRoute === 'undefined') {
    responseCallback(this.respond.saying('getBusTimes.missingBusRoute'));
    return;
  } else if (!busDirection) {
    responseCallback(this.respond.saying('getBusTimes.missingBusDirection'));
    return;
  }

  const maybeAppendLocationWarning = this.maybeAppendLocationWarning.bind(this);
  const respond = this.respond;
  this.nextbus.getNearestStopResult(deviceLocation, busRoute, busDirection, function(err, result) {
    if (err) {
      switch (err) {
        case NextbusAdapter.ERRORS.NOT_FOUND:
          responseCallback(respond.saying(
            maybeAppendLocationWarning('getBusTimes.noPredictions', deviceLocation)
          ));
          break;
        default:
          responseCallback(respond.saying(
            maybeAppendLocationWarning('error.generic', deviceLocation)
          ));
          break;
      }

      return;
    }

    const predictions = (result && result.values) || [];
    if (predictions.length <= 0) {
      const responseKey = maybeAppendLocationWarning('getBusTimes.noPredictions', deviceLocation);
      responseCallback(respond.saying(responseKey));
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
};

module.exports = {
  forRequest
};
