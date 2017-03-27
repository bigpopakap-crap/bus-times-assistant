/* global module */
'use strict';

const APP_SOURCE = {
  GOOGLE: 'google',
  ALEXA: 'alexa'
};

function getFeatures(requestContext) {
  const appSource = requestContext.getAppSource();

  return {
    canUseDeviceLocation: appSource === APP_SOURCE.GOOGLE
  };
}

module.exports = {
  APP_SOURCE,
  getFeatures
};
