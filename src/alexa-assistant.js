/* global require module */
const CommonAssistant = require('./common-assistant.js');

class AlexaAssistant extends CommonAssistant {
  constructor(response, requestContext) {
    super(requestContext);
    this.response = response;
  }

  tell(str) {
    this.response.say(str);
  }

  ask(str) {
    this.response.reprompt(str);
  }

  canUseDeviceLocation() {
    return false;
  }

  requestDeviceLocationPermission() {
    // do nothing
    // TODO log that we accidentally called this
  }

  isDeviceLocationPermissionGranted() {
    // TODO log that we accidentally called this
    return false;
  }

  getDeviceLocation() {
    // TODO log that we accidentally called this
    return null;
  }
}

module.exports = AlexaAssistant;
