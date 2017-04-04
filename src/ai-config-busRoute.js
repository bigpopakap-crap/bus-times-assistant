/* global module */
function busRouteFromInput(input) {
  if (!input) {
    return null;
  }

  input = input.toLowerCase();
  switch (input) {
    case 'an':
    case 'and':
    case 'end':
      return 'N';

    default:
      return input;
  }
}

module.exports = {
  busRouteFromInput
};
