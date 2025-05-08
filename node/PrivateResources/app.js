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
         getRootFileViewer };
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
import fs from 'fs/promises'; // Used in File Viewer.

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
const rootPath = 'C:/Users/emil/Desktop/'; // Store the current path of a folder. Change to ubuntu standard.

// Select File
/**  */
function currentlySelectedFile(filePath) { // Might have to be function... (filePath, file) or something like this.
    selectedFile = filePath;
    console.log(`Selected file: ${selectedFile}`);
}


// Get the workspace filepath req.(something) example (.../node/FileManager/Workspace#1/...) 
// Maybe set the root here when you go into the file-viewer workspace.
/**
 * 
 * @param {*} project 
 * @param {*} workspace 
 * @returns 
 */
async function getRootFileViewer(req, res) {// For more security a user argument in the function could be implemented. Checking if the user has access or not to the project or workspace.
    // get the correct project and workspace from database. maybe change the arguments...
    
    const data = await extractJSON(req, res); // Get the data (elements) extracted into JSON form.
    //const secureData = sanitize(data); // Remove illegal symbols, such as "$€£" or other symbols to impenetrate the system. 
    
    // Tests:
    console.log('Extracted data: ' + data);
    //console.log('Secure data: ' + secureData);

    // The original root file followed by project directory and a workspace directory. Example: 'C:/Users/User/2/5/ USEABLE SPACE HERE'
    const useableRoot = await data.currentProjectId + '/' + await data.currentWorkspaceId + '/';
    sendJSON(res, useableRoot); // Give the reponds to the user in the form of a JSON file.
}


/** This function gets the elements from a specific path and sends it back to the user.
 * 
 * @param {*} path The path is used to get the different elements from within the path.
 * @returns Returns an array of elements to the user, that is retained within the path.
 */
async function getDirElements(path) {
    const dir = await fs.opendir(path); // Get the directory in a variable (hereby being able to have multiple users use the directory).
    let elements = []; // Sets an array of the elements.

    console.log(path + '← is the original (path) | is the new (dir) → ' + dir) // TESTS


    try {
        for await (const dirent of dir) { // Go through all of the files and folders in the path.
            elements.push({name: dirent.name, isFile: dirent.isFile()}); // Add an object with both the name and the element type to the array.
        } 
    } catch (err) { // If any errors is cought while the code above is running, it stops the process.
        console.error(err); // Print the error out.
    } 
    return elements; // Return the array of elements of the selected path.
}

/** This function is used to receive data from file-viewer.js, that is used to change the users path in the file viewer.
 * 
 * @param {*} req This is the request from the user, that carries the new path.
 * @param {*} res this is the responds where the path elements is being transfered back to the user.
 */
async function getElements(req, res) {
    const data = await extractTxt(req, res); // Get the data (elements) extracted into text form.
    const newPath = rootPath + sanitize(pathNormalize(data)); // Remove malicious SQL injections( and illegal symbols). Such as "../"(, "$€£") or other injections to impenetrate the system. 
    const elements = await getDirElements(newPath); // Get the data (elements) from the new path and return it to the user.
    sendJSON(res, elements); // Give the reponds to the user in the form of a JSON file.


    // TESTS:
    console.log('getElements (data) ' + data);
    console.log('getElements (newPath) ' + newPath);
    console.log('getElements (elements) ' + elements);
}





// Upload File



// Download File



// Create Folder
/**  */
function createFolder(folderName) { 
    try {
      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName);
      }
    } catch (err) {
      console.error(err);
    }
}


// Rename File
/**  */
function renameDirectory(oldDir, newDir) { // This would properly also include files
    fs.rename(`${oldDir}`, `${newDir}`, err => {
        if (err) {
          console.error(err);
        }
        console.log(`Renamed to ${newDir}`);
      });
}


// Move File
/**  */
function moveFile(sourcePath, destinationPath) {
    const dest = path.join(destinationPath, path.basename(sourcePath));
    fs.rename(sourcePath, dest, (err) => {
        if (err) {
            console.error("Error moving file:", err);
        } else {
            console.log(`File moved to ${dest}`);
        }
    });
}


// Function to delete a file
/**  */
function deleteFile(filePath) {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error("Error deleting file:", err);
        } else {
            console.log(`File deleted at ${filePath}`);
        }
    });
}

// Function to delete a directory (including non-empty ones)
/**  */
function deleteDirectory(directoryPath) {
    fs.rm(directoryPath, { recursive: true, force: true }, (err) => { // using recursive will enable deleting non-empty directories and force is to delete write-protected documents.
        if (err) {
            console.error("Error deleting directory:", err);
        } else {
            console.log(`Directory deleted at ${directoryPath}`);
        }
    });
}





