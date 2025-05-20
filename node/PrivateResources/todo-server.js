/* **************************************************
                    Import & Export
   ************************************************** */

export { getTodosServer, 
         addTodoServer, 
         deleteTodoServer, 
         updateTodoServer, 
         swapPosTodosServer,
         getCountServer };

import { extractJSON,
         errorResponse,
         pool } from './server.js';

import { sendJSON } from './app.js';


/* **************************************************
                    Database Queries
   ************************************************** */

/**
 * Fetch all ToDo items for a specific workspace from the database.
 * 
 * @param {number} workspace_id - The ID of the workspace.
 * @returns {Promise<Object[]>} - A promise that resolves with an array of ToDo items.
 */
async function fetchTodosDB(workspace_id) {
    const text = `SELECT * FROM workspace.todo_elements 
                  WHERE Workspace_ID = $1 
                  ORDER BY position ASC`;
    const values = [workspace_id];
    console.log(text); // Debugging: Log the query
    try {
        const res = await pool.query(text, values); // Execute the query
        return res.rows; // Return the fetched rows
    } catch (err) {
        console.error('Query error', err.stack); // Log the error
        return null; // Return null in case of an error
    }
}

/**
 * Add a new ToDo item to the database.
 * 
 * @param {number} workspace_id - The ID of the workspace to which the ToDo item belongs.
 * @returns {Promise<number>} - A promise that resolves with the ID of the newly created ToDo item.
 */
async function addTodoDB(workspace_id) {
    const text = `INSERT INTO workspace.todo_elements (workspace_id, text, checked) 
                  VALUES ($1, $2, $3) 
                  RETURNING todo_element_id`;
    const values = [workspace_id, '', false]; // Default values for a new ToDo item
    try {
        const res = await pool.query(text, values); // Execute the query
        return res.rows[0].todo_element_id; // Return the ID of the newly created ToDo item
    } catch (err) {
        console.error('Query error', err.stack); // Log the error
        throw err; // Rethrow the error for further handling
    }
}

/**
 * Delete a ToDo item from the database.
 * 
 * @param {number} todo_id - The ID of the ToDo item to delete.
 * @returns {Promise<void>} - A promise that resolves when the ToDo item is deleted.
 */
async function deleteTodoDB(todo_id) {
    const text = `DELETE FROM workspace.todo_elements 
                  WHERE todo_element_id = $1`;
    const values = [todo_id];
    try {
        await pool.query(text, values); // Execute the query
    } catch (err) {
        console.error('Query error', err.stack); // Log the error
        throw err; // Rethrow the error for further handling
    }
}

/**
 * Update a ToDo item in the database.
 * 
 * @param {number} todo_id - The ID of the ToDo item to update.
 * @param {string} content - The updated content of the ToDo item.
 * @param {boolean} checked - The updated checked status of the ToDo item.
 * @returns {Promise<void>} - A promise that resolves when the ToDo item is updated.
 */
async function updateTodoDB(todo_id, content, checked) {
    const text = `UPDATE workspace.todo_elements 
                  SET text = $1, checked = $2 
                  WHERE todo_element_id = $3`;
    const values = [content, checked, todo_id];
    try {
        await pool.query(text, values); // Execute the query
    } catch (err) {
        console.error('Query error', err.stack); // Log the error
        throw err; // Rethrow the error for further handling
    }
}

/**
 * Swap the positions of two ToDo items in the database.
 * 
 * @param {number} todo_id1 - The ID of the first ToDo item.
 * @param {number} todo_id2 - The ID of the second ToDo item.
 * @returns {Promise<void>} - A promise that resolves when the positions are swapped.
 */
async function swapPosTodosDB(todo_id1, todo_id2) {
    const text = `
        WITH positions AS (
            SELECT
                todo_element_id,
                position
            FROM workspace.todo_elements
            WHERE todo_element_id IN ($1, $2)
        )
        UPDATE workspace.todo_elements
        SET position = CASE
            WHEN todo_element_id = $1 THEN (SELECT position FROM positions WHERE todo_element_id = $2)
            WHEN todo_element_id = $2 THEN (SELECT position FROM positions WHERE todo_element_id = $1)
        END
        WHERE todo_element_id IN ($1, $2)
    `;
    const values = [todo_id1, todo_id2];
    try {
        await pool.query(text, values); // Execute the query
    } catch (err) {
        console.error('Query error', err.stack); // Log the error
        throw err; // Rethrow the error for further handling
    }
}

/**
 * Fetch the count of ToDo items as well as the checked count for a specific workspace.
 * 
 * @param {number} workspace_id - The ID of the workspace.
 * @returns {Promise<Object>} - A promise that resolves with the total and checked counts.
 */
async function getCountDB(workspace_id) {
    const text = `
        SELECT 
            COUNT(*) AS total_count,
            SUM(CASE WHEN checked THEN 1 ELSE 0 END) AS checked_count
        FROM 
            workspace.todo_elements
        WHERE 
            workspace_id = $1;
    `;
    const values = [workspace_id];
    try {
        const res = await pool.query(text, values); // Execute the query
        return res.rows[0]; // Return the result (total_count and checked_count)
    } catch (err) {
        console.error('Query error', err.stack); // Log the error
        throw err; // Rethrow the error for further handling
    }
}


/* **************************************************
                Server-Side To-Do
   ************************************************** */

/**
 * Handle fetching ToDo items for a specific workspace.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} - A promise that resolves when the ToDo items are fetched and sent as a response.
 */
async function getTodosServer(req, res) {
    try {
        const body = await extractJSON(req, res); // Extract JSON from the request
        const { workspace_id } = body; // Extract workspace_id from the JSON payload
        console.log('Workspace ID:', workspace_id); // Debugging: Log the workspace ID
        const todos = await fetchTodosDB(workspace_id); // Fetch the ToDo items from the database
        sendJSON(res, todos); // Send the fetched ToDo items as a JSON response
    } catch (err) {
        console.log(err); // Log the error
        errorResponse(res, err.code, err); // Send an error response to the client
    }
}

/**
 * Handle adding a new ToDo item.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} - A promise that resolves when the ToDo item is added.
 */
async function addTodoServer(req, res) {
    try {
        const { workspace_id } = await extractJSON(req, res); // Extract JSON payload
        if (!workspace_id) {
            throw new Error('Workspace ID is required.');
        }

        const newTodo = await addTodoDB(workspace_id); // Add the ToDo item to the database
        sendJSON(res, newTodo); // Send the new ToDo item as a JSON response
    } catch (err) {
        console.error('Error adding ToDo item:', err);
        errorResponse(res, err.code, err); // Send an error response to the client
    }
}

/**
 * Handle deleting a ToDo item.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} - A promise that resolves when the ToDo item is deleted.
 */
async function deleteTodoServer(req, res) {
    try {
        const { todo_id } = await extractJSON(req, res);
        if (!todo_id) {
            throw new Error('ToDo ID is required.');
        }
        await deleteTodoDB(todo_id); // Delete the specified ToDo item from the database
        res.end('ToDo item deleted successfully!'); // Send a success response
    } catch (err) {
        console.log(err); // Log the error
        errorResponse(res, err.code, err); // Send an error response to the client
    }
}

/**
 * Handle updating a ToDo item.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} - A promise that resolves when the ToDo item is updated.
 */
async function updateTodoServer(req, res) {
    try {
        const { todo_id, content, checked } = await extractJSON(req, res);
        if (!todo_id || content === undefined || checked === undefined) {
            throw new Error('ToDo ID, content, and checked status are required.');
        }
        await updateTodoDB(todo_id, content, checked); // Update the specified ToDo item in the database
        res.end('ToDo item updated successfully!'); // Send a success response
    } catch (err) {
        console.log(err); // Log the error
        errorResponse(res, err.code, err); // Send an error response to the client
    }
}

/**
 * Handle swapping the positions of two ToDo items.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} - A promise that resolves when the positions are swapped.
 */
async function swapPosTodosServer(req, res) {
    try {
        const { todo_id1, todo_id2 } = await extractJSON(req, res);
        if (!todo_id1 || !todo_id2) {
            throw new Error('Both ToDo IDs are required.');
        }
        await swapPosTodosDB(todo_id1, todo_id2); // Swap the positions of the specified ToDo items in the database
        res.end('ToDo items swapped successfully!'); // Send a success response
    } catch (err) {
        console.log(err); // Log the error
        errorResponse(res, err.code, err); // Send an error response to the client
    }
}

/**
 * Handle fetching the count of ToDo items and checked items for a specific workspace.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} - A promise that resolves when the counts are fetched and sent as a response.
 */
async function getCountServer(req, res) {
    try {
        const body = await extractJSON(req, res); // Extract JSON from the request
        const { workspace_id } = body; // Extract workspace_id from the JSON payload
        if (!workspace_id) {
            throw new Error('Workspace ID is required.');
        }
        
        const counts = await getCountDB(workspace_id); // Fetch the counts from the database
        console.log('Counts:', counts); // Debugging: Log the counts
        sendJSON(res, counts); // Send the counts as a JSON response
    } catch (err) {
        console.error('Error fetching counts:', err); // Log the error
        errorResponse(res, err.code, err); // Send an error response to the client
    }
}
