/* global require module */
const { copyObj } = require('./mrkapil/utils');

class Model {
  constructor(dataJson) {
    this.dataJson = dataJson;
  }

  toJSON() {
    return copyObj(this.dataJson);
  }
}

module.exports = Model;
