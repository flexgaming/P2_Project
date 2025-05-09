
/* **************************************************
                      File Viewer
   ************************************************** */

const currentProject = 2;

let newdata = await navigateFileDirection(currentProject + '/Test/Hej/', 'back'); // The data that is contained in a specific path.
console.log(newdata);

/* let getRoot = await refreshFileViewer();
console.log(getRoot); */


createNewFolder('kurt'); // Creates folder and if it exists it abandons the command.

/**
 * 
 * @param {*} folderName 
 * @returns 
 */
async function createNewFolder(folderName) {
    const response = await fetch('/file/createFolder', { // Make an object using fetch via router.js
        method: 'POST', // The method use for sending the direction / new path is a POST.
        headers: { 'Content-Type': 'text/txt' }, // The content type is text.
        body: folderName // The information / data send into the app.js is the new folder.
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

// Wrong way to use it
renameFolder(2, '/../kurt/Test/', 'tEsT'); // Remember the front and end '/' (../test/)
// Right way to use it
renameFolder(2, '/Test/', 'tEsT'); // Remember the front and end '/' (../test/)

/** This function renames folders using the path of the folder that is going to be renamed and the new name.
 * 
 * @param {*} projectId This is used to check if the folder being changed is within the project folder.
 * @param {*} oldPath The path of the folder that is going to be renamed.
 * @param {*} newName The new name of the folder.
 */
async function renameFolder(projectId, oldPath, newName) {
    // Removes the old name from the path and adds the new name.
    const newPath = oldPath.substring(0, secondLastIndexOf(oldPath, '/') + 1) + newName;
    const response = await fetch('/file/renameFolder', { // Make an object using fetch via router.js
    method: 'POST', // The method use for sending the direction / new path is a POST.
    headers: { 'Content-Type': 'application/json' }, // The content type is JSON.
    body: JSON.stringify({projectId: projectId, oldDir: oldPath, newDir: newPath}) // The information / data send into the app.js is the new directory name.
    });

    if (response.ok) { // If the response is okay, then proceed.
        console.log('File folder was renamed to: ' + response.body.newPath);
        // Get all the data from the array into a JSON format.
        //let data = await response.json(); // data[0].name = name of the first file.
        //return data;
    } else {
        console.log('Error in renameFolder.');
    }
}

//Move file and folder

async function movePath(projectId, oldPath, newPath) {
    

    const response = await fetch('/file/movePath', { // Make an object using fetch via router.js
        method: 'POST', // The method use for sending the direction / new path is a POST.
        headers: { 'Content-Type': 'application/json' }, // The content type is JSON.
        body: JSON.stringify({projectId: projectId, oldDir: oldPath, newDir: newPath}) // The information / data send into the app.js is the new directory name.
        });
    
        if (response.ok) { // If the response is okay, then proceed.
            console.log('File folder was renamed to: ' + response.body.newPath);
            // Get all the data from the array into a JSON format.
            //let data = await response.json(); // data[0].name = name of the first file.
            //return data;
        } else {
            console.log('Error in renameFolder.');
        }

}

/** This function is used to get the second last element value of a string.
 * 
 * @param {*} array This is the array / string you want to check.
 * @param {*} value This is the value that you want to find in the array / string.
 * @returns 
 */
function secondLastIndexOf(array, value) {
    const last = array.lastIndexOf(value);
    if (last === -1) {
        return last;
    } 
    return array.lastIndexOf(value, last - 1);
}


// Refresh the GUI - Not done yey
// Should be the thing that collects all the elements and visualises it in a div

async function refreshFileViewer() {

    
    


}



/** Navigate the file path - in the future it would go more than two direction and implement a 'history' feature using lists.
 * @param {*} path In the path there should at least be the project id, followed by the location you want to get information from.
 * @param {back} direction This parameter is used for whether the direction is going nowhere, backwards or forward. Currently it can only go backwards and nowhere, however with a 'history' implemention in the future, a forward direction could be implemented */
async function navigateFileDirection(path, direction) {
    switch(direction) { // Get the different directions split up
        case 'back': { 
            const newPath = path.substring(0, path.lastIndexOf('/'));
            const response = await fetch('/file/fetch', { // Make an object using fetch via router.js
                method: 'POST', // The method use for sending the direction / new path is a POST.
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
                method: 'POST', // The method use for sending the direction / new path is a POST.
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


