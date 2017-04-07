/* global require module */
'use strict';

const Promise = require('promise');
const Geocoder = require('./geocoder.js');
const NextbusAdapter = require('./nextbus-adapter.js');
const Db = require('./db.js');
const Respond = require('./respond.js');
const metrics = require('./logger-metrics.js').forComponent('common-assistant');
const perf = require('./logger-perf.js').forComponent('common-assistant');

const INTENTS = require('./ai-config-intents.js');
const { getFeatures } = require('./ai-config-appSource.js');
const { isSupportedInLocation } = require('./ai-config-supportedCities.js');

class CommonAssistant {
  constructor(requestContext) {
    this.requestContext = requestContext;

    this.db = Db.forRequest(requestContext);
    this.geocoder = Geocoder.forRequest(requestContext);
    this.nextbus = NextbusAdapter.forRequest(requestContext);
    this.respond = Respond.forRequest(requestContext);
    this.metrics = metrics.forRequest(requestContext);
    this.perf = perf.forRequest(requestContext);

    this.features = getFeatures(requestContext);
  }

  /* THIS IS PRIVATE */
  maybeAppendLocationWarning(responseKey, location) {
    if (isSupportedInLocation(location)) {
      return responseKey;
    } else {
      this.metrics.logLocationWarning(location);
      return `${responseKey}.locationWarning`;
    }
  }

  handleGetMyLocation() {
    const startDate = new Date();
    this.metrics.logIntent(INTENTS.GET_MY_LOCATION);
    const perfBeacon = this.perf.start('handleGetMyLocation');

    const { canUseDeviceLocation } = this.features;

    // TODO handle errors
    return new Promise(resolve => {
      this.db.getLocation().then(location => {
        if (location) {
          const response = this.respond.s('getLocation', {
            address: location.getAddress()
          });
          resolve(response);
        } else {
          const response = canUseDeviceLocation
              ? this.respond.s('getLocation.noLocation.deviceLocation')
              : this.respond.s('getLocation.noLocation');
          resolve(response);
        }
      });
    }).then(response => {
      this.metrics.logIntentResponse(INTENTS.GET_MY_LOCATION, startDate, response);
      perfBeacon.logEnd();
      this.tell(response);
    });
  }

  handleUpdateMyLocation(address) {
    const startDate = new Date();
    this.metrics.logIntent(INTENTS.UPDATE_MY_LOCATION, {
      address
    });
    const perfBeacon = this.perf.start('handleUpdateMyLocation', {
      address
    });

    // TODO handle errors
    return new Promise(resolve => {
      if (!address) {
        resolve(this.respond.s('updateLocation.missingAddress'));
        return;
      }

      this.geocoder.geocode(address).then(
        location => {
          this.db.saveLocation(location);

          const responseKey = this.maybeAppendLocationWarning('updateLocation', location);
          resolve(this.respond.s(responseKey, {
            address: location.getAddress()
          }));
        },
        () => {
          resolve(this.respond.s('updateLocation.notFound'));
        }
      );
    }).then(response => {
      this.metrics.logIntentResponse(INTENTS.UPDATE_MY_LOCATION, startDate, response, {
        address
      });
      perfBeacon.logEnd();
      this.tell(response);
    });
  }

  handleNearestBusTimesByRoute(busRoute, busDirection) {
    const startDate = new Date();

    this.metrics.logIntent(INTENTS.GET_NEAREST_BUS_BY_ROUTE, {
      busRoute,
      busDirection
    });
    const perfBeacon = this.perf.start('handleNearestBusTimesByRoute', {
      isFallbackIntent: false,
      busRoute,
      busDirection
    });

    // TODO handle errors
    return this.db.getLocation().then(location => {
      return new Promise(resolve => {
        if (location) {
          // yay! the user set their location
          this.actuallyQueryNextbus(location, busRoute, busDirection, response => {
            resolve({
              hadLocation: true,
              askedForLocationPermission: false,
              response
            });
          });
        } else if (!this.canUseDeviceLocation()) {
          // nooooo, now we have to ask them for their location manually
          resolve({
            hadLocation: false,
            askedForLocationPermission: false,
            response: this.respond.s('getBusTimes.missingLocation')
          });
        } else {
          // noooo, we have to ask them for their location, but we can use the device's location!
          this.requestDeviceLocationPermission();
          this.metrics.logLocationPermissionRequest();
          resolve({
            hadLocation: false,
            askedForLocationPermission: true,
            response: 'LOCATION_PERMISSION_REQUEST'
          });
        }
      });
    }).then(({ hadLocation, askedForLocationPermission, response }) => {
      this.metrics.logIntentResponse(INTENTS.GET_NEAREST_BUS_BY_ROUTE, startDate, response, {
        hadLocation,
        askedForLocationPermission,
        busRoute,
        busDirection
      });
      perfBeacon.logEnd(null, {
        askedForLocationPermission
      });
      this.tell(response);
    });
  }

  handleNearestBusTimesByRoute_fallback(busRoute, busDirection) {
    const startDate = new Date();
    const wasPermissionGranted = this.isDeviceLocationPermissionGranted();

    this.metrics.logIntent(INTENTS.GET_NEAREST_BUS_BY_ROUTE_FALLBACK, {
      wasPermissionGranted,
      busRoute,
      busDirection
    });
    const perfBeacon = this.perf.start('handleNearestBusTimesByRoute', {
      isFallbackIntent: true,
      wasPermissionGranted,
      busRoute,
      busDirection
    });

    this.metrics.logLocationPermissionResponse(wasPermissionGranted);

    if (!wasPermissionGranted) {
      this.tell(this.respond.say('locationPermission.denialWarning'));
      return;
    }

    const deviceLocation = this.getDeviceLocation();
    // save the user's location, but we don't need to wait for that call to succeed
    this.db.saveLocation(deviceLocation);

    return new Promise(resolve => {
      this.actuallyQueryNextbus(deviceLocation, busRoute, busDirection, response => {
        resolve(response);
      });
    }).then(response => {
      this.metrics.logIntentResponse(INTENTS.GET_NEAREST_BUS_BY_ROUTE_FALLBACK, startDate, response, {
        wasPermissionGranted,
        busRoute,
        busDirection
      });
      perfBeacon.logEnd();
      this.tell(response);
    });
  }

  /* THIS IS PRIVATE */
  actuallyQueryNextbus(deviceLocation, busRoute, busDirection, responseCallback) {
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
  }

  handleDefault() {
    const startDate = new Date();
    this.metrics.logIntent(INTENTS.DEFAULT);
    const perfBeacon = this.perf.start('handleDefault');

    // TODO handle errors
    return this.db.getLocation().then(location => {
      const responseKey = location ? 'welcome' : 'welcome.noLocation';
      const response = this.respond.s(responseKey);

      this.metrics.logIntentResponse(INTENTS.DEFAULT, startDate, response);
      perfBeacon.logEnd();

      this.tell(response);
    });
  }

  handleHelp() {
    const startDate = new Date();
    this.metrics.logIntent(INTENTS.HELP);
    const perfBeacon = this.perf.start('handleHelp');

    // TODO handle errors
    return this.db.getLocation().then(location => {
      const responseKey = location ? 'help' : 'help.noLocation';
      const response = this.respond.s(responseKey);

      this.metrics.logIntentResponse(INTENTS.HELP, startDate, response);
      perfBeacon.logEnd();

      this.tell(response);
    });
  }
}

module.exports = CommonAssistant;
