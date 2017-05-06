/* global module */
const BUSDESCRIPTOR = [
  'bus',
  'train',
  'muni',
  'bart',
  'muni bus',
  'bart train',
  'subway',
  'subway train',
  'line',
  'route'
];

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

  BUSDESCRIPTOR.forEach(badPart => {
    //replace them with empty strings
    input = input.split(badPart).join('');
  });

  return input ? input.trim() : null;
}

module.exports = {
  busRouteFromInput
};
