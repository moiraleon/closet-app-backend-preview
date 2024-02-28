const BaseModel = require('./baseModel');

class shoesModel extends BaseModel {
  constructor() {
    super();
    this.productType = 'shoes'
    this.supported = true; 
    this.fields = [
      { field: 'productType', type: 'string', required: true },
      { field: 'supported', type: Boolean, required: true },
    ];
  }
}

module.exports = shoesModel;