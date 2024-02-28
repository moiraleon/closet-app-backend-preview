const BaseModel = require('./baseModel');

class shortsModel extends BaseModel {
  constructor() {
    super();
    this.productType = 'shorts'
    this.supported = true; 
    this.fields = [
      { field: 'productType', type: 'string', required: true },
      { field: 'supported', type: Boolean, required: true },
    ];
  }
}

module.exports = shortsModel;