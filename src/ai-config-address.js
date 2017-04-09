/* global module */
function addressFromInput(input) {
  if (!input) {
    return null;
  }

  switch (input.toLowerCase().trim()) {
    case 'update my location':
      return null;

    default:
      return input;
  }
}

module.exports = {
  addressFromInput
};