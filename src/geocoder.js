var Promise = require('promise');
var NodeGeocoder = require('node-geocoder');

var geocoder = NodeGeocoder({
  provider: 'google'
});

function geocode(address) {
  return new Promise((resolve, reject) => {
    geocoder.geocode(address, function(err, result) {
      if (err) {
        reject(err);
      } else if (!result || result.length < 1) {
        reject('Bad result'); // TODO better error handling?
      } else {
        const geo = result[0];

        // TODO format this completely and with localization?
        const formattedAddress = `${geo.streetNumber} ${geo.streetName}, ${geo.city}`;

        resolve({
          latitude: geo.latitude,
          longitude: geo.longitude,
          address: formattedAddress,
          originalAddressInput: address,
          originalAddressSource: 'geocoder'
        });
      }
    });
  });
}

module.exports = {
  geocode
};
