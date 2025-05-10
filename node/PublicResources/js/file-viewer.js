
/* **************************************************
                      File Viewer
   ************************************************** */
/* 
const currentProject = 2;

let newdata = await navigateFileDirection(currentProject + '/Test/Hej/', 'back'); // The data that is contained in a specific path.
console.log(newdata); */


/* let getRoot = await refreshFileViewer();
console.log(getRoot); */


// Example on how to use createNewFolder, renamePath, movePath, deleteFolder and deleteFile. Good idea to use await when using async functions.
await createNewFolder(2, '/Folder1/');
await renamePath(2, '/Folder1/', '/newName/'); 
await movePath(2, '/newName/', '/Other/newName/'); // Will not be able to move a folder that already exists at the end location. 

//await movePath(2, '/test.txt', '/Other/test.txt'); // This works fine as well.
// deleteFolder(2, '/random/');
// deleteFile(2, '/Other/test.txt');

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
        })});

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
    console.log
    const response = await fetch('/file/renamePath', { // Make an object using fetch via router.js
        method: 'POST', // The method used for sending the new name is a POST.
        headers: { 'Content-Type': 'application/json' }, // The content type is JSON.
        body: JSON.stringify({ // The information / data send into the app.js is the path and the new name.
            projectId: projectId, 
            oldDir: oldPath, 
            newDir: newPath
        })});

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
        })});
    
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
 * Remember to use '/' at the end and start of the fileName.
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
        })});
    
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
        })});
    
    if (response.ok) { // If the response is okay, then proceed.
        console.log('Folder was deleted.');
    } else {
        console.log('Error in deleteFolder.');
    }
}


// Upload
/** This function is used to upload files to the server.
 * 
 * @param {*} projectId This is used to check if the folder being changed is within the project folder.
 * @param {*} destPath The destination path is where the file is going to be store (without its name).
 * @param {*} localFile The local file is the file that's content is going to be used to create the new file on the server.
 * 
 * Remember to use '/' at the end and start of the destPath and only the start of localFile.
 */
async function uploadFile(projectId, destPath) {

    const input = document.getElementById('localFile'); // The local file that is being transfered.
    const file = input.files[0]; // Out of every file selected, it takes the first file.

    const formData = new formData();
    formData.append('file', file);


    const response = await fetch('/file/uploadFile', { // Make an object using fetch via router.js
        method: 'POST', // The method used for sending the file name is a POST.
        headers: { 'Content-Type': 'application/json' }, // The content type is JSON.
        body: JSON.stringify({projectId: projectId, destPath: destPath, newFile: file}) // The information / data send into the app.js is the file, that is being uploaded.
        });
    
    if (response.ok) { // If the response is okay, then proceed.
        console.log('File was uploaded successfully.');
    } else {
        console.log('Error in uploadFile.');
    }
}


// Download




// Refresh the GUI - Not done yey
// Should be the thing that collects all the elements and visualises it in a div

async function refreshFileViewer() {

    
    


}



/** Navigate the file path - in the future it would go more than two direction and implement a 'history' feature using lists.
 * @param {*} path In the path there should at least be the project id, followed by the location you want to get information from.
 * @param {back} direction This parameter is used for whether the direction is going nowhere, backwards or forward. Currently it can only go backwards and nowhere, however with a 'history' implemention in the future, a forward direction could be implemented 
 * */
async function navigateFileDirection(path, direction) {
    switch(direction) { // Get the different directions split up
        case 'back': { 
            const newPath = path.substring(0, path.lastIndexOf('/'));
            const response = await fetch('/file/fetch', { // Make an object using fetch via router.js
                method: 'POST', // The method used for sending the direction / new path is a POST.
                headers: { 'Content-Type': 'text/txt' }, // The content type is text.
                body: newPath // The information / data send into the app.js is the new path.
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
            const response = await fetch('/file/fetch', { // Make an object using fetch via router.js
                method: 'POST', // The method usde for sending the direction / new path is a POST.
                headers: { 'Content-Type': 'text/txt' }, // The content type is text.
                body: path // The information / data send into the app.js is the same path.
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


