/* **************************************************
                    Impot & Export
   ************************************************** */

export { validateLogin, 
         jwtLoginHandler, 
         jwtRefreshHandler, 
         accessTokenLogin, 
         registerHandler, 
         getTodos, 
         addTodo,
         deleteTodo,
         updateTodo,
         swapPosTodos,
         getElements,
         createFolder,
         renamePath,
         movePath,
         deleteFile,
         deleteDirectory,
         uploadFile };
import { startServer, 
         reportError, 
         extractJSON, 
         extractTxt, 
         errorResponse, 
         checkUsername, 
         registerUser, 
         loginRequest, 
         fetchTodosDB,
         addTodoDB,
         deleteTodoDB,
         updateTodoDB,
         swapPosTodosDB,
         pathNormalize
        } from './server.js';

import jwt from 'jsonwebtoken';
import fsPromises from 'fs/promises'; // Used in File Viewer.
import fs from 'fs'; // Used in File Viewer
import { writeFile } from 'fs'; // Used in File Viewer.
import path from 'path'; // Used in File Viewer.
import Busboy from 'busboy'; // Used in File Viewer

const minNameLength = 3;
const maxNameLength = 20;
const hashLength = 32;

const tokenStore = {};

const accessExpiration = '30m';
const refreshExpiration = '7d';

const accessCode = 'i9eag7zj3cobxl40dv6urwn15yk82mqthfsp';
const refreshCode = 'k01hqu7a92ceyjfiobvldrpxw4n8zt6sm35g';

startServer();


/* **************************************************
                    Input Verification
   ************************************************** */

/** Removes all malicious characters. */
function sanitize(str) {
    str = str
    .replace(/&/g, '')
    .replace(/</g, '')
    .replace(/>/g, '')
    .replace(/"/g, '')
    .replace(/'/g, '')
    .replace(/`/g, '')
    .replace(/\//g, '');

    return str.trim();
}

/** Function to prevent injections using the sanitize function.
 * 
 * This function also checks that the length of the username is acceptable. */
function validateUsername(username) {
    const name = sanitize(username);

    if (name.length < minNameLength || name.length > maxNameLength) {
        throw(new Error('Validation Error'));
    }

    return name;
}

/** Function to prevent injections using the sanitize function.
 *  
 * This function also checks that the length of the password is acceptable. */ 
function validatePassword(password) {
    const key = sanitize(password);

    if (key.length !== hashLength) {
        throw(new Error('Validation Error'));
    }

    return key;
}

/** This function validates the login information.
 *  
 * The username is verified by minimum and max length.
 * The password is verified by the length of the hash.
 * 
 * Both the username and password is sanitized to deny any injection attemps.
 */
function validateLogin(username, password) {
    username = validateUsername(username); // Check if the username completes the requirements and deny any injection attempts.
    password = validatePassword(password); // Check if the password completes the requirements and deny any injection attempts.

    return [username, password];
}

async function loginHandler(res, username, password) {
    try {
        const userId = await loginRequest(username, password);
        console.log('USER ID: ' + userId);
        
        if (userId) {
            const tokens = generateTokens(userId);
        
            storeTokens(userId, tokens); // Stores the tokens in server memory.
            sendCookie(res, tokens); // Sends the tokens back to the clients.
            res.end();
        }
        else {
            // Inform the client that login failed.
            errorResponse(res, 409, 'Username or Password is incorrect.');
        }
    } catch(err) {
        reportError(res, err);
    }
}

async function registerHandler(req, res) {
    try {
        const body = await extractJSON(req, res);
        const { username, password } = body;
        const [user, pass] = validateLogin(username, password); // validateLogin can still be synchronous

        console.log(user, pass);

        if (await checkUsername(user)) {
            await registerUser(user, pass);
            loginHandler(res, user, pass);
        } else {
            console.log('Username giga taken bro');
            // Respond with an error or message to the client
            errorResponse(res, 409, 'Username is unavailable.');
        }
    } catch (err) {
        reportError(res, err);
    }
}


/* **************************************************
                Authentication Tokens
   ************************************************** */

/** When logging in, gets the login data, and makes JSON Web Tokens. */
function jwtLoginHandler(req, res) {
    extractJSON(req, res)
    .then(body => {
        const { username, password } = body; // Get username and password from login request.
        const [user, pass] = validateLogin(username, password); // Validate login and get the userId.
        
        loginHandler(res, user, pass);
    }).catch(e => reportError(res, e));
}

/** Handles requests to refresh access token. */
function jwtRefreshHandler(res, refreshToken) {
    try {
        const decoded = jwt.verify(refreshToken, refreshCode); // Decode the refresh token.
        const userId = decoded.userId;

        // Generate a new access token.
        const newAccessToken = jwt.sign({ userId: userId }, accessCode, { expiresIn: accessExpiration });

        // Stores the tokens by first reading the current data for given userId and then updating the access token.
        storeTokens(userId, { ...getTokens(userId), accessToken: newAccessToken });
        sendCookie(res, { accessToken: newAccessToken }); // Sends the tokens back to the clients.

        return userId;
    } catch (err) {
        errorResponse(res, 403, 'Forbidden Access');

        return null;
    }
}

/** Generates the tokens using the JWT library. */
function generateTokens(userId) {
    const accessToken = jwt.sign({ userId }, accessCode, { expiresIn: accessExpiration });
    const refreshToken = jwt.sign({ userId }, refreshCode, { expiresIn: refreshExpiration });
    
    return { accessToken, refreshToken };
}

/** Saves the tokens an object array. */
function storeTokens(userId, tokens) {
    tokenStore[userId] = tokens;
}

/** Returns the tokens of a user. */
function getTokens(userId) {
    return tokenStore[userId];
}

/** Sends the JSON object as response to client. */
function sendJSON(res, obj) {
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify(obj));
    res.end();
}

/** Verifies the access token. */
function validateAccessToken(token) {
    try {
        const decoded = jwt.verify(token, accessCode);
        return decoded;
    } catch (err) {
        return null;
    }
}

/** Function to login using access tokens. */
function accessTokenLogin(req, res) {
    const cookies = parseCookies(req.headers.cookie);
    if (cookies.accessToken) { // Check if the access token is valid.
        const accessToken = validateAccessToken(cookies.accessToken);

        if (accessToken) { // Login.
            return accessToken.userId;
        } else if (cookies.refreshToken) { // Request new access token.
            return jwtRefreshHandler(res, cookies.refreshToken);
        }
    } else if (cookies.refreshToken) { // Request new access token.
        return jwtRefreshHandler(res, cookies.refreshToken);
    } else {
        return null;
    }
}


/* **************************************************
                        Cookies
   ************************************************** */

/**
 * Sends the cookies to the client.
 * 
 * @param {object} obj The object containing cookies.
 * @param {response} res The response to the client.
 */
function sendCookie(res, obj) {
    const accessExpire = new Date(); // The expiration time for the access token.
    const refreshExpire = new Date(); // The expiration time for the refresh token.

    accessExpire.setTime(accessExpire.getTime() + 1000 * 60 * 30); // Expires after 30 minutes.
    refreshExpire.setTime(refreshExpire.getTime() + 1000 * 60 * 60 * 24 * 7); // Expires after 7 days.

    // Create header and add the refresh and access tokens from the object if any.
    let header = [];
    if (obj.refreshToken) {
        header.push(
            `refreshToken=${obj.refreshToken};` +
            `HttpOnly;` +
            /* `Secure;` + */ // Only works with https.
            `SameSite=Strict;` +
            `Expires=${refreshExpire.toUTCString()};` +
            `Path=/`
        );
    }
    if (obj.accessToken) {
        header.push(
            `accessToken=${obj.accessToken};` +
            `HttpOnly;` +
            /* `Secure;` + */
            `SameSite=Strict;` +
            `Expires=${accessExpire.toUTCString()};` +
            `Path=/`
        );
    }

    // Adds the cookie data to the header of the response object.
    res.setHeader('Set-Cookie', header);
}

function parseCookies(cookieHeader = '') {
    return cookieHeader
    .split(';') // Splits "refreshToken=value; accessToken=value" into ["refreshToken=value", " accessToken=value"].
    .map(c => c.trim().split('=')) // Trims whitespace from the ends, and then splits them into ["refreshToken", "value"].
    .reduce((acc, [k, v]) => { // For all keyword-value pairs, check if there is a keyword, then add the decoded value to accumulator.
        if (k) acc[k] = decodeURIComponent(v); // Unicode decoding turns "%20" into " " etc.
        return acc;
    }, {}); // The "{}" here is the initial value of the accumulator, which is an empty object.
}


/* **************************************************
                Database Communication
   ************************************************** */

async function getTodos(req, res) {
    try {
        const body = await extractTxt(req, res); // Extracts the JSON body from the request.
        const todos = await fetchTodosDB(body); // Fetches the todos from the database.
        console.log(todos); // Logs the todos to the console.
        sendJSON(res, todos); // Sends the todos back to the client as JSON.
    } catch (err) {
        console.log(err); // Logs the error to the console.
        reportError(res, err); // Reports the error to the client.
    }
}

async function addTodo(req, res) {
    try {
        const body = await extractJSON(req, res);
        const todoId = await addTodoDB(body.workspace_id);
        sendJSON(res, { todo_id: todoId });
    } catch (err) {
        console.log(err);
        reportError(res, err);
    }
}

async function deleteTodo(req, res) {
    try {
        const body = await extractJSON(req, res);
        await deleteTodoDB(body.workspace_id, body.todo_id);
        res.end('ToDo item deleted successfully!');
    } catch (err) {
        console.log(err);
        reportError(res, err);
    }
}

async function updateTodo(req, res) {
    try {
        const body = await extractJSON(req, res);
        await updateTodoDB(body.todo_id, body.content, body.checked);
        res.end('ToDo item updated successfully!');
    } catch (err) {
        console.log(err);
        reportError(res, err);
    }
}

async function swapPosTodos(req, res) {
    try {
        const body = await extractJSON(req, res);
        await swapPosTodosDB(body.todo_id1, body.todo_id2);
        res.end('ToDo items swapped successfully!');
    } catch (err) {
        console.log(err);
        reportError(res, err);
    }
}








/* **************************************************
                       File Viewer
   ************************************************** */

let selectedFile = null; // Store the currently selected file.
const rootPath = 'C:/Users/Emil/Desktop/P2DataTest/'; // Store the current path of a folder. Change to ubuntu standard. (remember to end with a '/') Example: 'C:/Users/User/Desktop/'.

// Select File
/**  */
function currentlySelectedFile(filePath) { // Might have to be function... (filePath, file) or something like this.
    selectedFile = filePath;
    console.log(`Selected file: ${selectedFile}`);
}


/** This function is called from router and is used to receive data from file-viewer.js, that is used to get elements from a specific path and sends it back to the user.
 * 
 * @param {*} path The path is used to get the different elements from within the path.
 * @returns Returns an array of elements to the user, that is retained within the path.
 */
async function getDirElements(path) {
    let elements = []; // Sets an array of the elements.

    try {
        const dir = await fsPromises.opendir(path); // Get the directory in a variable (hereby being able to have multiple users use the directory).
        for await (const dirent of dir) { // Go through all of the files and folders in the path.
            elements.push(dirent);
        } 
    } catch (err) { // If any errors is cought while the code above is running, it stops the process.
        console.error(err); // Print the error out.
    } 
    return elements; // Return the array of elements of the selected path.
}

/** This function is being called from router and is used to receive data from file-viewer.js, that is used to change the users path in the file viewer.
 * 
 * @param {*} req This is the request from the user, that carries the new path.
 * @param {*} res This is the responds where the path elements is being transfered back to the user.
 */
async function getElements(req, res) {
    const data = await extractTxt(req, res); // Get the data (elements) extracted into text form.
    const newPath = rootPath + sanitize(pathNormalize(data) + '/'); // Remove malicious SQL injections and illegal symbols. Such as "../", "$€£" or other injections to impenetrate the system. 
    const elements = await getDirElements(newPath); // Get the data (elements) from the new path and return it to the user.
    sendJSON(res, elements); // Give the reponds to the user in the form of a JSON file.
}


/** This function is being called from router and is used to upload files to the server.
 * 
 * @param {*} req This is the request from the user, that carries the new file.
 * @returns If the content-type is not 'multipart/form-data', then it gets send back.
 * 
 * It does only need the project ID as well as the path under the project on the server.
 */
async function uploadFile(req, res) { 
    const ct = req.headers['content-type'] || ''; // If content-type is null or empty, then use the other value ''. Can also be written: const ct = req.headers['content-type'] ? req.headers['content-type'] : '';

    if (!ct.startsWith('multipart/form-data')) { // Check if the content-type is either not 'multipart/form-data' or not a content-type.
        return reportError(res, new Error('Validation Error')); // If this is the case, then it returns that it is a validation error.
    }

    const busboy = Busboy({ // Get the data from the headers (how the formData is split).
        headers: req.headers,
        limits: {
            fileSize: 10 * 1024 * 1024, // 10 MB file size limit
            files: 5,                   // Max number of files
            fields: 10                  // Max number of non-file fields
            }
        }); 
    let projectId, destPath; // Declare variables.
    const savedFiles = []; // Array of all of the files uploaded on the server (in this run).

    // Promises for form fields (The 'field' is the event name emitted by Busboy whenever it encounters a non-file form field).
    const projectIdPromise = new Promise((resolve) => {
        busboy.on('field', (fieldname, val) => { // Get the project ID from the DataForm object.
            if (fieldname === 'projectId') {
                projectId = val;
                resolve(val);
            }
        });
    });

    const destPathPromise = new Promise((resolve) => {
        busboy.on('field', (fieldname, val) => { // Get the destination path from the DataForm object.
            if (fieldname === 'destPath') {
                destPath = val;
                resolve(val);
            }
        });
    });

    // Promise for file handling.

    // fieldname: Is the name of the form field ('file' in this case).
    // fileStream: Is the stream of the file data (the actual file content).
    // filename: Is the original name of the file uploaded.
    // encoding: Is the encoding type used for the file (usually '7bit' for multipart).
    // mimetype: Is the MIME type of the file (e.g., 'image/png', 'application/pdf').

    const filesPromise = new Promise((resolve, reject) => {
        busboy.on('file', (fieldname, fileStream, info) => { // Get the nessecary data from the DataForm object.
            const { filename, encoding, mimeType } = info;
            const done = () => {
                resolve(savedFiles);
            };

            let fileTooLarge = false;
            const waitForPaths = async () => {
                try {
                    await Promise.all([projectIdPromise, destPathPromise]);
                    const fileName = path.basename(filename);       // Get the original name from the file.
                    const projectRoot = rootPath + projectId;        // Get to the right folder using the project id.
                    const fullDest = path.join(projectRoot, destPath); // Add the to projectRoot and destination path.
                    const savePath = path.join(fullDest, fileName);     // Use the full destination to make the end path on the server.

                    const out = fs.createWriteStream(savePath);
                    fileStream.pipe(out); // Push all of the file content into the path saveFilePath.

                    // If the file is lager than the set amount, then the rest of the file is discarded.
                    fileStream.on('limit', () => { 
                        fileTooLarge = true;
                        fileStream.unpipe(out);       // Stop piping the stream.
                        out.destroy();                 // Destroy write stream.
                        fs.unlink(savePath, () => {});  // Delete partial file.
                        console.error('File too large. Discarded entire file.');
                    });


                    out.on('finish', () => { // When it is done with the upload:
                        if (!fileTooLarge) {
                            savedFiles.push({ field: fieldname, filename: fileName, mimeType});
                            done();
                        } else console.log('File is too large.');
                    });

                    out.on('error', reject);
                } catch (err) {
                    reject(err);
                }
            };

            waitForPaths();
        });
    });

    // Final event.
    busboy.on('finish', async () => { // All data from the DataForm have been processed.
        try {
            await Promise.all([projectIdPromise, destPathPromise, filesPromise]); // Waits for all the promises to end.
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ uploaded: savedFiles }));
        } catch (err) {
            reportError(res, err);
        }
    });

    busboy.on('error', err => { // If any errors.
        reportError(res, err);
    });

    req.pipe(busboy); // End the parsing of files.
}


// Download File
async function downloadFile(req, res) { // GET
    
}



/** This function is called from router and is used to receive data from file-viewer.js, that is used to create folders / directories.
 * 
 * @param {*} req This is the data (project id, folder name), that is used.
 */
async function createFolder(req, res) { 
    const data = await extractJSON(req, res); // Get the data (folder name) extracted into JSON.
    const projectRoot = rootPath + data.projectId; // Get to the right folder using the project id.
    const folderName = pathNormalize(data.name); // Make sure that no SQL injections can happen.

    const newFullPath = path.join(projectRoot, folderName); // Combines both the root and the new folder.

    try {
        fsPromises.mkdir(newFullPath, {recursive: true}); // Creates the path if does not exist.
    } catch (err) {
        console.error(err);
    }
    res.end(); // The request was successful.
}


/** This function is called from router and is used to receive data from file-viewer.js, that is used to rename files and folders / directories.
 * 
 * @param {*} req This is the data (project id, old path, new name), that is used.
 */
async function renamePath(req, res) { // This would properly also include files
    const data = await extractJSON(req); // Gets the data extraced to JSON.
    const projectRoot = rootPath + data.projectId; // Get to the right folder using the project id.
    const oldPath = pathNormalize(data.oldDir); // Make sure that no SQL injections can happen.
    const newPath = pathNormalize(data.newDir); // Make sure that no SQL injections can happen.

    const oldFullPath = path.join(projectRoot, oldPath); // Combines both the root and the old path.
    const newFullPath = path.join(projectRoot, newPath); // Combines both the root and the new path.

    try {
        await fsPromises.access(oldFullPath); // Checks if the old path already exists.

        try {
            await fsPromises.access(newFullPath); // Checks if the new path already exists.
        } catch (err) {
            console.error(err);
        }
        await fsPromises.rename(oldFullPath, newFullPath); // Renames the path if does not exist.

    } catch (err) {
        if (err.code === 'ENOENT') {
            errorResponse(res, 404, err.message); // Could not find the file.
        } else if (err.code === 'EEXIST') {
            errorResponse(res, 404, err.message); // Target folder already exists.
        } else {
            console.error(err);
        }
    }
    res.end(); // The request was successful.
}



/** This function is called from router and is used to receive data from file-viewer.js, that is used to move both files and folders / directories.
 * 
 * @param {*} req This is the data (project id, old dir, new dir), that is used.
 */
async function movePath(req, res) {
    const data = await extractJSON(req); // Gets the data extraced to JSON.
    const projectRoot = rootPath + data.projectId; // Get to the right folder using the project id.
    const oldPath = pathNormalize(data.oldDir); // Make sure that no SQL injections can happen.
    const newPath = pathNormalize(data.newDir); // Make sure that no SQL injections can happen.

    const oldFullPath = path.join(projectRoot, oldPath); // Combines both the root and the old path.
    const newFullPath = path.join(projectRoot, newPath); // Combines both the root and the new path.
    
    try {
        await fsPromises.access(oldFullPath); // Checks if the old path already exists.

        try {
            await fsPromises.access(newFullPath); // Checks if the new path already exists.
        } catch (err) {
            console.error(err);
        }
        await fsPromises.rename(oldFullPath, newFullPath); // Replacing the old path with a new path, essentially moving the location.

    } catch (err) {
        if (err.code === 'ENOENT') {
            errorResponse(res, 404, err.message); // Could not find the file.
        } else if (err.code === 'EEXIST') {
            errorResponse(res, 404, err.message); // Target folder already exists.
        } else {
            console.error(err);
        }
    }

    res.end(); // The request was successful.
}


/** This function is called from the router and is used to receive data from file-viewer.js, that is used to delete files.
 * 
 * @param {*} req This is the data (project id, file name), that is used.
 */
async function deleteFile(req, res) {
    const data = await extractJSON(req); // Gets the data extraced to JSON.
    const projectRoot = rootPath + data.projectId; // Get to the right folder using the project id.
    const fileDelete = path.join(projectRoot, data.fileName);

    try {
        await fsPromises.access(fileDelete); // Checks if the new path already exists.

        fsPromises.unlink(fileDelete); // Deletes the file.
    } catch (err) {
        console.error(err);
    }
    res.end();
}

/** This function is called from the router and is used to receive data from file-viewer.js, that is used to delete folders / directories.
 * 
 * The function deletes directory (including non-empty ones).
 * 
 * @param {*} req This is the data (project id, folder name), that is used.
 */
async function deleteDirectory(req, res) {
    const data = await extractJSON(req); // Gets the data extraced to JSON.
    const projectRoot = rootPath + data.projectId; // Get to the right folder using the project id.
    const folderDelete = path.join(projectRoot, data.folderName);

    try {
        await fsPromises.access(folderDelete); // Checks if the new path already exists.

        fsPromises.rm(folderDelete, { recursive: true, force: true }); // Deletes the folder. Using recursive will enable deleting non-empty directories and force is to delete write-protected documents.
    } catch (err) {
        console.error(err);
    }
    res.end();
}





