const BaseModel = require('./baseModel');

class dressModel extends BaseModel {
  constructor() {
    super();
    this.productType = 'dress'
    this.supported = false; 
    this.fields = [
      { field: 'productType', type: 'string', required: true },
      { field: 'supported', type: Boolean, required: true },
    ];
  }
}

module.exports = dressModel;