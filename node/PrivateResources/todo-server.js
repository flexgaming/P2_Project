// Import necessary modules and functions
import { extractJSON, 
         extractTxt, 
         reportError,
         pool } from './server.js';
import { sendJSON } from './app.js';
export { getTodosServer, 
         addTodoServer, 
         deleteTodoServer, 
         updateTodoServer, 
         swapPosTodosServer };

// Database functions for ToDo operations
async function fetchTodosDB(workspace_id) {
    const text = 'SELECT * FROM workspace.todo_elements WHERE Workspace_ID = $1 ORDER BY position ASC';
    const values = [workspace_id];
    console.log(text);
    try {
        const res = await pool.query(text, values);
        return res.rows;
    } catch (err) {
        console.error('Query error', err.stack);
        return null;
    }
}

async function addTodoDB(workspace_id) {
    const text = 'INSERT INTO workspace.todo_elements (workspace_id, text, checked) VALUES ($1, $2, $3) RETURNING todo_element_id';
    const values = [workspace_id, '', false];
    try {
        const res = await pool.query(text, values);
        return res.rows[0].todo_element_id; // Return the ID of the newly created ToDo item
    } catch (err) {
        console.error('Query error', err.stack);
        throw err;
    }
}

async function deleteTodoDB(todo_id) {
    const text = 'DELETE FROM workspace.todo_elements WHERE todo_element_id = $1';
    const values = [todo_id];
    try {
        await pool.query(text, values);
    } catch (err) {
        console.error('Query error', err.stack);
        throw err;
    }
}

async function updateTodoDB(todo_id, content, checked) {
    const text = 'UPDATE workspace.todo_elements SET text = $1, checked = $2 WHERE todo_element_id = $3';
    const values = [content, checked, todo_id];
    try {
        await pool.query(text, values);
    } catch (err) {
        console.error('Query error', err.stack);
        throw err;
    }
}

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
        await pool.query(text, values);
    } catch (err) {
        console.error('Query error', err.stack);
        throw err;
    }
}

// Server-side handlers for ToDo operations
async function getTodosServer(req, res) {
    try {
        const body = await extractTxt(req, res); // Extracts the JSON body from the request
        const todos = await fetchTodosDB(body); // Fetches the todos from the database
        sendJSON(res, todos); // Sends the todos back to the client as JSON
    } catch (err) {
        console.log(err); // Logs the error to the console
        reportError(res, err); // Reports the error to the client
    }
}

async function addTodoServer(req, res) {
    try {
        const body = await extractJSON(req, res);
        const todoId = await addTodoDB(body.workspace_id);
        sendJSON(res, { todo_id: todoId });
    } catch (err) {
        console.log(err);
        reportError(res, err);
    }
}

async function deleteTodoServer(req, res) {
    try {
        const body = await extractJSON(req, res);
        await deleteTodoDB(body.todo_id);
        res.end('ToDo item deleted successfully!');
    } catch (err) {
        console.log(err);
        reportError(res, err);
    }
}

async function updateTodoServer(req, res) {
    try {
        const body = await extractJSON(req, res);
        await updateTodoDB(body.todo_id, body.content, body.checked);
        res.end('ToDo item updated successfully!');
    } catch (err) {
        console.log(err);
        reportError(res, err);
    }
}

async function swapPosTodosServer(req, res) {
    try {
        const body = await extractJSON(req, res);
        await swapPosTodosDB(body.todo_id1, body.todo_id2);
        res.end('ToDo items swapped successfully!');
    } catch (err) {
        console.log(err);
        reportError(res, err);
    }
}