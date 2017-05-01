/* global require module */
'use strict';

const Promise = require('promise');
const NodeGeocoder = require('node-geocoder');

const nodeGeocoder = NodeGeocoder({
  provider: 'google'
});

const Location = require('./model-location.js');

const THIS_COMPONENT_NAME = 'geocoder';
const logger = require('./logger.js').forComponent(THIS_COMPONENT_NAME);
const perf = require('./logger-perf.js').forComponent(THIS_COMPONENT_NAME);

const ERRORS = {
  NO_STREET_ADDRESS: 'NO_STREET_ADDRESS'
};

function forRequest(requestContext) {
  return new Geocoder(requestContext);
}

function Geocoder(requestContext) {
  this.logger = logger.forRequest(requestContext);
  this.perf = perf.forRequest(requestContext);
}

Geocoder.ERRORS = ERRORS;
Geocoder.prototype.ERRORS = ERRORS;

Geocoder.prototype.geocode = function({ address, coords }) {
  const { latitude, longitude } = coords || {};
  const logger = this.logger;

  logger.debug('pre_geocoding', {
    address,
    latitude,
    longitude
  });
  const perfBeacon = this.perf.start('geocode', {
    address,
    latitude,
    longitude
  });

  return new Promise((resolve, reject) => {
    function handleResponse(err, result) {
      // simulate some errors if the result is not good
      if (!result) {
        err = 'results list is undefined';
      } else if (result.length < 1) {
        err = 'results list is empty';
      } else if (!result[0]) {
        err = 'first result is undefined';
      } else if (!result[0].longitude || !result[0].latitude) {
        err = 'first result has not lat/lon';
      }

      if (err) {
        logger.warn('post_geocoding', {
          address,
          latitude,
          longitude,
          success: false,
          error: JSON.stringify(err)
        });

        perfBeacon.logEnd(err);
        reject(err);
        return;
      }

      const geo = result[0];

      // make sure we have a street address
      let formattedAddress = null;
      if (geo.formattedAddress) {
        geo.city = geo.city || 'NOT_SET'; // it's ok to set this, since we never read it out to the user
        formattedAddress = geo.formattedAddress;
      } else if (geo.streetNumber && geo.streetName && geo.city) {
        // TODO format this completely and with localization?
        formattedAddress = `${geo.streetNumber} ${geo.streetName}, ${geo.city}`;
      } else {
        logger.warn('post_geocoding', {
          address,
          latitude,
          longitude,
          success: false,
          rawLocation: JSON.stringify(geo)
        });

        perfBeacon.logEnd(); // don't call this an error in mixpanel
        reject(ERRORS.NO_STREET_ADDRESS, {
          city: geo.city
        });
        return;
      }

      const location = new Location({
        latitude: geo.latitude,
        longitude: geo.longitude,
        address: formattedAddress,
        city: geo.city,
        originalAddressInput: address,
        originalLatitudeInput: latitude,
        originalLongitudeInput: longitude,
        originalAddressSource: THIS_COMPONENT_NAME
      });

      logger.debug('post_geocoding', {
        address,
        latitude,
        longitude,
        success: true,
        location: JSON.stringify(location.toJSON()),
        rawLocation: JSON.stringify(geo)
      });

      perfBeacon.logEnd();
      resolve(location);
    }

    if (address) {
      nodeGeocoder.geocode(address, handleResponse);
    } else {
      nodeGeocoder.reverse({
        lat: latitude,
        lon: longitude
      }, handleResponse);
    }
  });
};

module.exports = {
  forRequest
};
