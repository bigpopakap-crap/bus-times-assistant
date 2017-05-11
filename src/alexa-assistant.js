/* global require module */
const Promise = require('promise');
const CommonAssistant = require('./common-assistant.js');
const logger = require('./logger.js').forComponent('alexa-delegate');

class AlexaDelegate {
  constructor(response, requestContext) {
    this.response = response;
    this.logger = logger.forRequest(requestContext);
  }

  isHealthCheck() {
    // As far as I know now, Amazon doesn't constantly ping the server
    return false;
  }

  say(response, isPrompt) {
    if (isPrompt) {
      this.response.shouldEndSession(false);
    }

    this.response.say(response.getSSML());
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
    return Promise.resolve(null);
  }
}

class AlexaAssistant extends CommonAssistant {
  constructor(response, requestContext) {
    super(requestContext, new AlexaDelegate(response, requestContext));
  }
}

module.exports = AlexaAssistant;
