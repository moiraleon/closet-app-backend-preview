const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const utilFunctions = require('../util/utilFunctions');
const userModel = require('../models/userModels/userModel');
const errorHandler = require('../middleware/errorHandler');
const { generateRandomGuid, validateModel } = utilFunctions;
const {assignUserRole, authorizeUser } = require('../middleware/authorization');
const {generateJWT, generateRefreshToken, validateRefreshToken} = require('../middleware/authenticate');

// Route for user registration
router.post('/register', async (req, res, next) => {
  // Validate the request body against the userModel
  const validationError = validateModel(userModel, req.body);
  if (validationError) {
    res.status(400).json(validationError);
    return;
  }

  try {
    // Check if the email already exists in the database
    const existingUser = await db.query('SELECT * FROM users WHERE EMAIL = ?', [req.body.email]);

    if (existingUser.length > 0) {
      return res.status(409).send('A user with that email already exists');
    }

    // Generate a random GUID for UID
    const uid = generateRandomGuid();

    // Hash and salt the password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Insert user into the database
    await db.query(
      'INSERT INTO users (UID, EMAIL, PASSWORD, FIRST_NAME, LAST_NAME) VALUES (?, ?, ?, ?, ?)', 
      [uid, req.body.email, hashedPassword, req.body.firstName, req.body.lastName]
    );
    //Define reused variables
    const UID = uid;
    const email = req.body.email;

    //Assign User Role
    await assignUserRole(UID)  

    //User created, generate JWT 
    const token = await generateJWT(UID, email)
    const refreshToken = await generateRefreshToken(UID)
    const userData = {
      UID: UID,
      token: token,
      refreshToken: refreshToken
    };

    console.log('User registered successfully');
    res.status(200).json(userData); 

  } catch (error) {
    next(error);
  }
});;

// Route for user login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Retrieve user from the database based on the email
    const [results] = await db.query('SELECT UID, PASSWORD FROM users WHERE EMAIL = ?', [email]);
    if (!results || results.length === 0) {
      // User not found
      res.status(401).send('We had trouble locating a user with that email. Please try again.');
    } else {
      // Compare the provided password with the hashed password from the database
      const isPasswordValid = await bcrypt.compare(password, results.PASSWORD);
      if (isPasswordValid) {
        // Password is valid, generate JWT
        const UID = results.UID;
        const token = await generateJWT(UID, email)
        const refreshToken = await generateRefreshToken(UID)
        const userData = {
          UID: UID,
          token: token,
          refreshToken: refreshToken
        };

        console.log('User logged in successfully');
        res.status(200).json(userData); 
      } else {
        // Invalid password
        res.status(401).send('Invalid credentials');
      }
    }
  } catch (error) {
    // Handle errors
    console.error('Error during login:', error);
    res.status(500).send('Error during login');
  }
});

// Endpoint to generate a new token with refresh token
router.post('/refreshToken', validateRefreshToken, async (req, res) => {
  const { userId, refreshToken } = req.body; 

  try {
      //Retrieve email by UID
      const email = await db.query('SELECT EMAIL FROM users WHERE UID = ?', [userId]);

      if (email.length === 0) {
        // User not found
        res.status(400).send('User data not found');
      } 
      else {
      // Generate new JWT
      const token = await generateJWT(userId, email)

      // Return new JWT to client
      res.json({ token: token });
      }
  } catch (error) {
      console.error('Error generating new token:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to set user permissions based on user ID and role name
router.post('/setPersimmons', authorizeUser(['admin']), async (req, res, next) => {
  const { userId, roleName } = req.body;

  try {
    // Retrieve role ID based on the role name
    const role = await db.query('SELECT role_id FROM roles WHERE role_name = ?', [roleName]);
    if (!role || role.length === 0 || !role[0].role_id) {
      return res.status(404).send('Role not found');
    }

    const roleId = role[0].role_id;
    // Check if the user with the given user ID exists
    const [user] = await db.query('SELECT * FROM users WHERE UID = ?', [userId]);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Check if the user already has the specified role
    const existingUserRole = await db.query('SELECT * FROM user_roles WHERE user_id = ? AND role_id = ?', [userId, roleId]);
    if (existingUserRole.length > 0) {
      return res.status(409).send('User already has the specified role');
    }

    // Insert user role mapping into the user_roles table
    await db.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, roleId]);

    res.status(200).send('User permissions updated successfully');
  } catch (error) {
    next(error);
  }
});



module.exports = router;
