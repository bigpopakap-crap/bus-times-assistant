/* global module */
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

function prefixObject(prefix, obj) {
  const newObj = {};

  Object.keys(obj).forEach(prop => {
    newObj[`${prefix}${prop}`] = obj[prop];
  });

  return newObj;
}

function extendObject(...objs) {
  const newObj = {};

  objs.forEach(obj => {
    Object.keys(obj).forEach(prop => {
      newObj[prop] = obj[prop];
    });
  });

  return newObj;
}

module.exports = {
  contains,
  pluralPhrase,
  prefixObject,
  extendObject
};
