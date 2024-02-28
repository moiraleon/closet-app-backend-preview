const db = require('../db');

// Middleware function to assign user to "user" role and insert into user_roles table
async function assignUserRole(uid) {
  const userId = uid; 
  
  // Query to insert user into user_roles table with "user" role
  const insertUserRoleQuery = `INSERT INTO user_roles (user_id, role_id) 
                               VALUES (?, (SELECT role_id FROM roles WHERE role_name = 'user'))`;

  // Execute the query
  db.query(insertUserRoleQuery, [userId], (error, results) => {
    if (error) {
      console.error('Error assigning user role:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    console.log('User assigned to "user" role and inserted into user_roles table');
    next(); 
  });
}

// Function to retrieve user role from the database
async function getUserRole(userId) {
  try {
    // Query the database to retrieve user role
    const [result] = await db.query('SELECT role_name FROM user_roles INNER JOIN roles ON user_roles.role_id = roles.role_id WHERE user_roles.user_id = ?', [userId]);
    // If user has a role, return it
    if (result) {
      return result.role_name;
    } else {
      // If user doesn't have a role, default to 'user'
      return 'user';
    }
  } catch (error) {
    console.error('Error retrieving user role:', error);
    // If an error occurs, default to 'user'
    return 'user';
  }
}


//Middleware to confirm user role and permissions
function authorizeUser(roles) {
  return (req, res, next) => {
    const userRole = req.user.userRole;
    
    // Check if the user's role matches any of the required roles
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
} 

module.exports = {assignUserRole, authorizeUser, getUserRole};    