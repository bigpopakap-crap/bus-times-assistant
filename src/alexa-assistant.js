/* global require module */
const CommonAssistant = require('./common-assistant.js');
const logger = require('./logger.js').forComponent('alexa-delegate');

class AlexaDelegate {
  constructor(response, requestContext) {
    this.response = response;
    this.logger = logger.forRequest(requestContext);
  }

  say(response) {
    if (!response) {
      this.logger.error('no_response_given');
      return;
    }

    this.logger.debug('respond', {
      isPrompt: response.isPrompt(),
      response: response.getPlainStr(),
      responseSSML: response.getSSML()
    });

    if (response.isPrompt()) {
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
    return null;
  }
}

class AlexaAssistant extends CommonAssistant {
  constructor(response, requestContext) {
    super(requestContext, new AlexaDelegate(response, requestContext));
  }
}

module.exports = AlexaAssistant;
