const BaseModel = require('./baseModel');

class sweaterModel extends BaseModel {
  constructor() {
    super();
    this.productType = 'sweater'
    this.supported = true; 
    this.fields = [
      { field: 'productType', type: 'string', required: true },
      { field: 'supported', type: Boolean, required: true },
    ];
  }
}

module.exports = sweaterModel;