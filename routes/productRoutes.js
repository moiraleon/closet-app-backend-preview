const express = require('express');
const router = express.Router();
const db = require('../db'); 
const {authenticate} = require('../middleware/authenticate');
const errorHandler = require('../middleware/errorHandler');
const utilFunctions = require('../util/utilFunctions');
const {authorizeUser } = require('../middleware/authorization');
const { processFilters, findDuplicateAndNewFilters, addNewFilters, deleteProductFilter} = require('../middleware/filtersHandler');

// Endpoint to create a new product
router.post('/createProduct', authenticate, authorizeUser(['admin', 'user']),  async (req, res) => {
    try {
        // Extract product data from the request body
        const { img, productType, userID } = req.body;
        let supported;

        // Validate that productType is provided
        if (!productType) {
            return res.status(400).json({ error: 'Product type is required' });
        }

        try {
            // Attempt to load the specific product model based on productType
            const productModel = require(`../models/productModels/${productType}Model`);
            const modelInstance = new productModel();
            // Check if the product type is supported
            if (!modelInstance.supported) {
                return res.status(400).json({ error: `We don't support ${productType} at this time` });
            }
            else{
              supported = modelInstance.supported;
            }
            // Validate the incoming data against the model's required fields
            modelInstance.fields.forEach((field) => {
              if (field.required && !(field.field in req.body)) {
                throw new Error(`${field.field} is required for ${productType}`);
              }
            });

          } catch (error) {
            console.log(error)
            return res.status(400).json({ error: `Invalid product type: ${productType}` });
          }
  
      // Insert general product data into the 'products' table
      const result = await db.query(
        'INSERT INTO products (IMG, PRODUCT_TYPE, SUPPORTED, USER_ID) VALUES (?, ?, ?, ?)',
        [img, productType, supported, userID]
      );
  
      const productID = result.insertId;
  
      res.status(201).json({ message: 'Product created successfully', productID });
    } catch (err) {
      // Handle errors using the errorHandler
      errorHandler(err, req, res);
    }
  });

// Endpoint to add filters to product
router.post('/addFilters/:productId', authenticate,  authorizeUser(['admin', 'user']), async (req, res) => {
    try{
    // Extract product data from the request body
    const {userID, filtersArray } = req.body;
    const productId = req.params.productId;
      
    //Verify product id is valid and attributed to corresponding user
    const [result] = await db.query(
      'SELECT * FROM products WHERE PRODUCT_ID = ? AND USER_ID = ?',
      [productId, userID]
    );
              
          //If there are product filters in the body, handle inserting filter data
            if (result && filtersArray && filtersArray.length > 0) {
              //Determine existing filter
              const existingFiltersArray = await processFilters(productId, filtersArray);

              //Remove duplicate filters
              const newFilters = await findDuplicateAndNewFilters(existingFiltersArray,filtersArray )

              //Add new filters to product
              const filtersAdded = await addNewFilters(productId,newFilters)
              console.log(filtersAdded)
              res.status(200).json({ message: 'Successfully added filters to product ', filtersAdded });
            }

            //If the product exists but there are no filters
            else if(result && !filtersArray){
              res.status(404).json({ error: 'No filters found to attach to product' });

            // No matching product found
            } else {
                res.status(404).json({ error: 'Product not found for user' });
            }
    } catch (err) {
      // Handle errors using the errorHandler
      errorHandler(err, req, res);
  }
});

// Endpoint to get a product by its ID
router.get('/getProduct/:productId',authenticate, authorizeUser(['admin', 'user']), async (req, res) => {
  try {
      // Extract product ID from the request parameters
      const productId = req.params.productId;

      // Query to retrieve product details and associated filters
      const query = `
      SELECT *
      FROM products
      WHERE PRODUCT_ID = ?;
  `;
  
  // Execute the query
  const [results] = await db.query(query, [productId]);
  
      // Check if the product exists
      if (!results || results.length === 0) {
          return res.status(404).json({ error: 'Product not found' });
      }

      res.status(200).json(results);
  } catch (err) {
      // Handle errors using the errorHandler
      errorHandler(err, req, res);
  }
});

// Endpoint to get all product filter data
router.get('/getProductFilters/:productId', authenticate, authorizeUser(['admin', 'user']), async (req, res) => {
  try {
      // Extract the product ID from the request parameters
      const productId = req.params.productId;

      // Query to retrieve all product filter data for a specific product
      const query = `
          SELECT
              pf.FILTER_ID,
              fv.FILTER_VALUE,
              f.FILTER_TYPE
          FROM
              product_filters pf
          JOIN
              filter_values fv ON pf.FILTER_VALUE_ID = fv.FILTER_VALUE_ID
          JOIN
              filters f ON pf.FILTER_ID = f.FILTER_ID
          WHERE
              pf.PRODUCT_ID = ?;
      `;

      // Execute the query
      const results = await db.query(query, [productId]);

      // Check if any filter data is found
      if (!results || results.length === 0) {
          return res.status(404).json({ error: 'Product filter data not found' });
      }

      // Return the filter data
      res.status(200).json(results);
  } catch (err) {
      // Handle errors using the errorHandler
      errorHandler(err, req, res);
  }
});

// Endpoint to get all product data with associated filters
router.get('/getProductData/:productId', authenticate, authorizeUser(['admin', 'user']), async (req, res) => {
  try {
    // Extract product ID from the request parameters
    const productId = req.params.productId;

   // Query to retrieve product data and associated filter data by ID
   const query = `
   SELECT
     p.PRODUCT_ID,
     p.IMG,
     p.PRODUCT_TYPE,
     p.SUPPORTED,
     p.USER_ID,
     pf.FILTER_ID,
     f.FILTER_TYPE,
     fv.FILTER_VALUE
   FROM
     products p
   LEFT JOIN
     product_filters pf ON p.PRODUCT_ID = pf.PRODUCT_ID
   LEFT JOIN
     filters f ON pf.FILTER_ID = f.FILTER_ID
   LEFT JOIN
     filter_values fv ON pf.FILTER_VALUE_ID = fv.FILTER_VALUE_ID
   WHERE
     p.PRODUCT_ID = ?;
 `;

 // Execute the query
 const results = await db.query(query, [productId]);

 // Check if the product exists
 if (!results || results.length === 0) {
   return res.status(404).json({ error: 'Product not found' });
 }

 // Organize the result into a structured response
 const productData = {
   PRODUCT_ID: results[0].PRODUCT_ID,
   IMG: results[0].IMG,
   PRODUCT_TYPE: results[0].PRODUCT_TYPE,
   SUPPORTED: results[0].SUPPORTED,
   USER_ID: results[0].USER_ID,
   productFilters: results.map(({ FILTER_ID, FILTER_TYPE, FILTER_VALUE }) => ({
     filterID: FILTER_ID,
     filterType: FILTER_TYPE,
     filterValue: FILTER_VALUE
   }))
 };

 res.status(200).json(productData);
  }  catch (err) {
    // Handle errors using the errorHandler
    errorHandler(err, req, res);
  }
});


// Endpoint to get all products for a user
router.get('/getAllUserProducts/:userId', authenticate, authorizeUser(['admin', 'user']), async (req, res) => {
  try {
      // Extract user ID from the request parameters
      const userId = req.params.userId;

      // Query to retrieve all products for the user
      const query = `
          SELECT *
          FROM products
          WHERE USER_ID = ?;
      `;

      // Execute the query
      const results = await db.query(query, [userId]);

      // Check if any products were found
      if (!results || results.length === 0) {
          return res.status(404).json({ error: 'No products found for this user' });
      }

      // Return the products
      res.status(200).json(results);
  } catch (err) {
      // Handle errors using the errorHandler
      errorHandler(err, req, res);
  }
});


// Endpoint to get all products for a user based on product type
router.get('/getProductsType/:productType/:userId', authenticate, authorizeUser(['admin', 'user']), async (req, res) => {
  try {
      // Extract user ID and product type from the request parameters
      const userId = req.params.userId;
      const productType = req.params.productType;

      // Query to retrieve all products for the user and the specified product type
      const query = `
          SELECT *
          FROM products
          WHERE USER_ID = ? AND PRODUCT_TYPE = ?;
      `;

      // Execute the query
      const results = await db.query(query, [userId, productType]);

      // Check if any products were found
      if (!results || results.length === 0) {
          return res.status(404).json({ error: 'No products found for this user and product type' });
      }

      // Return the products
      res.status(200).json(results);
  } catch (err) {
      // Handle errors using the errorHandler
      errorHandler(err, req, res);
  }
});

  
// Endpoint to get all products for a user based on product type and filter
router.get('/getProductsFiltered/:productType/:userId', authenticate, authorizeUser(['admin', 'user']), async (req, res) => {
  try {
      // Extract user ID, product type, and filter from the request parameters and body
      const userId = req.params.userId;
      const productType = req.params.productType;
      const filter = req.body.filter;

      // Query to retrieve all products for the user, product type, and matching filter
      const query = `
          SELECT p.*
          FROM products p
          JOIN product_filters pf ON p.PRODUCT_ID = pf.PRODUCT_ID
          JOIN filter_values fv ON pf.FILTER_ID = fv.FILTER_ID
          JOIN filters f ON fv.FILTER_ID = f.FILTER_ID
          WHERE p.USER_ID = ? AND p.PRODUCT_TYPE = ? AND f.FILTER_TYPE = ? AND fv.FILTER_VALUE = ?;
      `;

      // Execute the query
      const results = await db.query(query, [userId, productType, filter.type, filter.value]);

      // Check if any products were found
      if (!results || results.length === 0) {
          return res.status(404).json({ error: 'No products found for this user, product type, and filter' });
      }

      // Return the products
      res.status(200).json(results);
  } catch (err) {
      // Handle errors using the errorHandler
      errorHandler(err, req, res);
  }
});


//update product 


// Endpoint to delete a product and its associated filter data
router.delete('/delete/:productId', authenticate, authorizeUser(['admin', 'user']), async (req, res) => {
  try {
    // Extract product ID from the request parameters
    const productId = req.params.productId;

    // Retrieve the filter IDs associated with the product
    const filterIdsResult = await db.query('SELECT FILTER_ID FROM product_filters WHERE PRODUCT_ID = ?', [productId]);
    const filterIds = filterIdsResult.map(row => row.FILTER_ID);

    // Delete the records from the product_filters table
    await db.query('DELETE FROM product_filters WHERE PRODUCT_ID = ?', [productId]);

    // Check if there are filter IDs associated with the product
    if (filterIds.length > 0) {
        // Create placeholders for the filter IDs in the query
        const placeholders = filterIds.map(() => '?').join(',');

        // Delete the records from the filter_values table
        await db.query(`DELETE FROM filter_values WHERE FILTER_ID IN (${placeholders})`, filterIds);

        // Delete the records from the filters table
        await db.query(`DELETE FROM filters WHERE FILTER_ID IN (${placeholders})`, filterIds);
    }

    // Delete the product record from the products table
    await db.query('DELETE FROM products WHERE PRODUCT_ID = ?', [productId]);

    // Send a success response
    res.status(200).json({ message: 'Product and its associated filter data deleted successfully' });
}catch (err) {
      // Handle errors using the errorHandler
      errorHandler(err, req, res);
  }
});


// Endpoint to delete a product filter by filter ID and product ID
router.delete('delete/:productId/filters/:filterId', authenticate, authorizeUser(['admin', 'user']), async (req, res) => {
  try {
      // Extract product ID and filter ID from the request parameters
      const { productId, filterId } = req.params;

      const deleteResults = await deleteProductFilter(productId, filterId);
      
      const productExists = deleteResults.productExists 
      const filterExists = deleteResults.filterExists 
      const totalAffectedRows = deleteResults.totalAffectedRows
      if (productExists.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      if (filterExists.length === 0) {
        return res.status(404).json({ error: 'Filter not found' });
      }

      if(totalAffectedRows > 0 || filterExists.length > 0){
        // Send a success response
        return res.status(200).json({ message: 'Product filter deleted successfully', totalAffectedRows , filterExists });
      }
      else {
        return res.status(404).json({ message: 'No product filter data was found.' , totalAffectedRows , filterExists });
      }

  } catch (err) {
      // Handle errors using the errorHandler
      errorHandler(err, req, res);
  }
});

module.exports = router;