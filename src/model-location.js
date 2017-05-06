/* global require module */
const { Model } = require('mrkapil/db');
const logger = require('./logger.js').forComponent('model-location').forRequest();

class Location extends Model {
  constructor({
                latitude,
                longitude,
                address,
                city,
                originalAddressInput,
                originalAddressSource
              }) {
    super({
      latitude,
      longitude,
      address,
      city,
      originalAddressInput,
      originalAddressSource
    });

    this.latitude = latitude;
    this.longitude = longitude;
    this.address = address;
    this.city = city;

    if (!latitude || !longitude || !address || !city) {
      logger.error('created_invalid_location_model', this.toJSON());
    } else if (!originalAddressInput || !originalAddressSource) {
      logger.warn('created_bad_location_model', this.toJSON());
    }
  }

  getLatitude() {
    return this.latitude;
  }

  getLongitude() {
    return this.longitude;
  }

  getAddress() {
    return this.address;
  }

  getCity() {
    return this.city;
  }
}

module.exports = Location;
