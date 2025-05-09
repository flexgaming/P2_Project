export { saveNoteHandler, getNote };
import { extractJSON,
         extractTxt,
         reportError,
         pool } from "./server.js";



//Funtion to sanitize the note content before saving it to the database.
async function saveNoteHandler(req, res) {
    try {
        const body = await extractTxt(req, res); // Extracts the JSON body from the request.
        saveNoteRequest(body); // Save the note content to the database
        res.end(); // End the response
    } catch (err) {
        reportError(res, err);
    }
}

async function saveNoteRequest(content) {
    try {
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
        // Currently w.workspace_id = 1 is hardcoded, but it should be changed to the correct note_id.
        const text = 'SELECT note_content, user_block_id FROM workspace.workspaces AS w WHERE w.workspace_id = 2';
        const values = [];

        const qres = await pool.query(text, values);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/txt');

        // Check if the query returned any rows and if the note_content column exists.
        if (qres.rowCount > 0 && qres.rows[0].note_content) {
            res.write(qres.rows[0].note_content); // Ensure the column name matches your database schema
        } else {
            res.write(''); // Write an empty string if no content is found
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
async function lockNote(userId) {
    try {
        var now = new Date(); // Get the current date and time
        const text = `
            UPDATE workspace.workspaces 
            SET lock_user_id = $1, lock_timestamp = $2 
            WHERE workspace_id = 2`;
        const values = [userId, now];
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
async function clearLock() {
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
