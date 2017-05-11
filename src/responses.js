/* global require module */
const Response = require('./response.js');

const EXAMPLE_ADDRESS = '<say-as interpret-as="address">100 Van Ness Avenue, San Francisco</say-as>';
const LOCATION_WARNING = 'I am just starting to learn about transit times in your city. I am always working to improve, so please let me know if you have any problems!';

function r(str, isSSML = true) {
  return new Response(str, isSSML);
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
    return r(`${strPreamble} ${strP1Relation} ${strP1Minutes}`);
  }

  const strP2Joiner = (p1IsScheduleBased === p2IsScheduleBased)
                      ? ', then again in'
                      : (p2IsScheduleBased ? '. After that, the next one is scheduled to arrive in' : '. After that, next one will arrive in');
  let strP2Minutes = pluralPhrase(p2Minutes, 'minute', 'minutes');

  if (hasThirdPrediction && !p1IsScheduleBased && !p2IsScheduleBased && !p3IsScheduleBased) {
    // we now have ', then again in __ minutes' in our string
    strP2Minutes = p2Minutes + ' and ' + pluralPhrase(p3Minutes, 'minute', 'minutes');
  }

  return r(`${strPreamble} ${strP1Relation} ${strP1Minutes}${strP2Joiner} ${strP2Minutes}`);
}

module.exports = {
  /* HEALTH CHECK **********************************************************/
  'healthCheck': r('Hey there! Looks like you\'re checking whether I am responsive. This is me responding!'),

  /* WELCOME **************************************************************/
  'welcome': [
    r('Hey there! You can ask me for transit times. For example, you can say, "when is the next outbound N?"'),
    r('Hello there! I can look up transit times near you. Try saying, "when is the next 12 to downtown?" or ask about any other transit line.')
  ],

  'welcome.noLocation': [
    r('Hello there! I can look up transit times for you. For example, you can say, "when is the next 12 to downtown?". But first, you\'ll need to tell me your location. Try saying "set my location."'),
    r('Hey there! I can look up transit times for you. But first, I\'ll need to know your address. Try saying "set my location". If you need more help, say "help me".')
  ],

  /* HELP *****************************************************************/
  'help': [
    r('Try saying "when is the next inbound 14?"'),
    r('You can ask about transit times near your location. For example, you can say "when is the next outbound N?"'),
    r('Make sure to include the transit route and direction. For example, "when is the next inbound 12?"')
  ],

  'help.noLocation': [
    r('You haven\'t told me your address yet. Try saying "set my location."'),
    r('Looks like you haven\'t told me your address. I\'ll need that in order to look up transit times for you. Try saying "set my location."')
  ],

  /* CANCEL *****************************************************************/
  'cancel': [
    r('No problem! Come back any time!'),
    r('I\'ll be right here when you need me')
  ],

  'cancel.thankYou': [
    r('You\'re welcome! See you later'),
    r('You\'re welcome! Hope to see you again soon')
  ],

  /* GET MY LOCATION ******************************************************/
  'getLocation': [
    r('Your location is set to <say-as interpret-as="address">{{address}}</say-as>.')
  ],

  'getLocation.noLocation': [
    r('You haven\'t set a location yet. You can ask me to set a location by saying "set my location".')
  ],

  'getLocation.noLocation.deviceLocation': [
    r('You haven\'t set a location yet. Simply ask for transit times to use your device location, or say "set my location".')
  ],

  /* UPDATE MY LOCATION *****************************************************/
  'updateLocation': [
    // TODO this should probably not close the session and allow the user to ask for bus times
    r('There. Your location is now set to <say-as interpret-as="address">{{address}}</say-as>. You can now ask for transit times! For example, you can say "when is the next inbound J?".')
  ],

  'updateLocation.locationWarning': [
    r(`There. Your location is now set to <say-as interpret-as="address">{{address}}</say-as>. ${LOCATION_WARNING}`)
  ],

  'updateLocation.missingAddress': [
    r(`I\'ll need to know the address. You can say something like, "set my location to ${EXAMPLE_ADDRESS}."`),
    r(`Try saying the full address including the city. For example, "set my location to ${EXAMPLE_ADDRESS}."`),
    r(`Hmm. I don\'t understand. I need to know your address. Try saying the full address including the city. For example, you can say, "set my location to ${EXAMPLE_ADDRESS}."`)
  ],

  'updateLocation.notFound': [
    r('Hmm. I could not find that address. Try again, and make sure to use full address including the city.'),
    r('Hmm. I could not find "<say-as interpret-as="address">{{address}}</say-as>". Try it again with the full address including the city.'),
    r(`I couldn't find "<say-as interpret-as="address">{{address}}</say-as>". Try saying the full address including the city. For example, "set my location to ${EXAMPLE_ADDRESS}."`),
    r(`I think you said "<say-as interpret-as="address">{{address}}</say-as>". I could not locate that address. Try saying the full address including the city. For example, "set my location to ${EXAMPLE_ADDRESS}."`)
  ],

  'updateLocation.notSpecific': [
    r('I\'ll need to know your exact street address. Try again, and make sure to use the number, street, and city.'),
    r(`You'll need to be more specific. Try it again with the street number, street name, and city. For example, "set my location to ${EXAMPLE_ADDRESS}."`)
  ],

  'updateLocation.notSpecific.withCity': [
    r('You said you are in {{city}}. I\'ll also need to know your exact street address. Try again, and make sure to use the number, street, and city.'),
    r(`You said you are in {{city}}. You'll need to be more specific. Try it again with the street number, street name, and city. For example, "set my location to ${EXAMPLE_ADDRESS}."`)
  ],

  /* GET BUS TIMES *********************************************************/
  'getBusTimes': getBusTimesString,

  'getBusTimes.missingBusDirection': [
    r('I\'ll need to know which route and direction. For example, "when is the next outbound N?"'),
    r('I\'ll need to know which route and direction. For example, "when is the next inbound J?"')
  ],

  'getBusTimes.missingBusRoute': [
    r('I\'ll need to know which route and direction. For example, "when is the next 12 to downtown?"'),
    r('I\'ll need to know which route and direction. For example, "when is the next outbound T"')
  ],

  'getBusTimes.missingLocation': [
    r('You haven\'t set your location yet. To do so, simply say "set my location."'),
    r('I\'ll need to know your address first. Simply say "set my location."')
  ],

  'getBusTimes.noPredictions': [
    r('No predictions found for <w role="ivona:NN">{{busDirection}}</w> route <w role="ivona:NN">{{busRoute}}</w> within 1.5 miles of your location. You can try again soon, or try asking about a different transit route.')
  ],

  'getBusTimes.noPredictions.locationWarning': [
    r(`No predictions found for <w role="ivona:NN">{{busDirection}}</w> route <w role="ivona:NN">{{busRoute}}</w> within 1.5 miles of your location. ${LOCATION_WARNING} Perhaps you'd like to try asking again, or asking about a different transit route?`)
  ],

  /* LOCATION PERMISSION REQUEST ************************************************/
  'locationPermission.request.google': [
    r('To look up routes near you', false)
  ],

  'locationPermission.denialWarning': [
    r('To proceed, I\'ll need your location. If you do not want to grant permission, you can set your address manually by saying "set my location."')
  ],

  /* GENERIC ERRORS **************************************************************/
  'error.generic': [
    r('Sorry, there was an unexpected error. Please try again.'),
    r('Oh no! Something went wrong. Please try again.')
  ],

  // TODO should we put the location warning in the generic error case?
  'error.generic.locationWarning': [
    r('Sorry, there was an unexpected error. Please try again.'),
    r('Oh no! Something went wrong. Please try again.')
  ],

  /* FALLBACK FOR MISSING STRINGS ************************************************/
  'keyMissing': [
    r('I am at a loss for words. Something went wrong. Please try again.'),
    r('I am simply stunned. Something unexpected went wrong. Please try again.')
  ]
};
