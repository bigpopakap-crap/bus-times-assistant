/* global require module */
const { copyObj } = require('../utils');

class Model {
  constructor(dataJson) {
    this.dataJson = dataJson;
  }

  toJSON() {
    return copyObj(this.dataJson);
  }
}

module.exports = Model;
