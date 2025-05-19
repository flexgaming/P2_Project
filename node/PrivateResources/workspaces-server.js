// Import necessary modules and functions
import { extractJSON, reportError, pool } from './server.js'; // Utility functions and database connection pool
import { sendJSON } from './app.js'; // Function to send JSON responses

export {
    fetchWorkspacesServer,
    addWorkspaceServer,
    deleteWorkspaceServer,
    updateWorkspaceServer
};

// Server-side handlers for Workspace operations

/**
 * Handle fetching workspace items for a specific project.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} - A promise that resolves when the workspaces are fetched and sent as a response.
 */
async function fetchWorkspacesServer(req, res) {
    try {
        const body = await extractJSON(req, res); // Extract JSON from the request
        const { project_id } = body; // Extract project_id from the JSON payload

        const workspaces = await fetchWorkspaceIdByProjectIdDB(project_id); // Pass only the project_id
        sendJSON(res, workspaces); // Send the fetched workspaces as a JSON response
    } catch (err) {
        console.error(err);
        reportError(res, err);
    }
}

/**
 * Handle adding a new workspace.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} - A promise that resolves when the workspace is added and sent as a response.
 */
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

/**
 * Handle deleting a workspace.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} - A promise that resolves when the workspace is deleted.
 */
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

/**
 * Handle updating a workspace.
 * 
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} - A promise that resolves when the workspace is updated.
 */
async function updateWorkspaceServer(req, res) {
    try {
        const body = await extractJSON(req, res); // Extract the request body as JSON
        await updateWorkspaceDB(body.workspace_id, body.name); // Update the workspace in the database
        res.end('Workspace updated successfully!');
    } catch (err) {
        console.error('Error updating workspace:', err);
        reportError(res, err); // Send an error response to the client
    }
}

// Database functions for Workspace operations

/**
 * Fetch all workspace IDs for a specific project ID from the database.
 * 
 * @param {number} project_id - The ID of the project.
 * @returns {Promise<Object[]>} - A promise that resolves with an array of workspace details.
 */
async function fetchWorkspaceIdByProjectIdDB(project_id) {
    if (!project_id) {
        throw new Error('Project ID is required.');
    }
    const text = `SELECT Workspace_ID, Name, Type, Note_Content, User_Block_ID, Timestamp
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

/**
 * Add a new workspace to the database and return the entire workspace element.
 * 
 * @param {number} project_id - The ID of the project to which the workspace belongs.
 * @param {string} type - The type of the workspace (e.g., 'notes', 'files', etc.).
 * @param {string} name - The name of the workspace.
 * @param {string|null} note_content - The note content of the workspace (optional).
 * @returns {Promise<Object>} - A promise that resolves with the full workspace details.
 */
async function addWorkspaceDB(project_id, type, name, note_content = null) {
    // Validate the type value
    const validTypes = ['notes', 'workspaces', 'files', 'videochat', 'whiteboard'];
    if (!validTypes.includes(type)) {
        throw new Error(`Invalid workspace type: ${type}`);
    }
    const insertText = `INSERT INTO workspace.Workspaces (Project_ID, Type, Name, Note_Content)
                        VALUES ($1, $2, $3, $4)
                        RETURNING Workspace_ID, Project_ID, Type, Name, Note_Content`;
    const insertValues = [project_id, type, name, note_content]; // Parameterized query values

    try {
        const res = await pool.query(insertText, insertValues); // Execute the query
        return res.rows[0]; // Return the full workspace details
    } catch (err) {
        console.error('Query error while adding workspace:', err.stack); // Log the error
        throw err; // Rethrow the error for further handling
    }
}

/**
 * Delete a workspace from the database.
 * 
 * @param {number} workspace_id - The ID of the workspace to delete.
 * @returns {Promise<void>} - A promise that resolves when the workspace is deleted.
 */
async function deleteWorkspaceDB(workspace_id) {
    const deleteTodosText = `DELETE FROM workspace.todo_elements
                             WHERE Workspace_ID = $1`;
    const text = `DELETE FROM workspace.Workspaces
                  WHERE Workspace_ID = $1`;
    const values = [workspace_id]; // Parameterized query value
    try {
        await pool.query(deleteTodosText, values); // Delete associated ToDo items first
        await pool.query(text, values); // Execute the query
    } catch (err) {
        console.error('Query error while deleting workspace:', err.stack); // Log the error
        throw err; // Rethrow the error for further handling
    }
}

/**
 * Update a workspace in the database.
 * 
 * @param {number} workspace_id - The ID of the workspace to update.
 * @param {string} name - The new name of the workspace.
 * @returns {Promise<void>} - A promise that resolves when the workspace is updated.
 */
async function updateWorkspaceDB(workspace_id, name) {
    const text = `UPDATE workspace.Workspaces
                  SET Name = $1
                  WHERE Workspace_ID = $2`;
    const values = [name, workspace_id];
    try {
        await pool.query(text, values); // Execute the query
    } catch (err) {
        console.error('Query error while updating workspace:', err.stack); // Log the error
        throw err; // Rethrow the error for further handling
    }
}