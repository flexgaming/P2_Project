// Import necessary modules and functions
import { extractJSON, extractTxt, reportError, pool } from './server.js'; // Utility functions and database connection pool
import { sendJSON } from './app.js'; // Function to send JSON responses

export {
        fetchWorkspacesServer,
        fetchSingleWorkspaceServer,
        addWorkspaceServer,
        deleteWorkspaceServer,
        updateWorkspaceServer
};

// Database functions for Workspace operations

// Fetch all Workspace ID's for a specific Project ID from the database
async function fetchWorkspaceIdByProjectIdDB(project_id) {
    const text = `SELECT Workspace_ID, Name, Type, Root_Path, Note_Content, User_Block_ID, Timestamp
                  FROM workspace.Workspaces
                  WHERE Project_ID = $1`;
    const values = [project_id];
    try {
        const res = await pool.query(text, values);
        return res.rows; // Return all workspace details
    } catch (err) {
        console.error('Query error', err.stack);
        throw err;
    }
}

// Fetch a specific Workspace by its ID from the database
async function fetchWorkspaceByIdDB(workspace_id) {
    const text = `SELECT * 
                  FROM workspace.Workspaces 
                  WHERE Workspace_ID = $1`;
    const values = [workspace_id]; // Parameterized query to prevent SQL injection
    try {
        const res = await pool.query(text, values); // Execute the query
        return res.rows[0]; // Return the first row (since Workspace_ID is unique)
    } catch (err) {
        console.error('Query error', err.stack); // Log the error
        throw err; // Rethrow the error for further handling
    }
}

// Add a new Workspace to the database and return the entire workspace element
async function addWorkspaceDB(project_id, type, name, root_path = null, note_content = null, user_block_id = null) {
    const insertText = `INSERT INTO workspace.Workspaces (Project_ID, Type, Name, Root_Path, Note_Content, User_Block_ID)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        RETURNING Workspace_ID, Name, Type, Root_Path, Note_Content, User_Block_ID, Timestamp`;
    const insertValues = [project_id, type, name, root_path, note_content, user_block_id];
    try {
        const res = await pool.query(insertText, insertValues);
        return res.rows[0]; // Return the full workspace details
    } catch (err) {
        console.error('Query error while adding workspace:', err.stack);
        throw err;
    }
}

// Delete a Workspace from the database
async function deleteWorkspaceDB(workspace_id) {
    const text = `DELETE FROM workspace.Workspaces
                  WHERE Workspace_ID = $1`;
    const values = [workspace_id]; // Parameterized query value
    try {
        await pool.query(text, values); // Execute the query
    } catch (err) {
        console.error('Query error while deleting workspace:', err.stack); // Log the error
        throw err; // Rethrow the error for further handling
    }
}

// Update a Workspace in the database
async function updateWorkspaceDB(workspace_id, name, type, root_path = null, note_content = null, user_block_id = null) {
    const text = `UPDATE workspace.Workspaces
                  SET Name = $1, Type = $2, Root_Path = $3, Note_Content = $4, User_Block_ID = $5
                  WHERE Workspace_ID = $6`;
    const values = [name, type, root_path, note_content, user_block_id, workspace_id];
    try {
        await pool.query(text, values); // Execute the query
    } catch (err) {
        console.error('Query error while updating workspace:', err.stack); // Log the error
        throw err; // Rethrow the error for further handling
    }
}

// Server-side handlers for Workspace operations

// Handle fetching workpsace items for a specific workspace
async function fetchWorkspacesServer(req, res) {
    try {
        const body = await extractTxt(req, res); // Extract workspace ID from the request
        const workspaces = await fetchWorkspaceIdByProjectIdDB(body); // Fetch workspaces from the database
        sendJSON(res, workspaces); // Send the fetched workspaces as a JSON response
    } catch (err) {
        console.error(err);
        reportError(res, err);
    }
}

// Handle fetching workpsace items for a specific workspace
async function fetchSingleWorkspaceServer(req, res) {
    try {
        const body = await extractTxt(req, res); // Extract the workspace ID from the request
        const workspaces = await fetchWorkspaceByIdDB(body); // Fetch the workpsace items from the database
        sendJSON(res, workspaces); // Send the fetched workpsace items as a JSON response
    } catch (err) {
        console.log(err); // Log the error
        reportError(res, err); // Send an error response to the client
    }
}

// Handle adding a new Workspace
async function addWorkspaceServer(req, res) {
    try {
        const body = await extractJSON(req, res); // Extract the request body as JSON
        const newWorkspace = await addWorkspaceDB(body.project_id, body.type, body.name); // Add the new workspace
        sendJSON(res, newWorkspace); // Send the new workspace as a JSON response
    } catch (err) {
        console.error(err);
        reportError(res, err);
    }
}

// Handle deleting a Workspace
async function deleteWorkspaceServer(req, res) {
    try {
        const body = await extractJSON(req, res); // Extract the request body as JSON
        await deleteWorkspaceDB(body.workspace_id); // Delete the workspace from the database
        res.end('Workspace deleted successfully!');
    } catch (err) {
        console.error('Error deleting workspace:', err);
        reportError(res, err); // Send an error response to the client
    }
}

// Handle updating a Workspace
async function updateWorkspaceServer(req, res) {
    try {
        const body = await extractJSON(req, res); // Extract the request body as JSON
        await updateWorkspaceDB(body.workspace_id, body.name, body.type); // Update the workspace in the database
        res.end('Workspace updated successfully!');
    } catch (err) {
        console.error('Error updating workspace:', err);
        reportError(res, err); // Send an error response to the client
    }
}
