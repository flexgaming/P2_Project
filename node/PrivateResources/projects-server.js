// Import necessary modules and functions
import { extractJSON, extractTxt, reportError, pool } from './server.js'; // Utility functions and database connection pool
import { sendJSON } from './app.js'; // Function to send JSON responses

export {
        fetchWorkspacesServer,
        addWorkspaceServer,
        deleteWorkspaceServer,
        updateWorkspaceServer
};
