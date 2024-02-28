const db = require('../db'); 

//Determine existing filter values based on request body filter types
async function processFilters(productId, filtersArray) {
    // Initialize the array to store filter key-value pairs
    const filtersKVPArray = [];
    const filterKeysArray = [];
    let existingFiltersArray = []; //array to denote existing filters for matching filterKeys

    for (const filter of filtersArray) {
        for (const [attributeKey, attributeValues] of Object.entries(filter)) {
            const filterKey = attributeKey;
            for (const filterValue of attributeValues) {
            // Construct the SQL query to check for existing filter values
            filtersKVPArray.push({ [filterKey]: filterValue });
            
            if (!filterKeysArray.includes(filterKey)) {
                filterKeysArray.push(filterKey);
            }
            }
        }
    }
    // Query to get all FILTER_IDs for the given PRODUCT_ID
    const filterIdsQuery = `
    SELECT FILTER_ID 
    FROM product_filters 
    WHERE PRODUCT_ID = ?;
    `;
    const filterIdsRows = await db.query(filterIdsQuery, [productId]);
    let filterIds;
    if (filterIdsRows && filterIdsRows.length > 0) {
    filterIds = filterIdsRows.map(row => row.FILTER_ID);
    } else {
    console.log('No filter Id\s were found')
    return;
    }

    // Query to get FILTER_TYPE for FILTER_IDs strictly for those filter types specified in request body
    const filterIdsList = filterIds.join(', '); // comma separated list of all filter id's for the existing product that were returned from the previous query 
    const filterKeysList = filterKeysArray.map(key => `'${key}'`).join(', '); // comma separated list of all the deduped filter types that are in the request body

    const filterTypesQuery = `
    SELECT FILTER_ID, FILTER_TYPE 
    FROM filters 
    WHERE FILTER_ID IN (${filterIdsList}) AND FILTER_TYPE IN (${filterKeysList});
    `;

    // Extract FILTER_IDs and corresponding FILTER_TYPEs
    const filterTypesRows = await db.query(filterTypesQuery); // and array of objects with the filter id and type limited down to filters that have the same type as what are being added in the query

    // Query to get FILTER_VALUEs for FILTER_IDs and FILTER_TYPEs
    const cslFilterIds = filterTypesRows.map(row => row.FILTER_ID).join(','); //the id's of the filters that were strictly within the types limited in the request body
    const filterValuesQuery = `
    SELECT fv.FILTER_ID, fv.FILTER_VALUE, f.FILTER_TYPE
    FROM filter_values fv
    JOIN filters f ON fv.FILTER_ID = f.FILTER_ID
    WHERE fv.FILTER_ID IN (${cslFilterIds});
    `;

    // Array to store filter ids, values, and filter types
    existingFiltersArray = await db.query(filterValuesQuery);

    return existingFiltersArray;
}

//Determine non duplicate filter values
async function findDuplicateAndNewFilters(existingFiltersArray, filtersArray) {
    const duplicateFilters = [];
    const newFilters = [];
    
    // Check if existingFiltersArray is defined
    if (existingFiltersArray) {
        for (const filterObj of filtersArray) {
            for (const [filterKey, filterValues] of Object.entries(filterObj)) {
                for (const filterValue of filterValues) {
                    const existingFilter = existingFiltersArray.find(filter =>
                        filter.FILTER_TYPE.toUpperCase() === filterKey.toUpperCase() &&
                        filter.FILTER_VALUE.toUpperCase() === filterValue.toUpperCase()
                    );

                    if (existingFilter) {
                        duplicateFilters.push(existingFilter);
                    } else {
                        newFilters.push({ [filterKey.toUpperCase()]: filterValue });
                    }
                }
            }
        }
    } else {
        // Handle the case where existingFiltersArray is undefined
        console.log('No existing filters found');
        console.log(filtersArray);
        
        // Restructure filtersArray
        for (const filterObj of filtersArray) {
            for (const [filterKey, filterValues] of Object.entries(filterObj)) {
                for (const filterValue of filterValues) {
                    newFilters.push({ [filterKey.toUpperCase()]: filterValue });
                }
            }
        }
    }
    
    // Extract and return all new filter values as their own object within an array
    return newFilters;
}

//Add new filters to a product
async function addNewFilters(productId, newFilters){
console.log(newFilters)
    for (const filter of newFilters) {
        const filterKey = Object.keys(filter)[0];
        console.log(filterKey)
        const filterValue = filter[filterKey]; 

        // Add Filter Type: Insert filter type into the filters table
        const insertFilterTypeQuery = 'INSERT INTO filters (FILTER_TYPE) VALUES (?)';
        const filterTypeResult = await db.query(insertFilterTypeQuery, [filterKey]);
        filterID = filterTypeResult.insertId;

        // Add Filter Value: Insert filter value into the filter_values table
        const insertFilterValueQuery = 'INSERT INTO filter_values (FILTER_ID, FILTER_VALUE) VALUES (?, ?)';
        const filterValueResult = await db.query(insertFilterValueQuery, [filterID, filterValue]);
        filterValueID = filterValueResult.insertId;

        // Link Product with Filter: Insert PRODUCT_ID, FILTER_ID, and FILTER_VALUE_ID into the product_filters table
        const linkProductFilterQuery = 'INSERT INTO product_filters (PRODUCT_ID, FILTER_ID, FILTER_VALUE_ID) VALUES (?, ?, ?)';
        await db.query(linkProductFilterQuery, [productId, filterID, filterValueID]);
    }
    console.log(newFilters)
    return { newFilters };
}

async function deleteProductFilter(productId, filterId) {
    try {

        // Check if the product exists
        const productExists = await db.query('SELECT * FROM products WHERE PRODUCT_ID = ?', [productId]); 

        // Check if the filter exists for the product
        const filterExists = await db.query('SELECT * FROM product_filters WHERE PRODUCT_ID = ? AND FILTER_ID = ?', [productId, filterId]);

        // Delete the filter record from the product_filters table
        const deleteFromProductFilters = await db.query('DELETE FROM product_filters WHERE PRODUCT_ID = ? AND FILTER_ID = ?', [productId, filterId]);

        // Delete the record from the filter_values table
        const deleteFromFilterValues = await db.query('DELETE FROM filter_values WHERE FILTER_ID = ?', [filterId]);

        // Delete the record from the filters table
        const deleteFromFilters = await db.query('DELETE FROM filters WHERE FILTER_ID = ?', [filterId]);
        
        const totalAffectedRows = deleteFromProductFilters.affectedRows + deleteFromFilterValues.affectedRows + deleteFromFilters.affectedRows;
        return { productExists,filterExists, totalAffectedRows }

    } catch (error) {
        return(error);
    }
}
module.exports = { processFilters, findDuplicateAndNewFilters, addNewFilters, deleteProductFilter };