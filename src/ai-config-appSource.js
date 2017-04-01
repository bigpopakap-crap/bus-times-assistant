/* global module */
'use strict';

const APP_SOURCE = {
  GOOGLE: 'google',
  ALEXA: 'alexa'
};

function getFeatures(requestContext) {
  const appSource = requestContext.getAppSource();

  return {
    // Alexa doesn't let you get the device's precise location.
    // The user has to set it manually
    canUseDeviceLocation: appSource === APP_SOURCE.GOOGLE,

    // Google really doesn't seem to do well with SSML, for some dumb reason
    canUseSSML: appSource === APP_SOURCE.ALEXA
  };
}

module.exports = {
  APP_SOURCE,
  getFeatures
};
