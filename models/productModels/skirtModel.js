const BaseModel = require('./baseModel');

class skirtModel extends BaseModel {
  constructor() {
    super();
    this.productType = 'skirt'
    this.supported = true; 
    this.fields = [
      { field: 'productType', type: 'string', required: true },
      { field: 'supported', type: Boolean, required: true },
    ];
  }
}

module.exports = skirtModel;