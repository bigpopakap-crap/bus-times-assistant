/* global require module */
const Geocoder = require('./geocoder.js');
const CommonAssistant = require('./common-assistant.js');
const logger = require('./logger.js').forComponent('google-delegate');
const Respond = require('./respond.js');
const Location = require('./model-location.js');

// TODO use responses for these default strings
function cleanDeviceLocation(deviceLocation) {
  return new Location({
    latitude: deviceLocation.coordinates.latitude,
    longitude: deviceLocation.coordinates.longitude,
    address: deviceLocation.address || 'the address set on your Google Home app',
    city: deviceLocation.city || 'the city set on your Google Home app',
    originalAddressInput: deviceLocation.address,
    originalAddressSource: 'google device'
  });
}

class GoogleDelegate {
  constructor(assistant, requestContext) {
    this.assistant = assistant;
    this.logger = logger.forRequest(requestContext);
    this.respond = Respond.forRequest(requestContext);
    this.geocoder = Geocoder.forRequest(requestContext);
  }

  isHealthCheck() {
    try {
      return this.assistant.getArgument('name') === 'is_health_check'
          || Boolean(this.assistant.getArgument('is_health_check'));
    } catch (ex) {
      // we have to do a try/catch because there's some dumb bug in the actions-on-google code
      return false;
    }
  }

  say(response) {
    if (!response) {
      this.logger.error('no_response_given');
      return;
    }

    this.logger.debug('respond', {
      isPrompt: response.isPrompt(),
      response: response.getPlainStr()
    });

    if (response.isPrompt()) {
      this.assistant.ask(response.getPlainStr());
    } else {
      this.assistant.tell(response.getPlainStr());
    }
  }

  canUseDeviceLocation() {
    return true;
  }

  requestDeviceLocationPermission() {
    this.logger.trace('request_device_location_permission');

    const permission = this.assistant.SupportedPermissions.DEVICE_PRECISE_LOCATION;
    const prompt = this.respond.t('locationPermission.request.google');

    this.assistant.askForPermission(prompt.getPlainStr(), permission);

    return prompt;
  }

  isDeviceLocationPermissionGranted() {
    return this.assistant.isPermissionGranted();
  }

  getDeviceLocation() {
    const location = this.assistant.getDeviceLocation();
    this.logger.trace('get_device_location', { location: JSON.stringify(location) });

    if (!location) {
      this.logger.error('get_device_location', {
        message: 'location from device is undefined'
      });
      return Promise.resolve(null);
    } else if (!location.coordinates) {
      this.logger.error('get_device_location', {
        message: 'location from device does not have coordinates'
      });
      return Promise.resolve(null);
    } else {
      return this.geocoder.geocode({
        coords: location.coordinates
      }).then(location => {
        return Promise.resolve(location);
      }, () => {
        return Promise.resolve(cleanDeviceLocation(location));
      });
    }
  }
}

class GoogleAssistant extends CommonAssistant {
  constructor(assistant, requestContext) {
    super(requestContext, new GoogleDelegate(assistant, requestContext));
  }
}

module.exports = GoogleAssistant;
