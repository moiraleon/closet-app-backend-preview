const mysql = require('mysql2/promise');
require('dotenv').config();

// Retrieve MySQL connection details from Heroku Config Vars
const pool = mysql.createPool({
  host: process.env.JAWSDB_HOST,
  user: process.env.JAWSDB_USERNAME,
  password: process.env.JAWSDB_PASSWORD,
  database: process.env.JAWSDB_DATABASE,
  port: process.env.JAWSDB_PORT,
});

// Test MySQL connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database');
    connection.release();
  } catch (error) {
    console.error('Error connecting to MySQL:', error);
  }
};

// Call the testConnection function
testConnection();

// Function to execute queries using promises
const query = async (sql, values) => {
  const [rows, fields] = await pool.execute(sql, values);
  return rows;
};

module.exports = {
  query,
  pool,
};
