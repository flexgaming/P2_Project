/* **************************************************
                    Import & Export
   ************************************************** */

export { startServer, 
         fileResponse, 
         reportError, 
         errorResponse, 
         extractForm, 
         extractJSON, 
         extractTxt, 
         redirect,
         checkUsername, 
         registerUser, 
         loginRequest, 
         pool };
import { processReq } from './router.js';
import { accessTokenLogin } from './app.js';

import http from 'http';
import fs from 'fs';
import path from 'path';
import process, { exit } from 'process';
import { Pool } from 'pg';
import { WebSocketServer } from 'ws';

const hostname = '127.0.0.1'; // Change to '130.225.37.41' on Ubuntu.
const port = 131;

const publicResources = '/node/PublicResources/'; // Change to '../PublicResources/' on Ubuntu.
const rootFileSystem = process.cwd(); // The path to the project (P2_Project).


/* **************************************************
                File & Document Serving
   ************************************************** */

/** Checks that the path is secure, and then adds full path to the PublicResources directory. */
function securePath(userPath) {
    /* Checks if the userPath contains null. */
    if (userPath.indexOf('\0') !== -1) {
        return undefined;
    }

    /* Removes chains of '../', '..\' or '..'.
    Afterwards it adds the path to the PublicResources folder. */
    userPath = path.normalize(userPath).replace(/^(\.\.(\/|\\|$))+/, '');
    userPath = publicResources + userPath;

    /* Joins the path with the rootFileSystem, giving the entire path to the file. */
    let p = path.join(rootFileSystem, path.normalize(userPath));

    return p;
}

/** Send contents as file as response. */
function fileResponse(res, filename) {
    const sPath = securePath(filename);
    console.log('Reading:' + sPath);

    fs.readFile(sPath, (err, data) => {
        if (err) { // File was not found.
            redirect(res, '/');
            /* errorResponse(res, 404, 'No Such Resource'); */
        } else {
            successResponse(res, filename, data);
        }
    })
}

/** Gives error information to res. */
function errorResponse(res, code, reason) {
    res.statusCode = code;
    res.setHeader('Content-Type', 'text/txt');
    res.write(reason);
    res.end('\n');
}

/** If file is found then it gets the file type. */
function successResponse(res, filename, data) {
    res.statusCode = 200;
    res.setHeader('Content-Type', guessMimeType(filename)); // Figure out the file type.
    res.write(data);
    res.end('\n');
}

/** A helper function that converts filename suffix to the corresponding HTTP content type. */
function guessMimeType(fileName) {
    /* Splits the fileName by every '.' and gets the last element with pop(). */
    const fileExtension = fileName.split('.').pop().toLowerCase();
    const ext2Mime = {
        'txt': 'text/txt',
        'html': 'text/html',
        'ico': 'image/ico',
        'js': 'text/javascript',
        'json': 'application/json',
        'css': 'text/css',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'wav': 'audio/wav',
        'mp3': 'audio/mpeg',
        'svg': 'image/svg+xml',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/msword'
    };

    /* Returns the corresponding HTTP content type if in list, else return 'text/plain'. */
    return (ext2Mime[fileExtension] || 'text/plain');
}

/** Creates a promise to return the body of a post. */
function collectPostBody(req, res) {
    /** Reads the request in chunks, and resolves errors. */
    function collectPostBodyExecutor(resolve, reject) {
        let bodyData = [];
        let length = 0;

        req.on('data', (chunk) => { // Puts the read data into bodyData and adds to length.
            bodyData.push(chunk);
            length += chunk.length;

            /* If the amount of data exceeds 10 MB, the connection is terminated. */
            if (length > 10000000) {
                errorResponce(res, 413, 'Message Too Long');
                req.connection.destroy();
                reject(new Error('Message Too Long'));
            }
        }).on('end', () => {
            bodyData = Buffer.concat(bodyData).toString(); // Converts the bodyData back into string format.
            console.log(bodyData);
            resolve(bodyData);
        });
    }

    return new Promise(collectPostBodyExecutor);
}

/** Creates a promise to return the body of a JSON. */
function collectJSONBody(req, res) {
    /** Reads the request in chunks, and resolves errors. */
    function collectJSONBodyExecutor(resolve, reject) {
        let bodyData = [];
        let length = 0;

        req.on('data', (chunk) => { // Puts the read data into bodyData and adds to length.
            bodyData.push(chunk);
            length += chunk.length;

            /* If the amount of data exceeds 10 MB, the connection is terminated. */
            if (length > 10000000) {
                errorResponce(res, 413, 'Message Too Long');
                req.connection.destroy();
                reject(new Error('Message Too Long'));
            }
        }).on('end', () => {
            bodyData = Buffer.concat(bodyData).toString(); // Converts the bodyData back into string format.
            console.log(bodyData);
            resolve(JSON.parse(bodyData));
        });
    }

    return new Promise(collectJSONBodyExecutor);
}

function collectTxtBody(req, res) {
    /** Reads the request in chunks, and resolves errors. */
    function collectTxtBodyExecutor(resolve, reject) {
        let bodyData = [];
        let length = 0;
        req.on('data', (chunk) => { // Puts the read data into bodyData and adds to length.
            bodyData.push(chunk);
            length += chunk.length;

            /* If the amount of data exceeds 10 MB, the connection is terminated. */
            if(length > 10000000) {
                errorResponce(res, 413, 'Message Too Long');
                req.connection.destroy();
                reject(new Error('Message Too Long'));
            }
        }).on('end', () => {
            bodyData = Buffer.concat(bodyData).toString(); // Converts the bodyData back into string format.
            console.log(bodyData);
            resolve(bodyData);
        });
    }

    return new Promise(collectTxtBodyExecutor);
}

/** Extracts the data from a form request. */
function extractForm(req, res) {
    if (isFormEncoded(req.headers['content-type'])) {
        return collectPostBody(req, res).then(body => {
            let data = new URLSearchParams(body); // Parses the data from form encoding.
            return data;
        });
    } else {
        return Promise.reject(new Error('Validation Error')); // Create a rejected promise.
    }
}

/** Extracts the data from a JSON request. */
function extractJSON(req, res) {
    if (isJSONEncoded(req.headers['content-type'])) {
        return collectJSONBody(req, res).then(body => {
            return body;
        });
    } else {
        return Promise.reject(new Error('Validation Error')); // Create a rejected promise.
    }
}

function extractTxt(req, res) {
    if (isTxtEncoded(req.headers['content-type'])) {
        return collectTxtBody(req, res).then(body => {
            return body;
        });
    } else {
        return Promise.reject(new Error('Validation Error')); // Create a rejected promise.
    }
}

/** Get input from Jonas   -   Write definition later */
function isFormEncoded(contentType) {
    //Format 
    //Content-Type: text/html; charset=UTF-8
    let ct = contentType.split(';')[0].trim();
    return (ct === 'application/x-www-form-urlencoded');
    //would be more robust to use the content-type module and contentType.parse(..)
    //Fine for demo purposes
}

/** Same as above */
function isJSONEncoded(contentType) {
    let ct = contentType.split(';')[0].trim();
    return (ct === 'application/json')
}

/** Same as above */
function isTxtEncoded(contentType) {
    let ct = contentType.split(';')[0].trim();
    return (ct === 'text/txt')
}

/** Calls the errorResponse function with correct error code. */
function reportError(res, error) {
    if (error.message === 'Validation Error') {
        return errorResponse(res, 400, error.message);
    }
    if (error.message === 'No Such Resource') {
        return errorResponse(res, 404, error.message);
    }
    else {
        console.log(`Internal Error: ${error}`);
        return errorResponse(res, 500, '');
    }
}

function redirect(res, url) {
    res.writeHead(302, { Location: url });
    res.end();
}


/* **************************************************
            HTTP Server & Request Handling
   ************************************************** */

const server = http.createServer(requestHandler); // Creates the server.

/** The function which the server uses to handle requests. */
function requestHandler(req, res) {
    try {
        processReq(req, res);
    } catch (e) {
        console.log('Internal Error: ' + e);
    }
}

/** Starts the server. */
function startServer() {
    server.listen(port, hostname, () => {
        console.log(`Server running at http://${hostname}:${port}/`);
    })
}



/* **************************************************
            WebSocket Server & Request Handling
   ************************************************** */
  
// WebSocket server instance used to handle WebSocket connections.
const wsServer = new WebSocketServer({ "server": server });

let clients = new Set(); // Use a Set to store connected clients

/** Generates a timestamp for the message - adds 2 hours for local time. */
function generateTimestamp() {
    return new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString();
}

wsServer.on('connection', async (ws) => {
    console.log('Connection: WebSocket connection established!');
    clients.add(ws);

    try {
        const chat_id = await getChat_Id(); // Retrieve the chat_id before using it
        if (chat_id) {
            getMessages(ws); // Fetch messages for when someone opens the chat.
        } else {
            console.error('Unable to fetch messages: chat_id is undefined.');
        }
    } catch (error) {
        console.error('Error fetching chat_id:', error);
    }

    ws.on('message', async (message) => {
        try {
            const parsedMessage = JSON.parse(message); // Parse the incoming message as JSON
            const timestamp = generateTimestamp();     // Generate a timestamp for the message
            // Adds the message to the database
            await addMessage(parsedMessage.sender, parsedMessage.message, timestamp);
            // Sends updated chat to all clients connected.
            broadcastMessage(); 
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    }); 
});

async function broadcastMessage() {
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            await getMessages(client); // Send updated chat history to each client
        }
    }
}
/** Send all messages from chat to client */
function sendChat(ws, res) {
    // Send the chat messages to the WebSocket client
    ws.send(JSON.stringify({ messages: res }));
}

/* **************************************************
            Database Connection and Queries
   ************************************************** */

// There are two ways to connect to the database, either with a pool or a client.
// The pool is used for multiple connections, while the client is used for a single connection.

// Create a client to connect to the database
const pool = new Pool({
    user: 'postgres',
    password: 'SQLvmDBaccess',
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    ssl: false
})

// Connect to the database
pool.connect()
    .then(() => {console.log('Yippeee!!'), console.log('Connected to the database')})
    .catch(err => {
        console.log('Womp womp...'),
        console.error('Connection error', err.stack),
        process.exit(5432)})


// Example query to test the connection
// SELECT NOW() is gets the current time from the database.
pool.query('SELECT NOW()')
    .then(res => { console.log('Current time:', res.rows[0].now); })
    .catch(err => { console.error('Query error', err.stack); });

/** Check if a Username already exists in the Database. Returns true if the username does not exist. */
async function checkUsername(username) {
    // The pg library prevents SQL injections using the following setup.
    const text = 'SELECT user_id FROM project.Users WHERE username = $1';
    const values = [username];

    // Read the amount of rows with given username, and if the row count is 0, then it returns true.
    try {
        const res = await pool.query(text, values);
        return (res.rowCount === 0);
    } catch (err) {
        console.error('Query error', err.stack);
        return false;
    }
}

async function registerUser(username, password) {
    // The pg library prevents SQL injections using the following setup.
    const text = 'INSERT INTO project.Users (username, password) VALUES ($1, $2)';
    const values = [username, password];
    console.log(values);

    // Try adding the data to the Database and catch any error.
    try {
        await pool.query(text, values);
        console.log('Users added successfully!');

        const res = await pool.query('SELECT * FROM project.Users');
        console.log(res.rows);
    } catch (err) {
        console.error('Query error', err.stack);
    }
}

async function loginRequest(username, password) {
    // The pg library prevents SQL injections using the following setup.
    const text = 'SELECT user_id, password FROM project.Users WHERE username = $1';
    const values = [username];

    try {
        const res = await pool.query(text, values);
        if (res.rowCount > 0 && res.rows[0].password === password) {
            return res.rows[0].user_id;
        }
        return null;
    } catch (err) {
        console.error('Query error', err.stack);
        return null;
    }
}

async function getUserIdByUsername(username) {
    // The pg library prevents SQL injections using the following setup.
    const text = 'SELECT user_id FROM project.Users WHERE username = $1';
    const values = [username];

    try {
        const res = await pool.query(text, values);

        if (res.rowCount === 0) {
            console.error(`User not found for username: ${username}`);
            return null;
        }

        return res.rows[0].user_id;
    } catch (err) {
        console.error('Error fetching user_id:', err.stack);
        return null;
    }
}

async function getChat_Id() {
    // The pg library prevents SQL injections using the following setup.
    const text = 'SELECT chat_id FROM chat.Chats LIMIT 1';

    try {
        const res = await pool.query(text);

        if (res.rowCount === 0) {
            console.error('No chats found in the project.Chats table.');
            return null;
        }

        return res.rows[0].chat_id;
    } catch (err) {
        console.error('Query erorr', err.stack);
        return null;
    }

}

async function addMessage(username, text, timestamp) {    
    try {
        // Retrieve the chat_id.
        const chat_id = await getChat_Id();
        if (!chat_id) {
            throw new Error('Could not find chat_id');
        }

        // Retrieve the user_id based on the username.
        const user_id = await getUserIdByUsername(username);
        if (!user_id) {
            throw new Error('Could not find user');
        }
        
        const query = 'INSERT INTO chat.Messages (chat_id, user_id, text, timestamp) VALUES ($1, $2, $3, $4)';
        const values = [chat_id, user_id, text, timestamp];
    
        await pool.query(query, values);

        } catch (err) {
    console.error('Query error', err.stack);
    }
}
    
async function getMessages(ws) {
    try {
        // Retrieve the chat_id.
        const chat_id = await getChat_Id();
        if (!chat_id) {
            throw new Error('Could not find chat_id');
        }
        // Retrieves all messages for a specific chat_id, joining project.Users to get usernames instead of user_id.
        // The pg library prevents SQL injections using the following setup.
        const query ='SELECT m.text, m.timestamp, u.username FROM chat.Messages m JOIN project.Users u ON m.user_id = u.user_id WHERE m.chat_id = $1 ORDER BY m.timestamp ASC';
        const values = [chat_id];
    
        const res = await pool.query(query, values);
        // Send all messages in chat to client.
        sendChat(ws, res.rows);
    } catch (err) { 
        console.error('Error fetching messages:', err.stack);
    }
}



