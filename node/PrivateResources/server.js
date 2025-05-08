
/* **************************************************
                    Import & Export
   ************************************************** */

export { startServer, fileResponse, reportError, errorResponse, extractForm, extractJSON, redirect, checkUsername, registerUser, loginRequest, broadcastMessage };
import { processReq } from './router.js';

import http from 'http';
import fs from 'fs';
import path from 'path';
import process, { exit } from 'process';
import { Pool } from 'pg';
import { WebSocketServer } from 'ws';

const hostname = '127.0.0.1'; // Change to '130.225.37.41' on Ubuntu.
const port = 80;

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
            if(length > 10000000) {
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

/** Calls the errorResponse function with correct error code. */
function reportError(res, error) {
    if(error.message === 'Validation Error'){
        return errorResponse(res, 400, error.message);
    }
    if(error.message === 'No Such Resource'){
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
    } catch(e) {
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
const wsServer = new WebSocketServer({ "server": server });

let clients = new Set(); // Use a Set to store connected clients

wsServer.on('connection', (ws) => {
    console.log('WebSocket connection established!');
    clients.add(ws); // Add the new client to the set

    ws.on('message', async (message) => {
        try {
            // Parse the incoming message as JSON
            const parsedMessage = JSON.parse(message);

            // Log the received message
            console.log(`Received message from ${parsedMessage.sender}: ${parsedMessage.message}`);

            const timestamp = new Date().toISOString();

            // Broadcast the structured message to all clients
            await sendMessage(1, parsedMessage.sender, parsedMessage.message, timestamp); // Send the message to the database

            broadcastMessage(JSON.stringify(parsedMessage));
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed!');
        clients.delete(ws); // Remove the client from the set
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

/**
 * Broadcast a message to all connected clients.
 * @param {string} message - The message to broadcast (in JSON format).
 */
function broadcastMessage(message) {
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
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
    try {
        const res = await pool.query(
            'SELECT user_id FROM project.Users WHERE username = $1',
            [username]
        );

        if (res.rowCount === 0) {
            console.error('User not found');
            return null;
        }

        return res.rows[0].user_id;
    } catch (err) {
        console.error('Error fetching user_id:', err.stack);
        return null;
    }
}

async function sendMessage(chat_id, username, text, timestamp) {
    const user_id = await getUserIdByUsername(username);
    const query = 'INSERT INTO chat.Messages (chat_id, user_id, text, timestamp) VALUES ($1, $2, $3, $4)';
    const values = [chat_id, user_id, text, timestamp];
    console.log('sendmessage function', values);

    try {
        await pool.query(query, values); // Use the renamed query variable
        console.log('Message sent successfully!');
    } catch (err) {
        console.error('Query error', err.stack);
    }
}



// Close the connection to the database
/* pool.end() */