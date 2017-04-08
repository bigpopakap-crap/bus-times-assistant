/* global require module */
const Response = require('./response.js');

const EXAMPLE_ADDRESS = '<say-as interpret-as="address">100 Van Ness Avenue, San Francisco</say-as>';
const LOCATION_WARNING = 'This service currently works in the San Francisco Bay Area only, but I am always learning about bus times in new cities!';

//function q(str, isSSML = true) {
//  return new Response(str, true, isSSML);
//}

function a(str, isSSML = true) {
  return new Response(str, false, isSSML);
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
    return a(`${strPreamble} ${strP1Relation} ${strP1Minutes}.`);
  }

  const strP2Joiner = (p1IsScheduleBased === p2IsScheduleBased)
                    ? ', then again in'
                    : (p2IsScheduleBased ? '. After that, the next one is scheduled to arrive in' : '. After that, next one will arrive in');
  let strP2Minutes = pluralPhrase(p2Minutes, 'minute', 'minutes');

  if (hasThirdPrediction && !p1IsScheduleBased && !p2IsScheduleBased && !p3IsScheduleBased) {
    // we now have ', then again in __ minutes' in our string
    strP2Minutes = p2Minutes + ' and ' + pluralPhrase(p3Minutes, 'minute', 'minutes');
  }

  return a(`${strPreamble} ${strP1Relation} ${strP1Minutes}${strP2Joiner} ${strP2Minutes}.`);
}

module.exports = {
  /* WELCOME **************************************************************/
  'welcome': [
    a('Hello there! I can look up bus times for you. For example, you can say, "when is the next 12 to downtown?"'),
    a('Hello! You can ask me for bus times. For example, you can say, "when is the next outbound N?"')
  ],

  'welcome.noLocation': [
    a('Hello there! I can look up bus times for you. For example, you can say, "when is the next 12 to downtown?". But first, you\'ll need to tell me your location by saying "set my location."')
  ],

  /* HELP *****************************************************************/
  'help': [
    a('Hey! Hope I have been useful to you.')
  ],

  'help.noLocation': [
    a('Hey! Hope I have been useful to you. You can start by letting me know where you are so I can look up bus times near you. Try saying "set my location."')
  ],

  /* GET MY LOCATION ******************************************************/
  'getLocation': [
    a('Your location is set to <say-as interpret-as="address">{{address}}</say-as>.')
  ],

  'getLocation.noLocation': [
    a('You haven\'t set a location yet. You can ask me to set a location by saying "set my location".')
  ],

  'getLocation.noLocation.deviceLocation': [
    a('You haven\'t set a location yet. Simply ask for bus times to use your device location, or say "set my location".')
  ],

  /* UPDATE MY LOCATION *****************************************************/
  'updateLocation': [
    a('There. Your location is now set to <say-as interpret-as="address">{{address}}</say-as>.')
  ],

  'updateLocation.missingAddress': [
    a(`You must specify an address. For example, you can say "update my location to ${EXAMPLE_ADDRESS}."`)
  ],

  'updateLocation.locationWarning': [
    a(`There. Your location is now set to <say-as interpret-as="address">{{address}}</say-as>. ${LOCATION_WARNING}`)
  ],

  'updateLocation.notFound': [
    a('Hmm. I could not find that address. Try saying the full address again, including the city.')
  ],

  /* GET BUS TIMES *********************************************************/
  'getBusTimes': getBusTimesString,

  'getBusTimes.missingBusDirection': [
    a('You must specify a direction. For example, "when is the next 12 to downtown?" or "when is the next inbound 12?"')
  ],

  'getBusTimes.missingBusRoute': [
    a('You must specify a bus route. For example, "when is the next inbound J?" or "when is the next 14 to downtown?"')
  ],

  'getBusTimes.missingLocation': [
    a('You haven\'t set your location yet. To do so, simply say "set my location."')
  ],

  'getBusTimes.noPredictions': [
    a('No predictions found for <w role="ivona:NN">{{busDirection}}</w> route <w role="ivona:NN">{{busRoute}}</w> within 1.5 miles of your location.')
  ],

  'getBusTimes.noPredictions.locationWarning': [
    a(`No predictions found for <w role="ivona:NN">{{busDirection}}</w> route <w role="ivona:NN">{{busRoute}}</w> within 1.5 miles of your location. ${LOCATION_WARNING}`)
  ],

  /* LOCATION PERMISSION REQUEST ************************************************/
  'locationPermission.request.google': [
    a('To look up routes near you', false)
  ],

  'locationPermission.denialWarning': [
    a('To proceed, I\'ll need your location. If you do not want to grant permission, you can set your address manually by saying "set my location."')
  ],

  /* GENERIC ERRORS **************************************************************/
  'error.generic': [
    a('Sorry, there was an unexpected error. Please try again.')
  ],

  // TODO should we put the location warning in the generic error case?
  'error.generic.locationWarning': [
    a('Sorry, there was an unexpected error. Please try again.')
  ],

  /* FALLBACK FOR MISSING STRINGS ************************************************/
  'keyMissing': [
    a('I am at a loss for words. Something went wrong. Please try again in a few seconds.')
  ]
};
