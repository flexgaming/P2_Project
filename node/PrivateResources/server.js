/* **************************************************
                    Import & Export
   ************************************************** */

export { startServer, 
         fileResponse, 
         errorResponse,
         successResponse,
         extractJSON, 
         redirect,
         fetchRedirect,
         checkUsernameAvailability, 
         registerUser, 
         loginRequest,
         pathNormalize,
         guessMimeType, 
         securePath,
         pool,
         wsServer,
         server };

import { processReq } from './router.js';

import { handleWebSocketConnection } from './chat-server.js';

import { http } from 'http';
import { fs } from 'fs';
import { path } from 'path';
import { process } from 'process';
import { Pool } from 'pg';
import { WebSocketServer } from 'ws';

const hostname = '127.0.0.1';
const port = 3000;

const publicResources = '../PublicResources/';
const rootFileSystem = process.cwd(); // The path to the project (P2_Project).


/* **************************************************
                File & Document Serving
   ************************************************** */

/** Removes chains of '../', '..\' or '..'. */
function pathNormalize(p) {
    return path.normalize(p).replace(/^(\.\.(\/|\\|$))+/, '');
}

/** Checks that the path is secure, and then adds full path to the PublicResources directory. */
function securePath(userPath) {
    /* Checks if the userPath contains null. */
    if (userPath.indexOf('\0') !== -1) {
        return undefined;
    }

    // Normalize the path, and add the path to the PublicResources directory onto.
    userPath = pathNormalize(userPath);
    userPath = publicResources + userPath;

    return path.join(rootFileSystem, path.normalize(userPath));
}

/** Send contents of file as response. */
function fileResponse(res, filename) {
    // Get the secure full path to the requested file.
    const sPath = securePath(filename);

    fs.readFile(sPath, (err, data) => {
        if (res.headersSent) { // If the header is already sent.
            console.warn('Response already sent for: ', filename);
        }
        if (err) { // File was not found.
            console.warn('File not found or error when reading: ', sPath);
            redirect(res, '/'); // Redirects the user to the login page.
        } else {
            successResponse(res, filename, data);
        }
    })
}

/** Gives error information to res. */
function errorResponse(res, code, reason) {
    // If the code is a number, set the validCode to that number, otherwise set it to 500.
    const validCode = typeof code === 'number' ? code : 500;
    res.statusCode = validCode;
    res.setHeader('Content-Type', 'text/txt');
    res.write(reason);
    res.end('\n');
}

/** Sends the content to the client. */
function successResponse(res, content, data) {
    res.statusCode = 200;
    res.setHeader('Content-Type', guessMimeType(content)); // Figure out the content type.
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
                errorResponse(res, 413, 'Message Too Long');
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

/** Checks if data is JSON encoded. */
function isJSONEncoded(contentType) {
    let ct = contentType.split(';')[0].trim();
    return (ct === 'application/json')
}

/** Redirects the client, does not work on a fetch request. */
function redirect(res, url) {
    res.writeHead(302, { Location: url });
    res.end();
}

/** Redirects the client on a fetch request. The client JS has to read the url and manually redirect. */
function fetchRedirect(res, url) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ redirect: url }));
}


/* **************************************************
            HTTP Server & Request Handling
   ************************************************** */

/** The function which the server uses to handle requests. */
function requestHandler(req, res) {
    try {
        processReq(req, res);
    } catch (e) {
        console.log('Internal Error: ' + e);
    }
}

const server = http.createServer(requestHandler); // Creates the server.

/** Starts the server. */
function startServer() {
    server.listen(port, hostname, () => {
        console.log(`Server running at http://${hostname}:${port}/`);
    })
}


/* **************************************************
            WebSocket Server & Request Handling
   ************************************************** */

/** Creates a WebSocket server. */
const wsServer = new WebSocketServer({ server });

wsServer.on('connection', (ws, req, res) => {
    console.log('Connection: WebSocket connection established!');
    handleWebSocketConnection(ws, req, res);
});


/* **************************************************
            Database Connection and Queries
   ************************************************** */

// There are two ways to connect to the database, either with a pool or a client.
// The pool is used for multiple connections, while the client is used for a single connection.

// Create a pool to connect to the database.
const pool = new Pool({
    user: 'postgres',
    password: 'SQLvmDBaccess',
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    ssl: false
})

// Connect to the database.
pool.connect()
    .then(() => { console.log('Connected to the database') })
    .catch(err => { console.error('Connection error', err.stack); process.exit(5432) })

/** Check if a Username already exists in the Database. Returns true if the username does not exist. */
async function checkUsernameAvailability(username) {
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

/** Adds a new user to the users table. */
async function registerUser(username, password) {
    // The pg library prevents SQL injections using the following setup.
    const text = 'INSERT INTO project.Users (username, password) VALUES ($1, $2)';
    const values = [username, password];

    // Try adding the data to the Database and catch any error.
    try {
        await pool.query(text, values);
    } catch (err) {
        console.error('Query error', err.stack);
    }
}

/** Checks if a login credentials are correct. */
async function loginRequest(username, password) {
    // The pg library prevents SQL injections using the following setup.
    const text = 'SELECT user_id, password FROM project.Users WHERE username = $1';
    const values = [username];

    // Read all rows with given username, and compare and catch any error.
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