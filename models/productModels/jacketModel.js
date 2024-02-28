const BaseModel = require('./baseModel');

class jacketModel extends BaseModel {
  constructor() {
    super();
    this.productType = 'jacket'
    this.supported = false; 
    this.fields = [
      { field: 'productType', type: 'string', required: true },
      { field: 'supported', type: Boolean, required: true },
    ];
  }
}

module.exports = jacketModel;