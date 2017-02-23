'use strict';

function contains(bigStr, smallStr, caseSensitive = false) {
  if (!caseSensitive) {
    bigStr = bigStr.toLowerCase();
    smallStr = smallStr.toLowerCase();
  }

  return bigStr.indexOf(smallStr) >= 0;
}

function pluralPhrase(count, singularLabel, pluralLabel) {
 return count == 1 ? `${count} ${singularLabel}` : `${count} ${pluralLabel}`;
}

module.exports = {
  contains,
  pluralPhrase
}
