export { saveNoteHandler, 
         getNoteHandler, }
import { extractJSON,
         reportError,
         pool } from "./server.js";
import { accessTokenLogin } from "./app.js";



/** This function handles the saving of notes to the database.
 *  
 *  It is called every 5 seconds when user is editing, when clicking save, or when unfocusing textarea.
 * 
 * @param {*} req  This is the request object containing the note content and workspace id.
 * @param {*} res  This is the response object used to send the response back to the client.
 * @returns  {void}  This function does not return anything.
 */
async function saveNoteHandler(req, res) {
    try {
        const body = await extractJSON(req, res); // Extracts the JSON body from the request.
        const userId = accessTokenLogin(req, res); // Get the userId from the access token.

        // Check if the userId is valid.
        // If the userId is not valid, send a 403 Forbidden response.
        if (!userId) {
            res.statusCode = 403; // Forbidden
            res.end('Forbidden\n');
            return;
        }

        // Check if the user is allowed to access the note.
        const access = await checkLock(userId, body.workspaceId);
        if (!access) {
            res.statusCode = 403; // Forbidden
            res.end('Forbidden\n');
            return;
        }

        //Gets note to see if the save request has changed the content.
        const noteContent = getNote(body.workspaceId);
        
        if (noteContent === body.noteContent) {
            res.end(); // End the response if the content is the same.
            res.statusCode = 200; // OK
            return;
        }

        /** If the note content is different, lock the note to the current user.
         *  This prevents other users from editing the note while the current user is editing it.
         *  *  The lock is set to expire after 30 seconds of inactivity.
         *  *  If the lock is not set, set the lock to the current user.
         *  *  If the lock is set, check if the lock is set to the current user.
        */ 
       //console.log('Locking note for user ' + userId + '...');
        if (await lockNote(userId, body.workspaceId)) { 
            // --**-- Debugging message to see if was locked successfully. --**--
            //console.log('Note locked for user ' + userId + '!');
        } else {
            res.statusCode = 500; // Internal Server Error
            res.end('Error locking note\n'); // End the response with an error message
            return;
        }

        // Save the note content to the database.
        // If the saveNoteRequest function returns true, the note was saved successfully.
        if (await saveNoteRequest(body)) { // Save the note content to the database)
            res.statusCode = 200; // OK
            res.end(); // End the response
            return;
        }
        else {
            res.statusCode = 500; // Internal Server Error
            res.end('Error saving note\n'); // End the response with an error message
            return;
        }
        
    } catch (err) {
        reportError(res, err);
    }
}

/** Saves the note content to the database.
 * 
 * @param {*} body This is the body of the request containing the note content and workspace id.
 * @returns {boolean} Returns true if the note was saved successfully, false otherwise.
 */
async function saveNoteRequest(body) {
    try {
        //When saveNoteHandler has given permission to save the note and locked it to the current user, we save the note.
        const now = new Date(); // Get the current date and time
        // The pg library prevents SQL injections using the following setup.
        const text =
        'UPDATE workspace.workspaces AS w SET note_content = $1, timestamp = $2 WHERE w.workspace_id = $3';
        const values = [body.noteContent, now, body.workspaceId];

        // Try adding the data to the Database and catch any error.
        await pool.query(text, values);
        //console.log('Note successfully updated!');
        return true; // Return true if the note was saved successfully.
    } catch (err) {
        console.error('Query error', err.stack);
        return false; // Return false if there was an error saving the note.
    }
}

/** Request handler for getting the note content from the database.
 *  
 * This function is called every 5 seconds when user is NOT editing or when focusing the textarea.
 * 
 * @param {*} req This is the request object containing the note content and workspace id.
 * @param {*} res This is the response object used to send the response back to the client.
 * @returns {void} This function does not return anything.
 */
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

        const access = await checkLock(userId, body.workspaceId); // Check if the user is allowed to access the note.
        if (access){
            clearLock(body.workspaceId); // Clear the lock on the note if the user is allowed to access it.
        }
        const noteContent = await getNote(body.workspaceId); // Get the note content from the database

        res.statusCode = 200; // OK
        res.setHeader('Content-Type', 'application/json'); // Set the response header to JSON
        res.write(JSON.stringify({access: access, content : noteContent})); // Send the access status as JSON
        res.end(); // End the response
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
            SET user_block_id = $1, timestamp = $2 
            WHERE workspace_id = $3`;
        const values = [userId, now, workspaceId];
        await pool.query(text, values);
        return true; // Return true if the lock was set successfully.
    } catch (err) {
        console.error('Query error', err.stack);
        return false; // Return false if there was an error setting the lock.
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
        const text = `
            UPDATE workspace.workspaces 
            SET user_block_id = NULL, timestamp = NULL 
            WHERE workspace_id = $1`;
        const values = [workspaceId];
        await pool.query(text, values);
        // --**-- Debugging message to see if the lock was cleared successfully. --**--
        //console.log('Note unlocked!');
        return true; // Return true if the lock was cleared successfully.
    } catch (err) {
        console.error('Query error', err.stack);
        return false; // Return false if there was an error clearing the lock.
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
        const text = `
            SELECT user_block_id, timestamp
            FROM workspace.workspaces
            WHERE workspace_id = $1`;
        const values = [workspaceId];
        const qres = await pool.query(text, values);

        if (qres.rowCount > 0) {
            const noteData = qres.rows[0];
            // --**-- Debugging message to see if the lock is expired. --**--
            /**
             *  console.log('Note data:', noteData);
             *  console.log('timestamp:', noteData.timestamp);
             *  console.log('now:', now);
             *  console.log('time since lock:', (now - noteData.timestamp) / 1000, 'seconds');
             */
            // If the note is locked and the lock has expired, clear the lock.
            if (noteData.user_block_id !== null && (now - noteData.timestamp) > 30000) {

                // --**-- Debugging message to see if the lock is expired. --**--
                //console.log('Lock expired, clearing lock!');
                if (await clearLock()) {
                    //console.log('Lock cleared!');
                } else {
                    console.error('Error clearing lock');
                }
                noteData.user_block_id = null;
                return true; // Allow access to the note.
                
            // If the note is not locked, allow access to the note.
            } else if (noteData.user_block_id === null) {
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