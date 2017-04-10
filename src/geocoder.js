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

Geocoder.prototype.geocode = function(address) {
  const logger = this.logger;

  logger.debug('pre_geocoding', {
    address
  });
  const perfBeacon = this.perf.start('geocode', {
    address
  });

  return new Promise((resolve, reject) => {
    nodeGeocoder.geocode(address, function(err, result) {
      // simulate some errors if the result is not good
      if (!result) {
        err = 'result undefined';
      } else if (result.length < 1) {
        err = 'result empty';
      }

      if (err) {
        logger.warn('post_geocoding', {
          address,
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
        formattedAddress = geo.formattedAddress;
      } else if (!geo.streetNumber || !geo.streetName || !geo.city) {
        logger.warn('post_geocoding', {
          address,
          success: false,
          rawLocation: JSON.stringify(geo)
        });

        perfBeacon.logEnd(); // don't call this an error in mixpanel
        reject(ERRORS.NO_STREET_ADDRESS, {
          city: geo.city
        });
        return;
      } else {
        // TODO format this completely and with localization?
        formattedAddress = `${geo.streetNumber} ${geo.streetName}, ${geo.city}`;
      }

      const location = new Location({
        latitude: geo.latitude,
        longitude: geo.longitude,
        address: formattedAddress,
        city: geo.city,
        originalAddressInput: address,
        originalAddressSource: THIS_COMPONENT_NAME
      });

      logger.debug('post_geocoding', {
        address,
        success: true,
        location: JSON.stringify(location.toJSON()),
        rawLocation: JSON.stringify(geo)
      });

      perfBeacon.logEnd();
      resolve(location);
    });
  });
};

module.exports = {
  forRequest
};
