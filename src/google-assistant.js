/* global require module */
const CommonAssistant = require('./common-assistant.js');
const Respond = require('./respond.js');

function cleanDeviceLocation(deviceLocation) {
  return {
    latitude: deviceLocation.coordinates.latitude,
    longitude: deviceLocation.coordinates.longitude,
    address: deviceLocation.address,
    city: deviceLocation.city,
    originalAddressInput: deviceLocation.address,
    originalAddressSource: 'google device'
  };
}

class GoogleAssistant extends CommonAssistant {
  constructor(assistant, requestContext) {
    super(requestContext);
    this.assistant = assistant;
    this.respond = Respond.forRequest(requestContext);
  }

  tell(str) {
    this.assistant.tell(str);
  }

  ask(str) {
    this.assistant.ask(str);
  }

  canUseDeviceLocation() {
    return true;
  }

  requestDeviceLocationPermission() {
    this.assistant.tell(this.respond.say('locationPermission.denialWarning'));
  }

  isDeviceLocationPermissionGranted() {
    return this.assistant.isPermissionGranted();
  }

  getDeviceLocation() {
    return cleanDeviceLocation(this.assistant.getDeviceLocation());
  }
}

module.exports = GoogleAssistant;
