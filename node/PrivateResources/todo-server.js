// Import necessary modules and functions
import { extractJSON, reportError, pool } from './server.js'; // Utility functions and database connection pool
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
        const body = await extractJSON(req, res); // Extract JSON from the request
        const { workspace_id } = body; // Extract workspace_id from the JSON payload
        console.log('Workspace ID:', workspace_id); // Debugging: Log the workspace ID
        const todos = await fetchTodosDB(workspace_id); // Fetch the ToDo items from the database
        sendJSON(res, todos); // Send the fetched ToDo items as a JSON response
    } catch (err) {
        console.log(err); // Log the error
        reportError(res, err); // Send an error response to the client
    }
}

// Handle adding a new ToDo item
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
        reportError(res, err); // Send an error response to the client
    }
}

// Handle deleting a ToDo item
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
        reportError(res, err); // Send an error response to the client
    }
}

// Handle updating a ToDo item
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
        reportError(res, err); // Send an error response to the client
    }
}

// Handle swapping the positions of two ToDo items
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
        reportError(res, err); // Send an error response to the client
    }
}