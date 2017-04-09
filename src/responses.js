/* global require module */
const Response = require('./response.js');

const EXAMPLE_ADDRESS = '<say-as interpret-as="address">100 Van Ness Avenue, San Francisco</say-as>';
const LOCATION_WARNING = 'This service currently works in the San Francisco Bay Area only, but I am always learning about transit times in new cities!';

function q(str, isSSML = true) {
  return new Response(str, true, isSSML);
}

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
    q('Hey there! You can ask me for MUNI times. For example, you can say, "when is the next outbound N?"'),
    q('Hello there! I can look up MUNI times near you. Try saying, "when is the next 12 to downtown?" or ask about any other MUNI line.')
  ],

  'welcome.noLocation': [
    q('Hello there! I can look up MUNI times for you. For example, you can say, "when is the next 12 to downtown?". But first, you\'ll need to tell me your location. Try saying "set my location."'),
    q('Hey there! I can look up MUNI times for you. But first, I\'ll need to know your address. Try saying "set my location". If you need more help, say "help me".')
  ],

  /* HELP *****************************************************************/
  'help': [
    q('Try saying "when is the next inbound 14?"'),
    q('You can ask about MUNI times near your location. For example, you can say "when is the next outbound N?"'),
    q('Make sure to include the MUNI route and direction. For example, "when is the next inbound 12?"')
  ],

  'help.noLocation': [
    q('You haven\'t told me your address yet. Try saying "set my location."'),
    q('Looks like you haven\'t told me your address. I\'ll need that in order to look up MUNI times for you. Try saying "set my location."')
  ],

  /* CANCEL *****************************************************************/
  'cancel': [
    a('No problem! Come back any time!'),
    a('I\'ll be right here when you need me')
  ],

  'cancel.thankYou': [
    a('You\'re welcome! See you later'),
    a('You\'re welcome! Hope to see you again soon')
  ],

  /* GET MY LOCATION ******************************************************/
  'getLocation': [
    a('Your location is set to <say-as interpret-as="address">{{address}}</say-as>.')
  ],

  'getLocation.noLocation': [
    q('You haven\'t set a location yet. You can ask me to set a location by saying "set my location".')
  ],

  'getLocation.noLocation.deviceLocation': [
    q('You haven\'t set a location yet. Simply ask for MUNI times to use your device location, or say "set my location".')
  ],

  /* UPDATE MY LOCATION *****************************************************/
  'updateLocation': [
    // TODO this should probably not close the session and allow the user to ask for bus times
    a('There. Your location is now set to <say-as interpret-as="address">{{address}}</say-as>.')
  ],

  'updateLocation.locationWarning': [
    a(`There. Your location is now set to <say-as interpret-as="address">{{address}}</say-as>. ${LOCATION_WARNING}`)
  ],

  'updateLocation.missingAddress': [
    q(`I\'ll need to know the address. You can say something like, "set my location to ${EXAMPLE_ADDRESS}."`),
    q(`Try saying the full address including the city. For example, "set my location to ${EXAMPLE_ADDRESS}."`),
    q(`Hmm. I don\'t understand. I need to know your address. Try saying the full address including the city. For example, you can say, "set my location to ${EXAMPLE_ADDRESS}."`)
  ],

  'updateLocation.notFound': [
    q('Hmm. I could not find that address. Try again, and make sure to use full address including the city.'),
    q(`Hmm. I could not find that address. Try it with the full address including the city. For example, "set my location to ${EXAMPLE_ADDRESS}."`)
  ],

  /* GET BUS TIMES *********************************************************/
  'getBusTimes': getBusTimesString,

  'getBusTimes.missingBusDirection': [
    q('I\'ll need to know which route and direction. For example, "when is the next outbound N?"'),
    q('I\'ll need to know which route and direction. For example, "when is the next inbound J?"')
  ],

  'getBusTimes.missingBusRoute': [
    q('I\'ll need to know which route and direction. For example, "when is the next 12 to downtown?"'),
    q('I\'ll need to know which route and direction. For example, "when is the next outbound T"')
  ],

  'getBusTimes.missingLocation': [
    q('You haven\'t set your location yet. To do so, simply say "set my location."'),
    q('I\'ll need to know your address first. Simply say "set my location."')
  ],

  'getBusTimes.noPredictions': [
    a('No predictions found for <w role="ivona:NN">{{busDirection}}</w> route <w role="ivona:NN">{{busRoute}}</w> within 1.5 miles of your location.')
  ],

  'getBusTimes.noPredictions.locationWarning': [
    a(`No predictions found for <w role="ivona:NN">{{busDirection}}</w> route <w role="ivona:NN">{{busRoute}}</w> within 1.5 miles of your location. ${LOCATION_WARNING}`)
  ],

  /* LOCATION PERMISSION REQUEST ************************************************/
  'locationPermission.request.google': [
    q('To look up routes near you', false)
  ],

  'locationPermission.denialWarning': [
    q('To proceed, I\'ll need your location. If you do not want to grant permission, you can set your address manually by saying "set my location."')
  ],

  /* GENERIC ERRORS **************************************************************/
  'error.generic': [
    a('Sorry, there was an unexpected error. Please try again.'),
    a('Oh no! Something went wrong. Please try again.')
  ],

  // TODO should we put the location warning in the generic error case?
  'error.generic.locationWarning': [
    a('Sorry, there was an unexpected error. Please try again.'),
    a('Oh no! Something went wrong. Please try again.')
  ],

  /* FALLBACK FOR MISSING STRINGS ************************************************/
  'keyMissing': [
    a('I am at a loss for words. Something went wrong. Please try again.'),
    a('I am simply stunned. Something unexpected went wrong. Please try again.')
  ]
};
