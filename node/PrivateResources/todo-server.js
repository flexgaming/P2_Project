// Import necessary modules and functions
import { extractJSON, extractTxt, reportError, pool } from './server.js'; // Utility functions and database connection pool
import { sendJSON } from './app.js'; // Function to send JSON responses

// Export server-side handlers for ToDo operations
export { 
    getTodosServer, 
    addTodoServer, 
    deleteTodoServer, 
    updateTodoServer, 
    swapPosTodosServer 
};

// Database functions for ToDo operations

// Fetch all ToDo items for a specific workspace from the database
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

// Add a new ToDo item to the database
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

// Delete a ToDo item from the database
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

// Update a ToDo item in the database
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

// Swap the positions of two ToDo items in the database
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

// Server-side handlers for ToDo operations

// Handle fetching ToDo items for a specific workspace
async function getTodosServer(req, res) {
    try {
        const body = await extractTxt(req, res); // Extract the workspace ID from the request
        const todos = await fetchTodosDB(body); // Fetch the ToDo items from the database
        sendJSON(res, todos); // Send the fetched ToDo items as a JSON response
    } catch (err) {
        console.log(err); // Log the error
        reportError(res, err); // Send an error response to the client
    }
}

// Handle adding a new ToDo item
async function addTodoServer(req, res) {
    try {
        const body = await extractJSON(req, res); // Extract the request body as JSON
        const todoId = await addTodoDB(body.workspace_id); // Add the new ToDo item to the database
        sendJSON(res, { todo_id: todoId }); // Send the ID of the newly created ToDo item as a JSON response
    } catch (err) {
        console.log(err); // Log the error
        reportError(res, err); // Send an error response to the client
    }
}

// Handle deleting a ToDo item
async function deleteTodoServer(req, res) {
    try {
        const body = await extractJSON(req, res); // Extract the request body as JSON
        await deleteTodoDB(body.todo_id); // Delete the specified ToDo item from the database
        res.end('ToDo item deleted successfully!'); // Send a success response
    } catch (err) {
        console.log(err); // Log the error
        reportError(res, err); // Send an error response to the client
    }
}

// Handle updating a ToDo item
async function updateTodoServer(req, res) {
    try {
        const body = await extractJSON(req, res); // Extract the request body as JSON
        await updateTodoDB(body.todo_id, body.content, body.checked); // Update the specified ToDo item in the database
        res.end('ToDo item updated successfully!'); // Send a success response
    } catch (err) {
        console.log(err); // Log the error
        reportError(res, err); // Send an error response to the client
    }
}

// Handle swapping the positions of two ToDo items
async function swapPosTodosServer(req, res) {
    try {
        const body = await extractJSON(req, res); // Extract the request body as JSON
        await swapPosTodosDB(body.todo_id1, body.todo_id2); // Swap the positions of the specified ToDo items in the database
        res.end('ToDo items swapped successfully!'); // Send a success response
    } catch (err) {
        console.log(err); // Log the error
        reportError(res, err); // Send an error response to the client
    }
}