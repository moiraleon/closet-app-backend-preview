const BaseModel = require('./baseModel');

class tanktopModel extends BaseModel {
  constructor() {
    super();
    this.productType = 'tanktop'
    this.supported = true; 
    this.fields = [
      { field: 'productType', type: 'string', required: true },
      { field: 'supported', type: Boolean, required: true },
    ];
  }
}

module.exports = tanktopModel;
