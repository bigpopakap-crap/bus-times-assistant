/* global require module */
const CommonAssistant = require('./common-assistant.js');
const Location = require('./model-location.js');
const logger = require('./logger.js').forComponent('google-delegate');

function cleanDeviceLocation(deviceLocation) {
  return new Location({
    latitude: deviceLocation.coordinates.latitude,
    longitude: deviceLocation.coordinates.longitude,
    address: deviceLocation.address,
    city: deviceLocation.city,
    originalAddressInput: deviceLocation.address,
    originalAddressSource: 'google device'
  });
}

class GoogleDelegate {
  constructor(assistant, requestContext) {
    this.assistant = assistant;
    this.logger = logger.forRequest(requestContext);
  }

  isHealthCheck() {
    try {
      return this.assistant.getArgument('name') === 'is_health_check';
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
    const location = cleanDeviceLocation(this.assistant.getDeviceLocation());
    this.logger.trace('get_device_location', { location: JSON.stringify(location.toJSON()) });
    return location;
  }
}

class GoogleAssistant extends CommonAssistant {
  constructor(assistant, requestContext) {
    super(requestContext, new GoogleDelegate(assistant, requestContext));
  }
}

module.exports = GoogleAssistant;
