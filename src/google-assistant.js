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

  canUseSSML() {
    return false;
  }

  tell(str) {
    this.logger.trace('tell', { str });
    this.assistant.tell(str);
  }

  ask(str) {
    this.logger.trace('ask', { str });
    this.assistant.ask(str);
  }

  canUseDeviceLocation() {
    return true;
  }

  requestDeviceLocationPermission() {
    this.logger.trace('request_device_location_permission');
    const permission = this.assistant.SupportedPermissions.DEVICE_PRECISE_LOCATION;
    const prompt = this.respond.s('locationPermission.request.google');
    this.assistant.askForPermission(prompt, permission);
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
