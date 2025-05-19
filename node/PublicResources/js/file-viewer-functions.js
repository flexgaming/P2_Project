/* **************************************************
                    Import & Export
   ************************************************** */

export { createNewFolder,
         renamePath,
         movePath,
         deleteFile,
         deleteFolder,
         uploadFile,
         downloadFile,
         navigateFileDirection };


/* **************************************************
          File Viewer Communication to backend
   ************************************************** */

// Should be called when creating a new project (making the parent folder for the project).
/** This function is used to make new folders in the different projects. If it exists it abandons the command.
 * 
 * @param {*} projectId This is used to check if the folder being changed is within the project folder.
 * @param {*} folderName This is the name of the folder that is being created.
 * 
 * Make sure to use '/' at the end and start of the folderName. Example: '/test/'
 */
async function createNewFolder(projectId, folderName) {
    const response = await fetch('/file/createFolder', { // Make an object using fetch via router.js
        method: 'POST', // The method used for sending the folder name is a POST.
        headers: { 'Content-Type': 'application/json' }, // The content type is JSON.
        body: JSON.stringify({ // The information / data send into the app.js is the new folder.
            projectId: projectId, 
            name: folderName
        })
    });

    if (response.ok) { // If the response is okay, then proceed.
        console.log('File folder was created.');
        // Get all the data from the array into a JSON format.
        //let data = await response.json(); // data[0].name = name of the first file.
        //return data;
    } else {
        console.log('Error in createNewFolder.');
    }
}


/** This function renames both files and folders using the path of the folder that is going to be renamed and the new name.
 * 
 * @param {*} projectId This is used to check if the folder being changed is within the project folder.
 * @param {*} oldPath The path of the folder that is going to be renamed.
 * @param {*} newName The new name of the folder.
 * 
 * Make sure to use '/' at the end and start of the oldPath and newName if you are working with folders. Example: '/test/'
 * 
 * If you are working with files, it is only the start that needs a '/' and not the end. Example: '/test.txt'
 */
async function renamePath(projectId, oldPath, newName) {
    // Removes the old name from the path and adds the new name.
    const newPath = oldPath.substring(0, secondLastIndexOf(oldPath, '/')) + newName;
    const response = await fetch('/file/renamePath', { // Make an object using fetch via router.js
        method: 'POST', // The method used for sending the new name is a POST.
        headers: { 'Content-Type': 'application/json' }, // The content type is JSON.
        body: JSON.stringify({ // The information / data send into the app.js is the path and the new name.
            projectId: projectId, 
            oldDir: oldPath, 
            newDir: newPath
        })
    });

    if (response.ok) { // If the response is okay, then proceed.
        console.log('File folder was renamed.');
        // Get all the data from the array into a JSON format.
        //let data = await response.json(); // data[0].name = name of the first file.
        //return data;
    } else {
        console.log('Error in renamePath.');
    }
}


/** This function is used to move both files and folders.
 * 
 * @param {*} projectId This is used to check if the folder being changed is within the project folder.
 * @param {*} oldPath The path of the folder that is going to be moved.
 * @param {*} newPath The destination where the folder is being moved to
 * 
 * Remember to use '/' at the end and start of the oldPath and newPath if you are working with folders. Example: '/test/'
 * 
 * If you are working with files, it is only the start that needs a '/' and not the end. Example: '/test.txt'
 */
async function movePath(projectId, oldPath, newPath) {
    const response = await fetch('/file/movePath', { // Make an object using fetch via router.js
        method: 'POST', // The method used for sending the new path is a POST.
        headers: { 'Content-Type': 'application/json' }, // The content type is JSON.
        body: JSON.stringify({ // The information / data send into the app.js is the new path.
            projectId: projectId, 
            oldDir: oldPath, 
            newDir: newPath
        })
    });
    
    if (response.ok) { // If the response is okay, then proceed.
        console.log('File folder was moved.');
        // Get all the data from the array into a JSON format.
        //let data = await response.json(); // data[0].name = name of the first file.
        //return data;
    } else {
        console.log('Error in movePath.');
    }
}

/** This function is used to get the second last element value of a string.
 * 
 * @param {*} array This is the array / string you want to check.
 * @param {*} value This is the value that you want to find in the array / string.
 * @returns It either returns the second last value or returns -1 if it can't find either the seconds or last value.
 * 
 * Example: Input 'secondLastIndexOf("C:/Users/User/Desktop/Project#1/Folder/OtherFolder/", '/').
 * 
 * The output would be the second last '/' and it would give the element of the array (38 in this case).
 */
function secondLastIndexOf(array, value) {
    const last = array.lastIndexOf(value);
    if (last === -1) {
        return last;
    } 
    return array.lastIndexOf(value, last - 1);
}



/** This function is used to delete files.
 * 
 * @param {*} projectId This is used to check if the file being changed is within the project folder.
 * @param {*} fileName The file that is going to be deleted.
 * 
 * Remember to use '/' at the start of the fileName.
 * 
 * Example: deleteFile(2, '/Other/test.txt') - deletes the file named text.txt in path '/2/Other/'.
 */
async function deleteFile(projectId, fileName) {
    const response = await fetch('/file/deleteFile', { // Make an object using fetch via router.js
        method: 'POST', // The method used for sending the file name is a POST.
        headers: { 'Content-Type': 'application/json' }, // The content type is JSON.
        body: JSON.stringify({ // The information / data send into the app.js is the file name, that will be deleted.
            projectId: projectId, 
            fileName: fileName
        })
    });
    
    if (response.ok) { // If the response is okay, then proceed.
        console.log('File was deleted.');
    } else {
        console.log('Error in deleteFile.');
    }
}


/** This function is used to delete folders.
 * 
 * The function is set to both delete non-empty and write-protected folders.
 * 
 * @param {*} projectId This is used to check if the folder being changed is within the project folder.
 * @param {*} folderName The folder that is going to be deleted.
 * 
 * Remember to use '/' at the end and start of the folderName.
 * 
 * Example: deleteFolder(2, '/random/') - deletes the folder named random in project 2.
 */
async function deleteFolder(projectId, folderName) {
    const response = await fetch('/file/deleteFolder', { // Make an object using fetch via router.js
        method: 'POST', // The method used for sending the file name is a POST.
        headers: { 'Content-Type': 'application/json' }, // The content type is JSON.
        body: JSON.stringify({ // The information / data send into the app.js is the directory name, that will be deleted.
            projectId: projectId, 
            folderName: folderName
        })
    });
    
    if (response.ok) { // If the response is okay, then proceed.
        console.log('Folder was deleted.');
    } else {
        console.log('Error in deleteFolder.');
    }
}


/** This function is used to upload files to the server.
 * 
 * @param {*} projectId This is used to check if the folder being changed is within the project folder.
 * @param {*} destPath The destination path is where the file is going to be store (without its name).
 * @param {*} localFile The local file is the file that's content is going to be used to create the new file on the server.
 * 
 * Remember to use '/' at the end and start of the destPath. It only requires the destination and not the filename.
 * 
 * The file is selected on the web-server. (Limit 10MB).
 */
async function uploadFile(projectId, destPath) {
    const input = document.getElementById('file-input'); // The local file that is being transfered.
    const form = new FormData(); // The formData is like a JSON object, but instead of a string based format it is a multipart format.

    form.append('projectId', projectId); // The project ID is being appended under the name 'projectId'.
    form.append('destPath', destPath); // The destination path is being appended under the name 'destPath'.

    for (let i of input.files) { // Apppend every file that is selected.
        form.append('file', i);
    }
    
    const response = await fetch('/file/uploadFile', { // Make an object using fetch via router.js
        method: 'POST', // The method used for sending the file name is a POST.
        // To include a boundary parameter with the "multipart/form-data" in the content-type, headers is not used but is being send automatically with the formData.
        body: form
        }
    );
    if (response.ok) { // If the response is okay, then proceed.
        console.log('File(s) was uploaded successfully.');
    } else {
        console.log('Error in uploadFile.');
    }
}


/** This function is used to download files from a specific path in a project's file viewer.
 * 
 * @param {*} projectId This is used to check if the folder being changed is within the project folder.
 * @param {*} filePath The file(s) that you want to download is stored in the file path folder. 
 * @param {*} fileName The name(s) of the file(s) is required to download said file.
 * @returns It returns the file that you want to download, and automatically stores it in the 'Downloads' path.
 */
async function downloadFile(projectId, filePath, fileName) {
    try {
        const response = await fetch('/file/downloadFile', { // Make an object using fetch via router.js
            method: 'POST', // The method used for sending the file name is a POST.
            headers: { 'Content-Type': 'application/json' }, // The content type is JSON.
            body: JSON.stringify({ // The information / data send into the app.js is the file that the client want to download.
                projectId: projectId, 
                filePath: filePath,
                fileName: fileName
            })
        });
        if (!response.ok) { // If the file could not be downloaded - lost packages.
            console.error('Download failed: ', response.statusText);
            return;
        } else if (response.ok) { // If the response is okay, then proceed.
            const blob = await response.blob(); //
            const url = URL.createObjectURL(blob); // Create URL object with the file inside (automatically installs when clicked).
            const a = document.createElement('a'); // Create a new element 'a'.

            a.href = url; // Give the element 'a' the URL as a href.
            a.download = fileName; // Give the name of the new downloaded file, the file name.
            document.body.appendChild(a); // Give the document the newly appointed element 'a'.
            a.click(); // Click the new button 'a'.
            a.remove(); // Remove the button 'a'.
            URL.revokeObjectURL(url); // Revoke the created URL object.

            console.log('File was downloaded successfully.');
        } 
    } catch (err) { // If the file was not successful.
        console.error('Donwload error: ', err);
    }
}


/** This function is used to navigate file path's - in the future it would go more than two direction and implement a 'history' feature using lists.
 * 
 * @param {*} projectId This is used to check if the folder being changed is within the project folder.
 * @param {*} path In the path there should at least be the project id, followed by the location you want to get information from.
 * @param {*} direction This parameter is used for whether the direction is going nowhere, backwards or forward. Currently it can 
 * only go backwards and nowhere, however with a 'history' implemention in the future, a forward direction could be implemented 
 * @returns It returns an array of elements from the selected file path.
 */
async function navigateFileDirection(projectId, path, direction) {
    switch(direction) { // Get the different directions split up
        case 'back': {
            const newPath = path.substring(0, secondLastIndexOf(path, '/') + 1); // The + 1 is to keep the '/'.
            console.log('This is the new path 2: ' + newPath);
            const response = await fetch('/file/fetch', { // Make an object using fetch via router.js
                method: 'POST', // The method used for sending the direction / new path is a POST.
                headers: { 'Content-Type': 'application/json' }, // The content type is JSON.
                body: JSON.stringify({ // The information / data send into the app.js is the new path.
                    projectId: projectId, 
                    folderPath: newPath
                })
            });

            if (response.ok) { // If the response is okay, then proceed.
                // Get all the data from the array into a JSON format.
                let data = await response.json(); // data[0].name = name of the first file.
                return data;
        } else {
            console.log('Error in navigateFileDirection (back).');
        }
            break;
        }

        case 'nothing': { 
            
            console.log('This is the path from the start: ' + path);
            const response = await fetch('/file/fetch', { // Make an object using fetch via router.js
                method: 'POST', // The method usde for sending the direction / new path is a POST.
                headers: { 'Content-Type': 'application/json' }, // The content type is JSON.
                body: JSON.stringify({ // The information / data send into the app.js is the new path.
                    projectId: projectId, 
                    folderPath: path
                })
            });

            if (response.ok) { // If the response is okay, then proceed.
                // Get all the data from the array into a JSON format.
                let data = await response.json(); // data[0].name = name of the first file.
                return data;
        } else {
            console.log('Error in navigateFileDirection (nothing).');
        }
            break;
        }

        default: {
            console.log('Default was hit in navigateFileDirection');
            break;
        }
    }
}
