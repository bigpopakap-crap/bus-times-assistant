/* global require module */
const CommonAssistant = require('./common-assistant.js');
const logger = require('./logger.js').forComponent('alexa-delegate');

class AlexaDelegate {
  constructor(response, requestContext) {
    this.response = response;
    this.logger = logger.forRequest(requestContext);
  }

  canUseSSML() {
    return true;
  }

  tell(str) {
    this.logger.trace('tell', { str });
    this.response.say(str);
  }

  ask(str) {
    this.logger.trace('ask', { str });
    this.response.reprompt(str);
  }

  canUseDeviceLocation() {
    return false;
  }

  requestDeviceLocationPermission() {
    this.logger.warn('should_never_call_requestDeviceLocationPermission');
    // do nothing
  }

  isDeviceLocationPermissionGranted() {
    this.logger.warn('should_never_call_isDeviceLocationPermissionGranted');
    return false;
  }

  getDeviceLocation() {
    this.logger.warn('should_never_call_getDeviceLocation');
    return null;
  }
}

class AlexaAssistant extends CommonAssistant {
  constructor(response, requestContext) {
    super(requestContext, new AlexaDelegate(response, requestContext));
  }
}

module.exports = AlexaAssistant;
