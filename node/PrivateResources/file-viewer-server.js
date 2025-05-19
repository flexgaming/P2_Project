/* **************************************************
                    Impot & Export
   ************************************************** */

export { getElements,
         createFolder,
         renamePath,
         movePath,
         deleteFile,
         deleteDirectory,
         uploadFile,
         downloadFile };

import { reportError, 
         extractJSON, 
         errorResponse,
         pathNormalize,
         guessMimeType,
         pool } from './server.js';

import { accessTokenLogin,// This is for future implementations with the use of more than 1 project
         sendJSON } from './app.js';

import fsPromises from 'fs/promises';
import fs from 'fs';
import * as path from 'path';
import Busboy from 'busboy';




/* **************************************************
                       File Viewer
   ************************************************** */
// Store the current path of a folder. Change to ubuntu standard. 
// (remember to end with a '/') Example: 'C:/Users/User/Desktop/'.
const rootPath = 'C:/Users/Emil/Desktop/P2DataTest/'; 

// Kan ikke tage imod hverken sanitize eller pathNormalize ved projectId.
/** This function is used only in this JavaScript. 
 * It is used to get the data from the database and check if the user has access to the project ID.
 * 
 * @param {*} userId The user ID is used to check access, the input should be the accessTokenLogin, that is stored in the cookies.
 * @param {integer} projectId The project ID is used to check access.
 * @returns If the user is assigned to more than 0 of the project ID that is check, then the return is true.
 * 
 * This is for future implementations with the use of more than 1 project
 */ 
async function checkProjectAccess(userId, projectId) {
    const text = 'SELECT * FROM project.project_access WHERE project_id = $1 AND user_id = $2;'; 
    const values = [projectId, userId]; // Removes any attempt to use SQL injection.
    try {
        const res = await pool.query(text, values); // Execute the query.
        if (res.rows > 0) {
            return true;
        }
        return false;
    } catch (err) {
        console.error('Query error', err.stack); // Log the error.
        throw err; // Rethrow the error for further handling.
    }
}



/**
 * Normalizes a file path by converting all backslashes to forward slashes
 * and ensuring it ends with a forward slash (/).
 * Useful for maintaining consistent path formatting across platforms.
 *
 * @param {string} path - The path string to normalize.
 * @returns {string} A path with forward slashes and a guaranteed trailing slash.
 */
function ensureTrailingSlash(p) {
    if (typeof p !== 'string') return '';
    const forwardPath = p.replace(/\\/g, '/');
    return forwardPath.endsWith('/') ? forwardPath : forwardPath + '/';
}


/** This function is called from router and is used to receive data from file-viewer.js, 
 * that is used to get elements from a specific path and sends it back to the user.
 * 
 * @param {*} projectId The project ID is only used to get a path without the project ID.
 * @param {*} path The path is used to get the different elements from within the path.
 * @returns Returns an array of elements to the user, that is retained within the path.
 */
async function getDirElements(projectId, path) {
    let elements = []; // Sets an array of the elements.
    try {
        // Get the directory in a variable (hereby being able to have multiple users use the directory).
        const dir = await fsPromises.opendir(path);
        for await (const dirent of dir) { // Go through all of the files and folders in the path.
            elements.push(dirent);
        } 
    } catch (err) { // If any errors is cought while the code above is running, it stops the process.
        console.error(err); // Print the error out.
    } 
    return elements.map(item => {

        const normalizedPath = ensureTrailingSlash(item.path.posix);
        let relativePath = "";
        if (normalizedPath.startsWith(rootPath)) { // Check if the path starts with the root path.
            relativePath = normalizedPath.slice(rootPath.length); // If so, get everything except the root path.
        }
        let pathWithoutProject = "";
        if (relativePath.startsWith(projectId + '/')) {
            pathWithoutProject = relativePath.substring(projectId.toString().length + 1, relativePath.length);
        }
        // Checks if element is either a file or folder.
        const isFile = item.name.includes('.');
        const isFolder = !isFile;
        
        return {
            name: item.name,
            path: item.fullPath,
            relativePath: '/' + relativePath,
            pathWithoutProject: '/' + pathWithoutProject,
            isFile: isFile,
            isFolder: isFolder
        };
    }); // Return the array of elements of the selected path.
}

/** This function is being called from router and is used to receive data from file-viewer.js, that is used to change the users path in the file viewer.
 * 
 * @param {*} req This is the request from the user, that carries the new path.
 * @param {*} res This is the responds where the path elements is being transfered back to the user.
 */
async function getElements(req, res) {
    const data = await extractJSON(req, res); // Get the data (folder name) extracted into text.
    // Check if user is orthorised to use the project ID.
    /*
    const userId = accessTokenLogin(req, res);
    if (!userId) { // accessTokenLogin will in this case have redirected the user.
        return;
    } else if (!checkProjectAccess(data.projectId, userId)) { // Check if the user has access to the project ID.
        res.end('User do not have access to project id.');
        return;
    } */ // This is for future implementations with the use of more than 1 project

    const projectRoot = rootPath + pathNormalize(data.projectId + '/'); // Get to the right folder using the project id.
    
    let newPath = '';
    if (data.folderPath === '/') newPath = projectRoot;
    else newPath = path.join(projectRoot, data.folderPath); // Combines both the root and the new folder.

    const elements = await getDirElements(data.projectId, newPath); // Get the data (elements) from the new path and return it to the user.
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
    // Authorization (token/session check).
    /* const userId = await accessTokenLogin(req, res); // accessTokenLogin will in this case have redirected the user.
    console.log('UserID: ' + userId);
    if (!userId) return; 
    if (await !checkProjectAccess(req.projectId, userId)) { // Check if the user has access to the project ID.
        res.end('User do not have access to project id.');
        return;
    } */ // This is for future implementations with the use of more than 1 project
    
    // Validate Content-Type.
    const ct = req.headers['content-type'] || ''; // If content-type is null or empty, then use the other value ''. Can also be written: const ct = req.headers['content-type'] ? req.headers['content-type'] : '';
    if (!ct.startsWith('multipart/form-data')) { // Check if the content-type is either not 'multipart/form-data' or not a content-type.
        return reportError(res, new Error('Validation Error')); // If this is the case, then it returns that it is a validation error.
    }

    // See the chunks of data being sent.
    req.on('data', chunk => console.log('Received chunk:', chunk.length));
    // See when the file has been parsed.
    req.on('end', () => console.log('Request stream ended'));

    // Initialize Busboy.
    const busboy = Busboy({ // Get the data from the headers (how the formData is split).
        headers: req.headers,
        limits: { files: 5, fields: 10 } // MAX 5 Files, MAX 10 variables.
    });

    // Parse variables from the fields.
    let projectId, destPath, out, savePath, fileTooLarge, uploadDir; // Declare variables.
    busboy.on('field', (name, val) => {
        console.log('[busboy] FIELD:', name, val);
        if (name === 'projectId') projectId = val; // Get the project ID from the DataForm object.
        if (name === 'destPath') {
            if (val === '/') destPath = val; // If there is only a '/', then it does not replace the injection attempts.
            else destPath  = val.replace(/^[/\\]+|[/\\]+$/g, ''); // Get the destination path from the DataForm object. 
        }
    });

    // Collect and immediately pipe each file.
    const savedFiles = []; // Array of all of the files uploaded on the server (in this run).
    busboy.on('file', (name, fileStream, info) => { // Get the nessecary data from the DataForm object.
        console.log('[busboy] FILE:', info.filename, info.mimeType);

        // Ensure projectId/destPath are parsed before writing:
        // (in practice form order or a slight delay ensures this).
        fileStream.on('data', () => {}); // Drain to allow finish. 
        
        // Prepare path (we'll create dirs in finish).
        const filename = path.basename(info.filename); // Get the original name from the file.
        const writeOp = () => {
            const projectRoot = rootPath + projectId; // Get to the right folder using the project id.
            uploadDir = path.join(projectRoot, destPath); // Add the to projectRoot and destination path.
            savePath = path.join(uploadDir, filename); // Use the full destination to make the end path on the server.
            out = fs.createWriteStream(savePath); // Push all of the file content into the path saveFilePath.
            fileStream.pipe(out);
            out.on('finish', () => {
                if (!fileTooLarge) { // When it is done with the upload:
                    savedFiles.push({ filename, mimeType: info.mimeType });
                } else  {
                    console.log('File is too large.'); 
                    alert('Upload failed: File is too large');
                }
            });
            out.on('error', err => console.error('Write error:', err));
        };

        // If the file is lager than the set amount, then the rest of the file is discarded.
        fileStream.on('limit', () => { // If file is too large:
            fileTooLarge = true;
            fileStream.unpipe(out); // Stop piping the stream.
            out.destroy(); // Destroy write stream.
            fs.unlink(savePath, () => {}); // Delete partial file.
            console.error('File too large. Discarded entire file.'); // Discard the file if too large.
        });

        // If fields not yet parsed, wait a tick.
        if (projectId && destPath) {
        writeOp();
        } else {
        // Delay until finish handler will write files.
        pendingFiles.push({ fileStream, info, writeOp });
        }
    });

    // Handle errors/limits
    busboy.on('error', err => reportError(res, err)); // If any errors.
    busboy.on('partsLimit',   () => console.warn('partsLimit reached'));
    busboy.on('filesLimit',   () => console.warn('filesLimit reached'));
    busboy.on('fieldsLimit',  () => console.warn('fieldsLimit reached'));

    // On finish, ensure directories, write any delayed files, then respond
    busboy.on('finish', async () => {
        if (!projectId || !destPath) {
            return reportError(res, new Error('Missing projectId or destPath'));
        }
        /* if (!checkProjectAccess(projectId, userId)) {
            return res.end('User does not have access to project id.');
        } */ // This is for future implementations with the use of more than 1 project

        // Check if the upload path exists.
        try {
            fsPromises.mkdir(uploadDir, {recursive: true}); // Creates the path if does not exist.
        } catch (err) {
            return reportError(res, err);
        }

        // Write any pending files that waited for fields.
        pendingFiles.forEach(({ writeOp }) => writeOp());

        // Wait a brief tick to allow writes to finish
        setImmediate(() => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ uploaded: savedFiles }));
        });
    });

    // Start parsing the result
    const pendingFiles = []; // For any file events before fields.
    req.pipe(busboy); // The parsing of the files is started here.
}

/** This function is being called from router and is used to download files from the server.
 * 
 * @param {*} req This is the request from the user, that carries the selected files
 * @param {*} res This is the response to the user, that carries the files.
 */
async function downloadFile(req, res) { 
    const data = await extractJSON(req, res); // Get the data (folder name) extracted into JSON.
    // Check if user is orthorised to use the project ID.
    /*const userId = accessTokenLogin(req, res);
    if (!userId) { // accessTokenLogin will in this case have redirected the user.
        return;
    } else if (!checkProjectAccess(data.projectId, userId)) { // Check if the user has access to the project ID.
        res.end('User do not have access to project id.');
        return;
    }*/
    const projectRoot = pathNormalize(rootPath + data.projectId); // Get to the right folder using the project id and make sure no SQL injections can happen.
    const cleanPath = pathNormalize(data.filePath); // Make sure that no SQL injections can happen.
    const filePath = path.join(projectRoot, cleanPath, data.fileName); // Combines both the root and the file name.
    
    try {
        await fsPromises.access(filePath);
        
        // Stream the file back
        res.writeHead(200, {
          'Content-Type': guessMimeType(data.fileName), // Get the MIME type (pdf, txt, (...)).
          'Content-Disposition': `attachment; filename="${data.fileName}"` // Give the filename.
        });
        const stream = fs.createReadStream(filePath); // Create a stream from server to user.
        stream.pipe(res).on('error', e => reportError(res, e)); // Pipe the file through the stream.
        
    } catch (err) { // Handle errors
        console.error(err);
    } 
}



/** This function is called from router and is used to receive data from file-viewer.js, that is used to create folders / directories.
 * 
 * @param {*} req This is the data (project id, folder name), that is used.
 */
async function createFolder(req, res) { 
    const data = await extractJSON(req, res); // Get the data (folder name) extracted into JSON.
    // Check if user is orthorised to use the project ID.
    /* const userId = accessTokenLogin(req, res);
    if (!userId) { // accessTokenLogin will in this case have redirected the user.
        return;
    } else if (!checkProjectAccess(data.projectId, userId)) { // Check if the user has access to the project ID.
        res.end('User do not have access to project id.');
        return;
    } */ // This is for future implementations with the use of more than 1 project

    const projectRoot = rootPath + data.projectId; // Get to the right folder using the project id.
    const folderName = pathNormalize(data.name); // Make sure that no SQL injections can happen.
    const newFullPath = path.join(projectRoot, folderName); // Combines both the root and the new folder.

    try {
        fsPromises.mkdir(newFullPath, {recursive: true}); // Creates the path if does not exist.
    } catch (err) {
        alert('Create new folder failed: ' + err.message);
        console.error(err);
    }
    res.end(); // The request was successful.
}


/** This function is called from router and is used to receive data from file-viewer.js, that is used to rename files and folders / directories.
 * 
 * @param {*} req This is the data (project id, old path, new name), that is used.
 */
async function renamePath(req, res) { // This would properly also include files
    const data = await extractJSON(req, res); // Get the data extracted into JSON.
    // Check if user is orthorised to use the project ID.
    /* const userId = accessTokenLogin(req, res);
    if (!userId) { // accessTokenLogin will in this case have redirected the user.
        return;
    } else if (!checkProjectAccess(data.projectId, userId)) { // Check if the user has access to the project ID.
        res.end('User do not have access to project id.');
        return;
    } */ // This is for future implementations with the use of more than 1 project

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
    const data = await extractJSON(req, res); // Get the data extracted into JSON.
    // Check if user is orthorised to use the project ID.
    /* const userId = accessTokenLogin(req, res);
    if (!userId) { // accessTokenLogin will in this case have redirected the user.
        return;
    } else if (!checkProjectAccess(data.projectId, userId)) { // Check if the user has access to the project ID.
        res.end('User do not have access to project id.');
        return;
    } */ // This is for future implementations with the use of more than 1 project

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
    const data = await extractJSON(req, res); // Get the data extracted into JSON.
    // Check if user is orthorised to use the project ID.
    /* const userId = accessTokenLogin(req, res);
    if (!userId) { // accessTokenLogin will in this case have redirected the user.
        return;
    } else if (!checkProjectAccess(data.projectId, userId)) { // Check if the user has access to the project ID.
        res.end('User do not have access to project id.');
        return;
    } */ // This is for future implementations with the use of more than 1 project

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
    const data = await extractJSON(req, res); // Get the data extracted into JSON.
    // Check if user is orthorised to use the project ID.
    /*const userId = accessTokenLogin(req, res);
    if (!userId) { // accessTokenLogin will in this case have redirected the user.
        return;
    } else if (!checkProjectAccess(data.projectId, userId)) { // Check if the user has access to the project ID.
        res.end('User do not have access to project id.');
        return;
    } */ // This is for future implementations with the use of more than 1 project

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
