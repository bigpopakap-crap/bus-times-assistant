/* global require module */
'use strict';

const Geocoder = require('./geocoder.js');
const NextbusAdapter = require('./nextbus-adapter.js');
const Db = require('./db.js');
const Respond = require('./respond.js');
const metrics = require('./logger-metrics.js').forComponent('common-assistant');

const { getFeatures } = require('./ai-config-appSource.js');
const { isSupportedInLocation } = require('./ai-config-supportedCities.js');

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
      const response = respond.s('getLocation', {
        address: location.address
      });
      responseCallback(response);
    } else {
      const response = canUseDeviceLocation
          ? respond.s('getLocation.noLocation.deviceLocation')
          : respond.s('getLocation.noLocation');
      responseCallback(response);
    }
  });
};

CommonAssistant.prototype.reportMyLocationUpdate = function(address, responseCallback) {
  if (!address) {
    responseCallback(this.respond.s('updateLocation.missingAddress'));
    return;
  }

  const db = this.db;
  const maybeAppendLocationWarning = this.maybeAppendLocationWarning.bind(this);
  const respond = this.respond;
  this.geocoder.geocode(address).then(
    location => {
      db.saveLocation(location);

      const responseKey = maybeAppendLocationWarning('updateLocation', location);
      responseCallback(respond.s(responseKey, {
        address: location.address
      }));
    },
    () => {
      responseCallback(respond.s('updateLocation.notFound'));
    }
  );
};

CommonAssistant.prototype.reportNearestStopResult = function(deviceLocation, busRoute, busDirection, responseCallback) {
  if (!deviceLocation) {
    responseCallback(this.respond.s('getBusTimes.missingLocation'));
    return;
  } else if (busRoute === null || busRoute === '' || typeof busRoute === 'undefined') {
    responseCallback(this.respond.s('getBusTimes.missingBusRoute'));
    return;
  } else if (!busDirection) {
    responseCallback(this.respond.s('getBusTimes.missingBusDirection'));
    return;
  }

  const maybeAppendLocationWarning = this.maybeAppendLocationWarning.bind(this);
  const respond = this.respond;
  this.nextbus.getNearestStopResult(deviceLocation, busRoute, busDirection, function(err, result) {
    if (err) {
      switch (err) {
        case NextbusAdapter.ERRORS.NOT_FOUND:
          responseCallback(respond.s(
            maybeAppendLocationWarning('getBusTimes.noPredictions', deviceLocation),
            { busDirection, busRoute }
          ));
          break;
        default:
          responseCallback(respond.s(
            maybeAppendLocationWarning('error.generic', deviceLocation)
          ));
          break;
      }

      return;
    }

    const predictions = (result && result.values) || [];

    if (predictions.length <= 0) {
      const responseKey = maybeAppendLocationWarning('getBusTimes.noPredictions', deviceLocation);
      responseCallback(respond.s(responseKey));
    } else {
      const p1 = predictions[0];
      const p2 = predictions[1];
      const p3 = predictions[2];

      responseCallback(respond.s('getBusTimes', {
        busDirection,
        busRoute,
        busStop: result.busStop,
        p1Minutes: p1.minutes,
        p1IsScheduleBased: p1.isScheduleBased,
        hasSecondPrediction: Boolean(p2),
        p2Minutes: p2 && p2.minutes,
        p2IsScheduleBased: p2 && p2.isScheduleBased,
        hasThirdPrediction: Boolean(p3),
        p3Minutes: p3 && p3.minutes,
        p3IsScheduleBased: p3 && p3.isScheduleBased
      }));
    }
  });
};

CommonAssistant.prototype.handleDefault = function(responseCallback) {
  const respond = this.respond;

  // TODO handle errors
  return this.db.getLocation().then(location => {
    const responseKey = location ? 'welcome' : 'welcome.noLocation';
    responseCallback(respond.s(responseKey));
  });
};

module.exports = {
  forRequest
};
