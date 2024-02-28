//Validate Authentication in Request Header
const jwt = require('jsonwebtoken');
require('dotenv').config();
const {getUserRole} = require('./authorization');
const secretKey = process.env.JWT_SECRET;
const internalTestingKey = process.env.INTERNAL_TEST_KEY;

/*This file is not available within preview*/

module.exports = {generateJWT, generateRefreshToken, authenticate, validateRefreshToken};