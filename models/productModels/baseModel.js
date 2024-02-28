class BaseModel {
    constructor() {
      this.fields = [
        { field: 'img', type: 'string', required: true },
        { field: 'productType', type: 'string', required: true },
        { field: 'supported', type: Boolean, required: true },
        {
          field: 'filters',
          type: 'array',
          required: false,
          subFields: [
            { field: 'color', type: 'array', itemType: 'string', required: false },
            { field: 'pattern', type: 'array', itemType: 'string', required: false },
            { field: 'fit', type: 'array', itemType: 'string', required: false },
            { field: 'season', type: 'array', itemType: 'string', required: false },
            { field: 'style', type: 'array', itemType: 'string', required: false },
            { field: 'material', type: 'array', itemType: 'string', required: false },
            { field: 'brand', type: 'array', itemType: 'string', required: false },
            { field: 'occassion', type: 'array', itemType: 'string', required: false }
          ]
        }
      ];
    }
  
    getField(name) {
      return this.fields.find(field => field.field === name);
    }
  
    validate() {
      // Implement validation logic if needed
    }
  }
  
  module.exports = BaseModel;
  