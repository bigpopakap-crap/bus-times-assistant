const Promise = require('promise');
const NodeGeocoder = require('node-geocoder');

const nodeGeocoderOptions = {
  provider: 'google'
};
const nodeGeocoder = NodeGeocoder();

const THIS_COMPONENT_NAME = 'geocoder';
const logger = require('./logger.js')
                .forComponent(THIS_COMPONENT_NAME, nodeGeocoderOptions, 'nodeGeocoderOptions');
const perf = require('./logger-perf.js').forComponent(THIS_COMPONENT_NAME);

function forRequest(appSource, userId, requestContext = {}) {
  return new Geocoder(appSource, userId, requestContext);
}

function Geocoder(appSource, userId, requestContext = {}) {
  this.logger = logger.forRequest(appSource, userId, requestContext);
  this.perf = perf.forRequest(appSource, userId, requestContext);
}

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
        logger.error('post_geocoding', {
          address,
          success: false,
          error: JSON.stringify(err)
        });

        reject(err);
        perfBeacon.logEnd(err);
        return;
      }

      const geo = result[0];
      // TODO format this completely and with localization?
      const formattedAddress = `${geo.streetNumber} ${geo.streetName}, ${geo.city}`;
      const location = {
        latitude: geo.latitude,
        longitude: geo.longitude,
        address: formattedAddress,
        originalAddressInput: address,
        originalAddressSource: THIS_COMPONENT_NAME
      };

      logger.debug('post_geocoding', {
        address,
        success: true,
        location: JSON.stringify(location)
      });

      resolve(location);
      perfBeacon.logEnd();
    });
  });
}

module.exports = {
  forRequest
};
