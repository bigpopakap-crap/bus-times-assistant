const APP_SOURCE = {
  GOOGLE: 'google',
  ALEXA: 'alexa'
};

function getFeatures(appSource) {
  return {
    canUseDeviceLocation: appSource === APP_SOURCE.GOOGLE
  }
}

module.exports = {
  APP_SOURCE,
  getFeatures
};
