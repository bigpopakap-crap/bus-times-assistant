/* global require module */
const { BUS_DIRECTION_INPUTS } = require('./ai-config-busDirection.js');

const BLACKLIST = [].concat(BUS_DIRECTION_INPUTS, [
  'bus',
  'train',
  'muni',
  'bart',
  'muni bus',
  'bart train',
  'subway',
  'subway train',
  'line',
  'route',
  'next',
  // 'or' is specifically not in here
]);

function busRouteFromInput(input) {
  // TODO log that we made this conversion
  if (!input) {
    return null;
  }

  input = input.toLowerCase();
  switch (input) {
    case 'an':
    case 'and':
    case 'end':
      input = 'N';
      break;
  }

  BLACKLIST.forEach(badPart => {
    //replace them with empty strings
    input = input.split(badPart).join('');
  });

  return input ? input.trim() : null;
}

module.exports = {
  busRouteFromInput
};
