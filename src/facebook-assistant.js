/* global require module */
const CommonAssistant = require('./common-assistant.js');
const logger = require('./logger.js').forComponent('facebook-delegate');

class FacebookDelegate {
  constructor(assistant, requestContext) {
    this.assistant = assistant;
    this.logger = logger.forRequest(requestContext);
  }

  isHealthCheck() {
    return false; // I don't *think* Facebook pings you?
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
      // TODO
    } else {
      // TODO
    }
  }

  canUseDeviceLocation() {
    return true;
  }

  requestDeviceLocationPermission() {
    // TODO
  }

  isDeviceLocationPermissionGranted() {
    // TODO
  }

  getDeviceLocation() {
    // TODO
  }
}

// TODO update the constructors
class FacebookAssistant extends CommonAssistant {
  constructor(requestContext) {
    super(requestContext, new FacebookDelegate());
  }
}

module.exports = FacebookAssistant;
