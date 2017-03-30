/* global module */

const EXAMPLE_ADDRESS = '100 Van Ness Avenue, San Francisco';
const LOCATION_WARNING = 'This service currently works in the San Francisco Bay Area only, but I am always learning about bus times in new cities!';

function pluralPhrase(count, singularLabel, pluralLabel) {
  return count == 1 ? `${count} ${singularLabel}` : `${count} ${pluralLabel}`;
}

function getBusTimesString({
  // The are passed in, but only used as variables in the string
  // busDirection,
  // busRoute,
  // busStop,
  p1Minutes,
  p1IsScheduleBased,
  hasSecondPrediction,
  p2Minutes,
  p2IsScheduleBased
}) {
  let strPreamble = 'The next {{busDirection}} {{busRoute}} from {{busStop}}';
  let strP1Relation = p1IsScheduleBased
                    ? 'is scheduled to arrive'
                    : (p1Minutes === 0 ? 'is arriving' : 'will arrive');
  let strP1Minutes = p1Minutes === 0
                    ? 'now'
                    : 'in' + pluralPhrase(p1Minutes, 'minute', 'minutes');

  if (!hasSecondPrediction) {
    return `${strPreamble} ${strP1Relation} ${strP1Minutes}.`;
  }

  let strP2Joiner = (p1IsScheduleBased === p2IsScheduleBased)
                    ? ', then again'
                    : (p2IsScheduleBased ? '. After that, the next one is scheduled to arrive' : '. After that, next one will arrive');
  let strP2Minutes = 'in' + pluralPhrase(p2Minutes, 'minute', 'minutes');

  return `${strPreamble} ${strP1Relation} ${strP1Minutes} ${strP2Joiner} ${strP2Minutes}.`;
}

module.exports = {
  'welcome':            'Hello there! I can look up bus times for you. For example, you can say, "when is the next 12 to downtown?"',
  'welcome.noLocation': 'Hello there! I can look up bus times for you. For example, you can say, "when is the next 12 to downtown?". But first, you\'ll need to tell me your location by saying "set my location"',

  // TODO make the help responses
  'help':           'Hey! Hope I have been useful to you',

  'getLocation':                           'Your location is set to {{address}}.',
  // TODO use an example address as an example command
  'getLocation.noLocation':                'You haven\'t set a location yet. You can ask me to set a location by saying "set my location".',
  'getLocation.noLocation.deviceLocation': 'You haven\'t set a location yet. Simply ask for bus times to use your device location, or say "set my location".',

  'updateLocation':                 'There. Your location has been updated to {{address}}.',
  'updateLocation.missingAdress':   `You must specify an address. For example, you can say "update my location to ${EXAMPLE_ADDRESS}".`,
  'updateLocation.locationWarning': `There. Your location has been updated to {{address}}. ${LOCATION_WARNING}`,
  'updateLocation.notFound':        'Hmm. I could not find that address. Try saying the full address again, including the city.',

  'getBusTimes':                                getBusTimesString,
  'getBusTimes.missingBusDirection':            'You must specify a direction. For example, "when is the next 12 to downtown?" or "when is the next inbound 12?"',
  'getBusTimes.missingBusRoute':                'You must specify a bus route. For example, "when is the next inbound J?" or "when is the next 14 to downtown?"',
  'getBusTimes.missingLocation':                'You haven\t set your location yet. To do so, simply say "set my location".',
  'getBusTimes.noPredictions':                  'No predictions found for {{busDirection}} route {{busRoute}}.',
  'getBusTimes.noPredictions.locationWarning':  `No predictions found for {{busDirection}} route {{busRoute}}. ${LOCATION_WARNING}`,

  'locationPermission.request.google': 'To look up routes near you',
  'locationPermission.denialWarning':  'To proceed, I\'ll need your location. If you do not want to grant permission, you can set your address manually by saying "set my location"',

  'error.generic':                  'Sorry, there was an unexpected error. Please try again.',
  // TODO should we put the location warning in the generic error case?
  'error.generic.locationWarning':  'Sorry, there was an unexpected error. Please try again.',

  'keyMissing':     'I am at a loss for words. Something went wrong. Please try again in a few seconds.'
};
