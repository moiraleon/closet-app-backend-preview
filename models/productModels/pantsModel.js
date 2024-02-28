const BaseModel = require('./baseModel');

class pantsModel extends BaseModel {
  constructor() {
    super();
    this.productType = 'pants'
    this.supported = true; 
    this.fields = [
      { field: 'productType', type: 'string', required: true },
      { field: 'supported', type: Boolean, required: true },
    ];
  }
}

module.exports = pantsModel;