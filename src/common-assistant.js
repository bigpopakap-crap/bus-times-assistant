/* global require module process */
'use strict';

const Promise = require('promise');
const Geocoder = require('./geocoder.js');
const NextbusAdapter = require('./nextbus-adapter.js');
const Db = require('./db.js');
const Respond = require('./respond.js');

const THIS_COMPONENT_NAME = 'common-assistant';
const logger = require('./logger.js').forComponent(THIS_COMPONENT_NAME);
const metrics = require('./logger-metrics.js').forComponent(THIS_COMPONENT_NAME);
const perf = require('./logger-perf.js').forComponent(THIS_COMPONENT_NAME);

const INTENTS = require('./ai-config-intents.js');
const { isSupportedInLocation } = require('./ai-config-supportedCities.js');

class CommonAssistant {
  /**
    * The delegate is the thing that actually knows how to interact with the
    * device (either Alexa or Google, etc)
    *
    * It should be a class with the following methods:
    * - isHealthCheck() -> boolean
    * - say(response)
    * - canUseDeviceLocation() -> boolean
    * - requestDeviceLocationPermission()
    * - isDeviceLocationPermissionGranted() -> boolean
    * - getDeviceLocation() -> Location object
    */
  constructor(requestContext, delegate) {
    this.requestContext = requestContext;
    
    this.db = Db.forRequest(requestContext);
    this.geocoder = Geocoder.forRequest(requestContext);
    this.nextbus = NextbusAdapter.forRequest(requestContext);
    this.respond = Respond.forRequest(requestContext);
    this.logger = logger.forRequest(requestContext);
    this.metrics = metrics.forRequest(requestContext);
    this.perf = perf.forRequest(requestContext);

    this.delegate = delegate;
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

    // TODO handle errors
    return new Promise(resolve => {
      this.db.getLocation().then(location => {
        if (location) {
          const response = this.respond.t('getLocation', {
            address: location.getAddress()
          });
          resolve(response);
        } else {
          const response = this.delegate.canUseDeviceLocation()
              ? this.respond.t('getLocation.noLocation.deviceLocation')
              : this.respond.t('getLocation.noLocation');
          resolve(response);
        }
      });
    }).then(response => {
      this.metrics.logIntentResponse(INTENTS.GET_MY_LOCATION, startDate, response);
      perfBeacon.logEnd();
      this.delegate.say(response);
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
        resolve(this.respond.t('updateLocation.missingAddress'));
        return;
      }

      this.geocoder.geocode(address).then(
        location => {
          this.db.saveLocation(location);

          const responseKey = this.maybeAppendLocationWarning('updateLocation', location);
          resolve(this.respond.t(responseKey, {
            address: location.getAddress()
          }));
        },
        (err, { city } = {}) => {
          switch (err) {
            case this.geocoder.ERRORS.NO_STREET_ADDRESS:
              if (city) {
                resolve(this.respond.t('updateLocation.notSpecific.withCity', {
                  address,
                  city
                }));
              } else {
                resolve(this.respond.t('updateLocation.notSpecific', {
                  address
                }));
              }
              break;

            default:
              resolve(this.respond.t('updateLocation.notFound', {
                address
              }));
              break;
          }
        }
      );
    }).then(response => {
      this.metrics.logIntentResponse(INTENTS.UPDATE_MY_LOCATION, startDate, response, {
        address
      });
      perfBeacon.logEnd();
      this.delegate.say(response);
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
        } else if (!this.delegate.canUseDeviceLocation()) {
          // nooooo, now we have to ask them for their location manually
          resolve({
            hadLocation: false,
            askedForLocationPermission: false,
            response: this.respond.t('getBusTimes.missingLocation')
          });
        } else {
          // noooo, we have to ask them for their location, but we can use the device's location!
          const response = this.delegate.requestDeviceLocationPermission();
          this.metrics.logLocationPermissionRequest();
          resolve({
            hadLocation: false,
            askedForLocationPermission: true,
            response
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
      if (!askedForLocationPermission) {
        this.delegate.say(response);
      }
    });
  }

  handleNearestBusTimesByRoute_fallback(busRoute, busDirection) {
    const startDate = new Date();
    const wasPermissionGranted = this.delegate.isDeviceLocationPermissionGranted();

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
      this.delegate.say(this.respond.t('locationPermission.denialWarning'));
      return;
    }

    const deviceLocation = this.delegate.getDeviceLocation();
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
      this.delegate.say(response);
    });
  }

  /* THIS IS PRIVATE */
  actuallyQueryNextbus(deviceLocation, busRoute, busDirection, responseCallback) {
    if (!deviceLocation) {
      responseCallback(this.respond.t('getBusTimes.missingLocation'));
      return;
    } else if (busRoute === null || busRoute === '' || typeof busRoute === 'undefined') {
      responseCallback(this.respond.t('getBusTimes.missingBusRoute'));
      return;
    } else if (!busDirection) {
      responseCallback(this.respond.t('getBusTimes.missingBusDirection'));
      return;
    }

    const maybeAppendLocationWarning = this.maybeAppendLocationWarning.bind(this);
    this.nextbus.getNearestStopResult(deviceLocation, busRoute, busDirection, (err, result) => {
      if (err) {
        switch (err) {
          case NextbusAdapter.ERRORS.NOT_FOUND:
            responseCallback(this.respond.t(
              maybeAppendLocationWarning('getBusTimes.noPredictions', deviceLocation),
              { busDirection, busRoute }
            ));
            break;
          default:
            responseCallback(this.respond.t(
              maybeAppendLocationWarning('error.generic', deviceLocation)
            ));
            break;
        }

        return;
      }

      const predictions = (result && result.values) || [];

      if (predictions.length <= 0) {
        const responseKey = maybeAppendLocationWarning('getBusTimes.noPredictions', deviceLocation);
        responseCallback(this.respond.t(responseKey));
      } else {
        const p1 = predictions[0];
        const p2 = predictions[1];
        const p3 = predictions[2];

        responseCallback(this.respond.t('getBusTimes', {
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

  /* SHOULD BE PRIVATE */
  handleHealthCheck() {
    this.logger.info('handle_health_check');
    this.delegate.say(this.respond.t('welcome'));

    const appSource = this.requestContext.getAppSource();
    if (process.env.SHOULD_PING_RESTBUS_SERVER === 'true') {
      this.nextbus.ping(`${appSource}_health_check`);
    }
  }

  handleWelcome() {
    if (this.delegate.isHealthCheck()) {
      this.handleHealthCheck();
      return;
    }

    const startDate = new Date();
    this.metrics.logIntent(INTENTS.WELCOME);
    const perfBeacon = this.perf.start('handleWelcome');

    // TODO handle errors
    return this.db.getLocation().then(location => {
      const responseKey = location ? 'welcome' : 'welcome.noLocation';
      const response = this.respond.t(responseKey);

      this.metrics.logIntentResponse(INTENTS.WELCOME, startDate, response);
      perfBeacon.logEnd();

      this.delegate.say(response);
    });
  }

  handleHelp() {
    const startDate = new Date();
    this.metrics.logIntent(INTENTS.HELP);
    const perfBeacon = this.perf.start('handleHelp');

    // TODO handle errors
    return this.db.getLocation().then(location => {
      const responseKey = location ? 'help' : 'help.noLocation';
      const response = this.respond.t(responseKey);

      this.metrics.logIntentResponse(INTENTS.HELP, startDate, response);
      perfBeacon.logEnd();

      this.delegate.say(response);
    });
  }

  handleCancel(isThankYou = false) {
    const startDate = new Date();
    this.metrics.logIntent(INTENTS.CANCEL);
    const perfBeacon = this.perf.start('handleCancel');

    const response = this.respond.t(isThankYou ? 'cancel.thankYou' : 'cancel');

    this.metrics.logIntentResponse(INTENTS.CANCEL, startDate, response);
    perfBeacon.logEnd();

    this.delegate.say(response);
  }
}

module.exports = CommonAssistant;
