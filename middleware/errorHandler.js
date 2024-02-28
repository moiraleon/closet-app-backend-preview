// errorHandler.js

function errorHandler(err, req, res, next) {
    console.error('Error:', err);
  
    // Check if the error is an authentication-related error
    if (err.name === 'UnauthorizedError') {
      res.status(401).json({ error: 'Unauthorized access' });
    } else {
      // For other errors, send a generic 500 Internal Server Error response
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  module.exports = errorHandler;
  