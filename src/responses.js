/* global module */
const EXAMPLE_ADDRESS = '<say-as interpret-as="address">100 Van Ness Avenue, San Francisco</say-as>';
const LOCATION_WARNING = 'This service currently works in the San Francisco Bay Area only, but I am always learning about bus times in new cities!';

function s(str, isSSML = true) {
  if (isSSML) {
    return `<speak>${str}</speak>`;
  } else {
    return str;
  }
}

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
  p2IsScheduleBased,
  hasThirdPrediction,
  p3Minutes,
  p3IsScheduleBased
}) {
  const strPreamble = 'The next <w role="ivona:NN">{{busDirection}}</w> <w role="ivona:NN">{{busRoute}}</w> from <w role="ivona:NN">{{busStop}}</w>';
  const strP1Relation = p1IsScheduleBased
                    ? 'is scheduled to arrive'
                    : (p1Minutes === 0 ? 'is arriving' : 'will arrive');
  const strP1Minutes = p1Minutes === 0
                    ? 'now'
                    : 'in ' + pluralPhrase(p1Minutes, 'minute', 'minutes');

  if (!hasSecondPrediction) {
    return s(`${strPreamble} ${strP1Relation} ${strP1Minutes}.`);
  }

  const strP2Joiner = (p1IsScheduleBased === p2IsScheduleBased)
                    ? ', then again in'
                    : (p2IsScheduleBased ? '. After that, the next one is scheduled to arrive in' : '. After that, next one will arrive in');
  let strP2Minutes = pluralPhrase(p2Minutes, 'minute', 'minutes');

  if (hasThirdPrediction && !p1IsScheduleBased && !p2IsScheduleBased && !p3IsScheduleBased) {
    // we now have ', then again in __ minutes' in our string
    strP2Minutes = p2Minutes + ' and ' + pluralPhrase(p3Minutes, 'minute', 'minutes');
  }

  return s(`${strPreamble} ${strP1Relation} ${strP1Minutes}${strP2Joiner} ${strP2Minutes}.`);
}

module.exports = {
  'welcome': [
    s('Hello there! I can look up bus times for you. For example, you can say, "when is the next 12 to downtown?"'),
    s('Hello! You can ask me for bus times. For example, you can say, "when is the next outbound N?"')
  ],
  'welcome.noLocation': s('Hello there! I can look up bus times for you. For example, you can say, "when is the next 12 to downtown?". But first, you\'ll need to tell me your location by saying "set my location."'),

  // TODO make the help responses
  'help':             s('Hey! Hope I have been useful to you.'),
  'help.noLocation':  s('Hey! Hope I have been useful to you. You can start by letting me know where you are so I can look up bus times near you. Try saying "set my location."'),

  'getLocation':                           s('Your location is set to <say-as interpret-as="address">{{address}}</say-as>.'),
  // TODO use an example address as an example command
  'getLocation.noLocation':                s('You haven\'t set a location yet. You can ask me to set a location by saying "set my location".'),
  'getLocation.noLocation.deviceLocation': s('You haven\'t set a location yet. Simply ask for bus times to use your device location, or say "set my location".'),

  'updateLocation':                 s('There. Your location is now set to <say-as interpret-as="address">{{address}}</say-as>.'),
  'updateLocation.missingAdress':   s(`You must specify an address. For example, you can say "update my location to ${EXAMPLE_ADDRESS}."`),
  'updateLocation.locationWarning': s(`There. Your location is now set to <say-as interpret-as="address">{{address}}</say-as>. ${LOCATION_WARNING}`),
  'updateLocation.notFound':        s('Hmm. I could not find that address. Try saying the full address again, including the city.'),

  'getBusTimes':                                getBusTimesString,
  'getBusTimes.missingBusDirection':            s('You must specify a direction. For example, "when is the next 12 to downtown?" or "when is the next inbound 12?"'),
  'getBusTimes.missingBusRoute':                s('You must specify a bus route. For example, "when is the next inbound J?" or "when is the next 14 to downtown?"'),
  'getBusTimes.missingLocation':                s('You haven\'t set your location yet. To do so, simply say "set my location."'),
  'getBusTimes.noPredictions':                  s('No predictions found for <w role="ivona:NN">{{busDirection}}</w> route <w role="ivona:NN">{{busRoute}}</w>.'),
  'getBusTimes.noPredictions.locationWarning':  s(`No predictions found for <w role="ivona:NN">{{busDirection}}</w> route <w role="ivona:NN">{{busRoute}}</w>. ${LOCATION_WARNING}`),

  'locationPermission.request.google': s('To look up routes near you', false),
  'locationPermission.denialWarning':  s('To proceed, I\'ll need your location. If you do not want to grant permission, you can set your address manually by saying "set my location."'),

  'error.generic':                  s('Sorry, there was an unexpected error. Please try again.'),
  // TODO should we put the location warning in the generic error case?
  'error.generic.locationWarning':  s('Sorry, there was an unexpected error. Please try again.'),

  'keyMissing':     s('I am at a loss for words. Something went wrong. Please try again in a few seconds.')
};
