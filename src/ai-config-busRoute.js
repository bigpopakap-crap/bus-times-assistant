/* global module */
function busRouteFromInput(input) {
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
      return null;

    case 'an':
    case 'and':
    case 'end':
      // TODO log that we made this conversion
      return 'N';

    default:
      return input;
  }
}

module.exports = {
  busRouteFromInput
};
