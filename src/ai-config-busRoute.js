/* global module */
function busRouteFromInput(input) {
  // TODO log that we made this conversion
  if (!input) {
    return null;
  }

  input = input.toLowerCase();
  switch (input) {
    case 'bus':
    case 'train':
    case 'muni':
    case 'bart':
    case 'muni bus':
      input = '';
      break;

    case 'an':
    case 'and':
    case 'end':
      input = 'N';
      break;
  }

  ['bus', 'route', 'number', 'train', 'bart', 'muni', 'the'].forEach(badPart => {
    //replace them with empty strings
    input = input.split(badPart).join('');
  });

  return input ? input.trim() : null;
}

module.exports = {
  busRouteFromInput
};
