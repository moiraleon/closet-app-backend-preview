const express = require('express');
const db = require('./db');
const authRoutes = require('./routes/authRoutes'); 
const userRoutes = require('./routes/userRoutes'); 
const productRoutes = require('./routes/productRoutes'); 
const imageRoutes = require('./routes/imageRoutes'); 
const cors = require('cors');

const app = express();

const allowedOrigins = ['https://front-end*****', 'http://localhost:8100'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

// Middleware for parsing JSON requests
app.use(express.json());

//Sample route for testing deployment connection
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is healthy' });
});

// Include authRoutes
app.use('/api/auth', authRoutes); 

// Include userRoutes
app.use('/api/users', userRoutes); 

// Include productRoutes
app.use('/api/products', productRoutes); 

// Include productRoutes
app.use('/api/images', imageRoutes); 

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
