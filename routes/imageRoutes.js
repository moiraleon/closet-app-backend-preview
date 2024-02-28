const express = require('express');
const router = express.Router();
const db = require('../db'); 
const {authenticate} = require('../middleware/authenticate');
const errorHandler = require('../middleware/errorHandler');
const utilFunctions = require('../util/utilFunctions');
const {authorizeUser } = require('../middleware/authorization');
const ImageKit = require("imagekit");
require('dotenv').config();

const imagekit = new ImageKit({
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY
});

//Route for retrieving single use token
router.get("/auth", authenticate,  authorizeUser(['admin', 'user']), function (req, res) {
    try{
    var result = imagekit.getAuthenticationParameters();
    res.send(result);
    }
    catch(err){
      errorHandler(error, req, res);
    }
});  

// Route for fetching user's avatar
router.get('/getAvatar/:userId', authenticate, authorizeUser(['admin', 'user']), async (req, res) => {
    const userId = req.params.userId;
  
    try {
      // Fetch user's avatar from the database
      const results = await db.query('SELECT AVATAR FROM users WHERE UID = ?', [userId]);
  
      if (results.length === 0) {
        res.status(404).send('User not found');
      } else {
        const avatar = results[0].AVATAR;
        res.status(200).json({ avatar });
      }
    } catch (error) {
      errorHandler(error, req, res);
    }
  });
  
  
  // Route for updating user's avatar
  router.put('/updateAvatar/:userId', authenticate, authorizeUser(['admin', 'user']), async (req, res) => {
    const userId = req.params.userId;
    const { avatar } = req.body;
  
    if (!avatar) {
      res.status(400).json({ error: 'Avatar URL is required in the request body' });
      return;
    }
  
    try {
      // Update user's avatar in the database
      await db.query('UPDATE users SET AVATAR = ? WHERE UID = ?', [avatar, userId]);
      console.log('User\'s avatar updated successfully');
      res.status(200).send('User\'s avatar updated successfully');
    } catch (error) {
      errorHandler(error, req, res);
    }
  });

module.exports = router;