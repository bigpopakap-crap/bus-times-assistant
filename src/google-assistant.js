/* global require module */
const CommonAssistant = require('./common-assistant.js');
const Location = require('./model-location.js');

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

class GoogleAssistant extends CommonAssistant {
  constructor(assistant, requestContext) {
    super(requestContext);
    this.assistant = assistant;
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
    const permission = this.assistant.SupportedPermissions.DEVICE_PRECISE_LOCATION;
    const prompt = this.respond.s('locationPermission.request.google');
    this.assistant.askForPermission(prompt, permission);
  }

  isDeviceLocationPermissionGranted() {
    return this.assistant.isPermissionGranted();
  }

  getDeviceLocation() {
    return cleanDeviceLocation(this.assistant.getDeviceLocation());
  }
}

module.exports = GoogleAssistant;
