export { saveNoteHandler, 
         getNote,
         lockNote,
         clearLock }
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
        const access = await checkLock(userId); // Check if the user is allowed to access the note.
        
        if (!access) {
            res.statusCode = 403; // Forbidden
            res.end('Forbidden\n');
            return;
        } else {
            res.statusCode = 200; // OK
            lockNote(userId); // Lock the note for editing.
            saveNoteRequest(body); // Save the note content to the database
            res.end(); // End the response
        }
    } catch (err) {
        reportError(res, err);
    }
}

async function saveNoteRequest(content) {
    try {
        //When saveNoteHandler has given permission to save the note, we lock the note to the users ID.
        const userId = accessTokenLogin(req, res); // Get the userId from the access token.
        lockNote(userId); // Lock the note for editing.

        const now = new Date(); // Get the current date and time
        // The pg library prevents SQL injections using the following setup.
        // Currently w.workspace_id = 1 is hardcoded, but it should be changed to the correct note_id.
        const text =
        'UPDATE workspace.workspaces AS w SET note_content = $1, timestamp = $2 WHERE w.workspace_id = 2';
        const values = [content, now];

        
        

        // Try adding the data to the Database and catch any error.
        await pool.query(text, values);
        console.log('Note successfully updated!');
    } catch (err) {
        console.error('Query error', err.stack);
    }
}

async function getNote(req, res) {
    try {
        // The pg library prevents SQL injections using the following setup.
        // Currently w.workspace_id = 2 is hardcoded, but it should be changed to the correct note_id.
        const text = 'SELECT note_content, user_block_id, timestamp FROM workspace.workspaces AS w WHERE w.workspace_id = 2';
        const values = [];
        const userId = accessTokenLogin(req, res); // Get the userId from the access token.
        if (!userId) {
            res.statusCode = 401; // Unauthorized
            res.end('Unauthorized\n');
            return;
        }
        
        var access = false; // This variable is used to check if the user is allowed to access the note.

        const qres = await pool.query(text, values);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/txt');

        // Check if the query returned any rows and if the note_content column exists.
        if (qres.rowCount > 0) {
            const noteData = qres.rows[0];
            access = await checkLock(userId); // Check if the user is allowed to access the note.
            
            if (qres.rows[0].note_content !== null) {
                res.write(JSON.stringify({noteData: noteData})); // Send the note data as JSON
            } else {
                res.write(JSON.stringify({noteData: ''})); // Write an empty string if no content is found
            }
            res.write(JSON.stringify({access: access})); // Send the access status as JSON
        }

        res.end('\n');
    } catch (err) {
        console.error('Query error', err.stack);
        res.statusCode = 500;
        res.end('Internal Server Error\n');
    }
}


/**
 *  Locks the note in the database all users except an individual.
 * 
 *  This function is called when the user opens the note.
 * 
 * @param {*} userId This is the user id of the user who opened the note.
 */
async function lockNote(req, res) {
    try {
        const body = await extractJSON(req, res); // Extracts the JSON body from the request
        var now = new Date(); // Get the current date and time
        const text = `
            UPDATE workspace.workspaces 
            SET lock_user_id = $1, lock_timestamp = $2 
            WHERE workspace_id = 2`;
        const values = [body.userId, now];
        await pool.query(text, values);
    } catch (err) {
        console.error('Query error', err.stack);
    }
}

/**
 * Clears the lock on the note in the database.
 * 
 * This function is called when the user closes the note or when the lock expires.
 */
async function clearLock(req, res) {
    try {
        var now = new Date(); // Get the current date and time
        const text = `
            UPDATE workspace.workspaces 
            SET lock_user_id = NULL, lock_timestamp = $1 
            WHERE workspace_id = 2`;
        const values = [now];
        await pool.query(text, values);
    } catch (err) {
        console.error('Query error', err.stack);
    }
}


/**
 * Checks if the user is allowed to edit the note.
 * @param {*} userId  This is the user id of the user who opened the note.
 * @param {*} projectId  This is the project id of the note.
 * @returns  {boolean}  Returns true if the user is allowed to edit the note, false otherwise.
 */
async function checkLock(req, res) {
    try {
        const body = await extractJSON(req, res); // Extracts the JSON body from the request
        const now = new Date(); // Get the current date and time
        // The pg library prevents SQL injections using the following setup.
        // Currently w.workspace_id = 2 is hardcoded, but it should be changed to the correct note_id.
        const text = 'SELECT user_block_id, timestamp FROM workspace.workspaces WHERE workspace_id = 2';
        const values = [];
        const qres = await pool.query(text, values);
        if (qres.rowCount > 0) {
            const noteData = qres.rows[0];
            if (noteData.user_block_id !== null && (now - noteData.timestamp) > 300000) {
                // If the note is locked and the lock has expired, clear the lock.
                await clearLock();
                noteData.user_block_id = null;
                return true; // Allow access to the note.
            } else if (noteData.user_block_id == null) {
                // If the note is not locked, allow access to the note.
                noteData.user_block_id = null; // Set the user_block_id to null.
                return true; // Allow access to the note.
            } else {
                // If the note is locked and the lock has not expired, deny access to the note.
                if (noteData.user_block_id === body.userId) {
                return false;
                }
            }
        } else {
            return false; // The user is not allowed to edit the note.
        }

         

    } catch (err) {
        console.error('Query error', err.stack);
    }
}