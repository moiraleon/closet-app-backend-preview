//Generate GUID
function generateRandomGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  } 

  // Validate request body against the provided model
function validateModel(model, requestBody) {
  const missingProperties = model
    .filter(({ field, required }) => required && !requestBody[field])
    .map(({ field }) => field);

  if (missingProperties.length > 0) {
    return {
      error: `Missing required properties: ${missingProperties.join(', ')}`,
    };
  }

  return null; // Validation passed
}

module.exports = {
  generateRandomGuid,
  validateModel,
};