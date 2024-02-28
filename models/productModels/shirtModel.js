const BaseModel = require('./baseModel');

class shirtModel extends BaseModel {
  constructor() {
    super();
    this.productType = 'shirt'
    this.supported = true; 
    this.fields = [
      { field: 'productType', type: 'string', required: true },
      { field: 'supported', type: Boolean, required: true },
    ];
  }
}

module.exports = shirtModel;