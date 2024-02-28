const express = require('express');
const router = express.Router();
const db = require('../db'); 
const {authenticate} = require('../middleware/authenticate');
const errorHandler = require('../middleware/errorHandler');
const utilFunctions = require('../util/utilFunctions');
const {authorizeUser } = require('../middleware/authorization');

// Route for fetching user data 
router.get('/:id', authenticate, authorizeUser(['admin', 'user']), async (req, res) => {
  const userId = req.params.id;

  try {
    // Fetch user data from the database
    const results = await db.query('SELECT FIRST_NAME, LAST_NAME, EMAIL, AVATAR FROM users WHERE UID = ?', [userId]);

    if (results.length === 0) {
      res.status(404).send('User not found');
    } else {
      const user = results[0];
      res.status(200).json(user);
    }
  } catch (err) {
    console.error('Database Error:', err);
    errorHandler(err, req, res);
  }
});

// Route for fetching user's first name
router.get('/getFirstName/:userId', authenticate, authorizeUser(['admin', 'user']), async (req, res) => {
  const userId = req.params.userId;

  try {
    // Fetch user's first name from the database using async/await
    const results = await db.query('SELECT FIRST_NAME FROM users WHERE UID = ?', [userId]);

    if (results.length === 0) {
      res.status(404).send('User not found');
    } else {
      const firstName = results[0].FIRST_NAME;
      res.status(200).json({ firstName });
    }
  } catch (err) {
    // Handle errors using the errorHandler
    errorHandler(err, req, res);
  }
});

// Route for updating user's first name
router.put('/updateFirstName/:userId', authenticate, authorizeUser(['admin', 'user']), async (req, res) => {
  const userId = req.params.userId;
  const { firstName } = req.body;

  if (!firstName) {
    res.status(400).json({ error: 'First name is required in the request body' });
    return;
  }

  try {
    // Update user's first name in the database
    await db.query('UPDATE users SET FIRST_NAME = ? WHERE UID = ?', [firstName, userId]);

    console.log('User\'s first name updated successfully');
    res.status(200).send('User\'s first name updated successfully');
  } catch (error) {
    errorHandler(error, req, res);
  }
});

// Route for fetching user's last name
router.get('/getLastName/:userId', authenticate, authorizeUser(['admin', 'user']), async (req, res) => {
  const userId = req.params.userId;

  try {
    // Fetch user's last name from the database
    const results = await db.query('SELECT LAST_NAME FROM users WHERE UID = ?', [userId]);

    if (results.length === 0) {
      res.status(404).send('User not found');
    } else {
      const lastName = results[0].LAST_NAME;
      res.status(200).json({ lastName });
    }
  } catch (error) {
    errorHandler(error, req, res);
  }
});


// Route for updating user's last name
router.put('/updateLastName/:userId', authenticate, authorizeUser(['admin', 'user']), async (req, res) => {
  const userId = req.params.userId;
  const { lastName } = req.body;

  if (!lastName) {
    res.status(400).json({ error: 'Last name is required in the request body' });
    return;
  }

  try {
    // Update user's last name in the database
    await db.query('UPDATE users SET LAST_NAME = ? WHERE UID = ?', [lastName, userId]);

    console.log('User\'s last name updated successfully');
    res.status(200).send('User\'s last name updated successfully');
  } catch (error) {
    errorHandler(error, req, res);
  }
});


module.exports = router;
