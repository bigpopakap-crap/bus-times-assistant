/* global module */

const EXAMPLE_ADDRESS = '100 Van Ness Avenue, San Francisco';
const LOCATION_WARNING = 'This service currently works in the San Francisco Bay Area only, but I am always learning about bus times in new cities!';

module.exports = {
  'welcome':        'Hi',

  'help':           'You can do stuff',

  'getLocation':                           'Your location is set to {{address}}.',
  // TODO use an example address as an example command
  'getLocation.noLocation':                'You haven\'t set a location yet. You can ask me to set a location by saying "set my location".',
  'getLocation.noLocation.deviceLocation': 'You haven\'t set a location yet. Simply ask for bus times to use your device location, or say "set my location".',

  'updateLocation':                 'There. Your location has been updated to {{address}}.',
  'updateLocation.missingAdress':   `You must specify an address. For example, you can say "update my location to ${EXAMPLE_ADDRESS}".`,
  'updateLocation.locationWarning': `There. Your location has been updated to {{address}}. ${LOCATION_WARNING}`,
  'updateLocation.notFound':        'Hmm. I could not find that address. Try saying the full address again, including the city.',

  'getBusTimes':                      'It will come soon',
  'getBusTimes.missingBusDirection':  'You must specify a direction. For example, "when is the next 12 to downtown?" or "when is the next inbound 12?"',
  'getBusTimes.missingBusRoute':      'You must specify a bus route. For example, "when is the next inbound J?" or "when is the next 14 to downtown?"',
  'getBusTimes.noPredictions':        'No predictions found for {{busDirection}} route {{busRoute}}.',

  'error.generic':                  'Sorry, there was an unexpected error. Please try again.',
  // TODO should we put the location warning in the generic error case?
  'error.generic.locationWarning':  'Sorry, there was an unexpected error. Please try again.',

  'keyMissing':     'I am at a loss for words. Something went wrong. Please try again in a few seconds.'
};
