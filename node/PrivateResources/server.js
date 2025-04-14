
/* **************************************************
                    Import & Export
   ************************************************** */

export { startServer, fileResponse, reportError, extractForm };
import { processReq } from './router.js';

import http from 'http';
import fs from 'fs';
import path from 'path';
import process from 'process';

const hostname = '127.0.0.1'
const port = 3000

const publicResources = '/node/PublicResources/';
const rootFileSystem = process.cwd(); // The path to the project (P2_Project).


/* **************************************************
                File & Document Serving
   ************************************************** */

/* Checks that the path is secure, and then adds full path to the PublicResources directory. */
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

/* Send contents as file as response. */
function fileResponse(res, filename) {
    const sPath = securePath(filename);
    console.log('Reading:' + sPath);

    fs.readFile(sPath, (err, data) => {
        if (err) { // File was not found.
            errorResponse(res, 404, 'No Such Resource');
        } else {
            successResponse(res, filename, data);
        }
    })
}

/* Gives error information to res. */
function errorResponse(res, code, reason) {
    res.statusCode = code;
    res.setHeader('Content-Type', 'text/txt');
    res.write(reason);
    res.end("\n");
}

/* If file is found then it gets the file type. */
function successResponse(res, filename, data) {
    res.statusCode = 200;
    res.setHeader('Content-Type', guessMimeType(filename)); // Figure out the file type.
    res.write(data);
    res.end('\n');
}

/* A helper function that converts filename suffix to the corresponding HTTP content type. */
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

/* Creates a promise. */
function collectPostBody(req, res) {
    /* Reads the request in chunks, and resolves errors. */
    function collectPostBodyExecutor(resolve, reject){
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

/* Extracts the data from a form request. */
function extractForm(req, res) {
    if (isFormEncoded(req.headers['content-type'])) {
        return collectPostBody(req, res).then(body => {
            let data = new URLSearchParams(body); // Parses the data from form encoding.
            return data;
        });
    } else {
        return Promise.reject(new Error('Validation Error')); // Create a rejected promise
    }
}

/* Get input from Jonas   -   Write definition later */
function isFormEncoded(contentType) {
    //Format 
    //Content-Type: text/html; charset=UTF-8
    let ct = contentType.split(';')[0].trim();
    return (ct === 'application/x-www-form-urlencoded');
    //would be more robust to use the content-type module and contentType.parse(..)
    //Fine for demo purposes
}

/* Calls the errorResponse function with correct error code. */
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


/* **************************************************
            HTTP Server & Request Handling
   ************************************************** */

const server = http.createServer(requestHandler); // Creates the server.

/* The function which the server uses to handle requests. */
function requestHandler(req, res) {
    try {
        processReq(req, res);
    } catch(e) {
        console.log('Internal Error: ' + e);
    }
}

/* Starts the server. */
function startServer() {
    server.listen(port, hostname, () => {
        console.log(`Server running at http://${hostname}:${port}/`);
    })
}
