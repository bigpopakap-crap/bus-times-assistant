const { NEXTBUS_ERRORS, getNearestStopResult } = require('./nextbus-adapter.js');
const { pluralPhrase } = require('./utils.js');

const GENERIC_ERROR_RESPONSE = 'Sorry, there was an error. Please try again.';

function generatePredictionResponse(p) {
  // special case for arriving
  if (p.minutes === 0) {
    return p.isScheduleBased ? 'is scheduled to arrive now' : 'is arriving now';
  } else {
    const pTypeLabel = p.isScheduleBased ? 'is scheduled to arrive' : 'will arrive';
    const minutePhrase = pluralPhrase(p.minutes, 'minute', 'minutes');
    return `${pTypeLabel} in ${minutePhrase}`;
  }
}

function reportNearestStopResult(deviceLocation, busRoute, busDirection, respondCallback) {
  // TODO handle invalid input

  getNearestStopResult(deviceLocation, busRoute, busDirection, function(err, result) {
    if (err) {
      switch (err) {
        case NEXTBUS_ERRORS.NOT_FOUND:
          respondCallback(`No nearby stops found for ${busDirection} route ${busRoute}.`);
          break;
        default:
          respondCallback(GENERIC_ERROR_RESPONSE);
          break;
      }

      return;
    }

    const predictions = (result && result.values) || [];
    if (predictions.length <= 0) {
      respondCallback(`No predictions found for ${busDirection} route ${busRoute}`);
      return;
    }

    const p1 = predictions[0];
    const p1Response = generatePredictionResponse(p1);

    let response = `The next ${busDirection} ${busRoute} from ${result.busStop} ${p1Response}`;

    if (predictions.length > 1) {
      const p2 = predictions[1];

      if (p2.isScheduleBased) {
        const p2Response = generatePredictionResponse(p2);
        response = `${response}. After that, the next one ${p2Response}`;
      } else {
        const minutePhrase = pluralPhrase(p2.minutes, 'minute', 'minutes');
        response = `${response}, then again in ${minutePhrase}`;
      }
    }

    respondCallback(`${response}.`);
  });
}

module.exports = {
  reportNearestStopResult
};
