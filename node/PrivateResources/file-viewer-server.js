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
         extractTxt, 
         errorResponse,
         pathNormalize,
         guessMimeType,
         pool } from './server.js';

import { sanitize,
         accessTokenLogin } from './app.js';

import jwt from 'jsonwebtoken';
import fsPromises from 'fs/promises'; // Used in File Viewer.
import fs from 'fs'; // Used in File Viewer
import { writeFile } from 'fs'; // Used in File Viewer.
import path from 'path'; // Used in File Viewer.
import Busboy from 'busboy'; // Used in File Viewer




/* **************************************************
                       File Viewer
   ************************************************** */

let selectedFile = null; // Store the currently selected file.
const rootPath = 'C:/Users/emil/Desktop/P2Shit/'; // Store the current path of a folder. Change to ubuntu standard. (remember to end with a '/') Example: 'C:/Users/User/Desktop/'.


/** This function is used only in this JavaScript. 
 * It is used to get the data from the database and check if the user has access to the project ID.
 * 
 * @param {*} userId The user ID is used to check access, the input should be the accessTokenLogin, that is stored in the cookies.
 * @param {*} projectId The project ID is used to check access.
 * @returns If the user is assigned to more than 0 of the project ID that is check, then the return is true.
 */
async function checkProjectAccess(userId, projectId) {
    const text = 'SELECT * FROM project.project_access WHERE project_id = $1 AND user_id = $2;'; 
    const values = [projectId, userId];
    try {
        const res = await pool.query(text, values); // Execute the query
        if (res.rows > 0) {
            return true;
        }
        return false;
    } catch (err) {
        console.error('Query error', err.stack); // Log the error
        throw err; // Rethrow the error for further handling
    }
}


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
    // Check if user is orthorised to use the project ID.
    const userId = accessTokenLogin(req, res);
    if (!userId) { // accessTokenLogin will in this case have redirected the user.
        return;
    } else if (!checkProjectAccess(projectId, userId)) { // Check if the user has access to the project ID.
        return;
    }

    const data = await extractJSON(req, res); // Get the data (folder name) extracted into JSON.
    const projectRoot = rootPath + data.projectId; // Get to the right folder using the project id.
    const newPath = path.join(projectRoot, data.folderPath); // Combines both the root and the new folder.

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
    // Check if user is orthorised to use the project ID.
    const userId = accessTokenLogin(req, res);
    if (!userId) { // accessTokenLogin will in this case have redirected the user.
        return;
    } else if (!checkProjectAccess(projectId, userId)) { // Check if the user has access to the project ID.
        return;
    }

    const ct = req.headers['content-type'] || ''; // If content-type is null or empty, then use the other value ''. Can also be written: const ct = req.headers['content-type'] ? req.headers['content-type'] : '';

    if (!ct.startsWith('multipart/form-data')) { // Check if the content-type is either not 'multipart/form-data' or not a content-type.
        return reportError(res, new Error('Validation Error')); // If this is the case, then it returns that it is a validation error.
    }

    req.on('data', chunk => { // See the chunks of data being sent.
        console.log('Received chunk:', chunk.length);
    });
    req.on('end', () => { // See when the file has been parsed.
        console.log('Request stream ended');
    });

    const busboy = Busboy({ // Get the data from the headers (how the formData is split).
        headers: req.headers,
        limits: {
            fileSize: 10 * 1024 * 1024, // 10 MB file size limit.
            files: 5,                   // Max number of files.
            fields: 10                  // Max number of non-file fields.
            }
        }); 

    let projectId, destPath, resolveProjectId, resolveDestPath; // Declare variables.
    const savedFiles = []; // Array of all of the files uploaded on the server (in this run).

    // Promises for form fields (The 'field' is the event name emitted by Busboy whenever it encounters a non-file form field).
    const projectIdPromise = new Promise((resolve) => { resolveProjectId = resolve; });
    const destPathPromise = new Promise((resolve) => { resolveDestPath = resolve; });

    busboy.on('field', (fieldname, val) => {
    if (fieldname === 'projectId') { // Get the project ID from the DataForm object.
        projectId = val;
        resolveProjectId(val);
    }
    if (fieldname === 'destPath') { // Get the destination path from the DataForm object.
        destPath = val;
        resolveDestPath(val);
    }
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
                        console.log('File exceeded size limit');
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
        console.log('Busboy finished parsing request');
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
        console.error('Busboy general error:', err); // Can be deleted after.
    });
    busboy.on('partsLimit', () => console.error('Too many parts'));
    busboy.on('filesLimit', () => console.error('Too many files'));
    busboy.on('fieldsLimit', () => console.error('Too many fields'));

    req.pipe(busboy); // End the parsing of files.
}

// skal data.projectid også pathNormalize?
// Download File
async function downloadFile(req, res) { 
    // Check if user is orthorised to use the project ID.
    const userId = accessTokenLogin(req, res);
    if (!userId) { // accessTokenLogin will in this case have redirected the user.
        return;
    } else if (!checkProjectAccess(projectId, userId)) { // Check if the user has access to the project ID.
        return;
    }
    
    const data = await extractJSON(req, res); // Get the data (folder name) extracted into JSON.
    console.log(data);
    const projectRoot = rootPath + data.projectId; // Get to the right folder using the project id.
    const cleanPath = pathNormalize(data.filePath); // Make sure that no SQL injections can happen.
    const filePath = path.join(projectRoot, cleanPath, data.fileName); // Combines both the root and the file name.
    console.log('full path: ' + filePath);

    try {
        await fsPromises.access(filePath);
        
        // Stream the file back
        res.writeHead(200, {
          'Content-Type': guessMimeType(data.fileName),
          'Content-Disposition': `attachment; filename="${data.fileName}"`
        });
        const stream = fs.createReadStream(filePath);
        stream.pipe(res).on('error', e => reportError(res, e));
        
    } catch (err) {
        console.error(err);
    }
}



/** This function is called from router and is used to receive data from file-viewer.js, that is used to create folders / directories.
 * 
 * @param {*} req This is the data (project id, folder name), that is used.
 */
async function createFolder(req, res) { 
    // Check if user is orthorised to use the project ID.
    const userId = accessTokenLogin(req, res);
    if (!userId) { // accessTokenLogin will in this case have redirected the user.
        return;
    } else if (!checkProjectAccess(projectId, userId)) { // Check if the user has access to the project ID.
        return;
    }
    
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
    // Check if user is orthorised to use the project ID.
    const userId = accessTokenLogin(req, res);
    if (!userId) { // accessTokenLogin will in this case have redirected the user.
        return;
    } else if (!checkProjectAccess(projectId, userId)) { // Check if the user has access to the project ID.
        return;
    }
    
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
    // Check if user is orthorised to use the project ID.
    const userId = accessTokenLogin(req, res);
    if (!userId) { // accessTokenLogin will in this case have redirected the user.
        return;
    } else if (!checkProjectAccess(projectId, userId)) { // Check if the user has access to the project ID.
        return;
    }
    
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
    // Check if user is orthorised to use the project ID.
    const userId = accessTokenLogin(req, res);
    if (!userId) { // accessTokenLogin will in this case have redirected the user.
        return;
    } else if (!checkProjectAccess(projectId, userId)) { // Check if the user has access to the project ID.
        return;
    }

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
    // Check if user is orthorised to use the project ID.
    const userId = accessTokenLogin(req, res);
    if (!userId) { // accessTokenLogin will in this case have redirected the user.
        return;
    } else if (!checkProjectAccess(projectId, userId)) { // Check if the user has access to the project ID.
        return;
    }
    
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
