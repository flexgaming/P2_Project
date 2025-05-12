export { saveNoteHandler, 
         getNoteHandler, }
import { extractJSON,
         extractTxt,
         reportError,
         pool } from "./server.js";
import { accessTokenLogin } from "./app.js";



//Funtion to sanitize the note content before saving it to the database.
async function saveNoteHandler(req, res) {
    try {
        const body = await extractTxt(req, res); // Extracts the JSON body from the request.
        const userId = accessTokenLogin(req, res); // Get the userId from the access token.

        // Check if the userId is valid.
        // If the userId is not valid, send a 403 Forbidden response.
        if (!userId) {
            res.statusCode = 403; // Forbidden
            res.end('Forbidden\n');
            return;
        }
        // Check if the user is allowed to access the note.
        const access = await checkLock(userId);
        if (!access) {
            res.statusCode = 403; // Forbidden
            res.end('Forbidden\n');
            return;
        } else if (access) {
            res.statusCode = 200; // OK
            //Gets note to see if the save request has changed the content.
            const noteContent = getNote(body.workspaceId);
            if (noteContent === body.noteContent) {
                res.end(); // End the response if the content is the same.
                return;
            }

            lockNote(userId); // Lock the note for editing.
            saveNoteRequest(body); // Save the note content to the database
            res.end(); // End the response
        }
    } catch (err) {
        reportError(res, err);
    }
}

async function saveNoteRequest(body) {
    try {
        //When saveNoteHandler has given permission to save the note and locked it to the current user, we save the note.
        const now = new Date(); // Get the current date and time
        // The pg library prevents SQL injections using the following setup.
        // Currently w.workspace_id = 1 is hardcoded, but it should be changed to the correct note_id.
        const text =
        'UPDATE workspace.workspaces AS w SET note_content = $1, timestamp = $2 WHERE w.workspace_id = $3';
        const values = [body.noteContent, now, body.workspaceId];

        // Try adding the data to the Database and catch any error.
        await pool.query(text, values);
        console.log('Note successfully updated!');
    } catch (err) {
        console.error('Query error', err.stack);
    }
}

async function getNoteHandler(req, res) {
    try {
        const body = await extractJSON(req, res); // Extracts the JSON body from the request
        const userId = accessTokenLogin(req, res); // Get the userId from the access token.

        // Check if the userId is valid.
        // If the userId is not valid, send a 403 Forbidden response.
        if (!userId) {
            res.statusCode = 403; // Forbidden
            res.end('Forbidden\n');
            return;
        }
        const access = await checkLock(userId); // Check if the user is allowed to access the note.
        
        const noteContent = getNote(body.workspaceId); // Get the note content from the database

        res.write(JSON.stringify({access: access, content : noteContent})); // Send the access status as JSON

    } catch (err) {
        reportError(res, err);
    }
}

/** Gets the note content from the database.
 * 
 * @param {*} workspaceId This is the project id of the note.
 * @returns Returns the note content if it exists, otherwise returns an empty string.
 */
async function getNote(workspaceId) {
    try {
        // The pg library prevents SQL injections using the following setup.
        // Currently w.workspace_id = 2 is hardcoded, but it should be changed to the correct note_id.
        const text = 'SELECT note_content FROM workspace.workspaces AS w WHERE w.workspace_id = $1';
        const values = [workspaceId];

        const qres = await pool.query(text, values);
        // Check if the query returned any rows and if the note_content column exists.
        if (qres.rowCount > 0) {
            const noteData = qres.rows[0];
            if (qres.rows[0].note_content !== null) {
                return noteData.note_content; // Return the note content if it exists.
            } else {
                return ''; // Return an empty string if the note content is null.
            }
        }
        // If no rows were returned, return an empty string.
        return ''; // Write an empty string if no content is found.
    } catch (err) {
        console.error('Query error', err.stack);
        return ''; // Write an empty string if no content is found.
    }
}


/**
 *  Locks the note in the database all users except an individual.
 * 
 *  This function is called when the user attempts to edit the note.
 * 
 * @param {*} userId This is the user id of the user who opened the note.
 * @param {*} workspaceId This is the project id of the note.
 * @returns {boolean} Returns true if the lock was set, false otherwise.
 */
async function lockNote(userId, workspaceId) {
    try {
        var now = new Date(); // Get the current date and time
        const text = `
            UPDATE workspace.workspaces 
            SET lock_user_id = $1, lock_timestamp = $2 
            WHERE workspace_id = $3`;
        const values = [userId, now, workspaceId];
        await pool.query(text, values);
    } catch (err) {
        console.error('Query error', err.stack);
    }
}

/**
 * Clears the lock on the note in the database.
 * 
 * This function is called when the user closes the note or when the lock expires.
 * 
 * @param {*} workspace_id This is the id of the workspace.
 * @returns {boolean} Returns true if the lock was cleared, false otherwise.
 */
async function clearLock(workspaceId) {
    try {
        var now = new Date(); // Get the current date and time
        const text = `
            UPDATE workspace.workspaces 
            SET lock_user_id = NULL, lock_timestamp = $1 
            WHERE workspace_id = $2`;
        const values = [now, workspaceId];
        await pool.query(text, values);
    } catch (err) {
        console.error('Query error', err.stack);
    }
}


/**
 * Checks if the user is allowed to edit the note.
 * @param {*} userId  This is the user id of the user who opened the note.
 * @param {*} workspaceId  This is the project id of the note.
 * @returns  {boolean}  Returns true if the user is allowed to edit the note, false otherwise.
 */
async function checkLock(userId, workspaceId) {
    try {
        const now = new Date(); // Get the current date and time
        // The pg library prevents SQL injections using the following setup.
        // Currently w.workspace_id = 2 is hardcoded, but it should be changed to the correct note_id.
        const text = 'SELECT user_block_id, timestamp FROM workspace.workspaces WHERE workspace_id = $1';
        const values = [workspaceId];
        const qres = await pool.query(text, values);
        if (qres.rowCount > 0) {
            const noteData = qres.rows[0];
            // If the note is locked and the lock has expired, clear the lock.
            if (noteData.user_block_id !== null && (now - noteData.timestamp) > 300000) {
                await clearLock();
                noteData.user_block_id = null;
                return true; // Allow access to the note.
            // If the note is not locked, allow access to the note.
            } else if (noteData.user_block_id == null) {
                noteData.user_block_id = null; // Set the user_block_id to null.
                return true; // Allow access to the note.
            // If the note is locked to the current user, allow access to the note.
            } else {
                if (noteData.user_block_id === userId) {
                return true;
                }
            }
        // If there is a non-expired lock by another user, deny access to the note.
        } else {
            return false; 
        }
    } catch (err) {
        console.error('Query error', err.stack);
        return false; // Deny access to the note.
    }
}