const userModel = [
    { field: 'email', type: 'string', required: true },
    { field: 'password', type: 'string', required: true },
    { field: 'firstName', type: 'string', required: true },
    { field: 'lastName', type: 'string', required: true },
    { field: 'avatar', type: 'string', required: false },
  ];
  
  module.exports = userModel;