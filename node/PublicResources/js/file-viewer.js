
/* **************************************************
                      File Viewer
   ************************************************** */

const currentProject = 2;

/* let newdata = await navigateFileDirection(currentProject, '/Test/Hej/', 'back'); // The data that is contained in a specific path.
console.log(newdata); */

/*
// Example on how to use createNewFolder, renamePath, movePath, deleteFolder, deleteFile and uploadFile. Good idea to use await when using async functions.
await createNewFolder(2, '/Folder1/');
await renamePath(2, '/Folder1/', '/newName/'); 
await movePath(2, '/newName/', '/Other/newName/'); // Will not be able to move a folder that already exists at the end location. 

document.getElementById('submitBTN').addEventListener('click', () => {
    uploadFile(2, '/Other/');}); // The upload file function works this way.

document.getElementById('downloadBTN').addEventListener('click', function() {
    downloadFile(2, '/Other/', 'h.pdf');}); // The download file function works this way.

//await movePath(2, '/test.txt', '/Other/test.txt'); // This works fine as well.
deleteFolder(2, '/Other/newName/');
deleteFile(2, '/Other/h.pdf');
*/


/* **************************************************
          File Viewer Communication to backend
   ************************************************** */


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
    console.log
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
    // document.getElementById('file-input') ← This one should be used instead maybe
    const input = document.getElementById('file-input'); // The local file that is being transfered.
    const form = new FormData(); // The formDat is like a JSON object, but instead of a string based format it is a multipart format.

    form.append('projectId', projectId); // The project ID is being appended under the name 'projectId'.
    form.append('destPath', destPath); // The destination path is being appended under the name 'destPath'.

    for (let i of input.files) {
        form.append('file', i);
    }
    
    const response = await fetch('/file/uploadFile', { // Make an object using fetch via router.js
        method: 'POST', // The method used for sending the file name is a POST.
        // To include a boundary parameter with the "multipart/form-data" in the content-type, headers is not used but is being send automatically with the formData.
        body: form
        }
    );
    if (response.ok) { // If the response is okay, then proceed.
        document.getElementById('file-input').value = '';      // This should be changed if the input is not this id.
        console.log('File(s) was uploaded successfully.');
    } else {
        console.log('Error in uploadFile.');
    }
}



// Download
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
        if (!response.ok) {
            console.error('Download failed: ', response.statusText);
            return;
        } else if (response.ok) { // If the response is okay, then proceed.
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');

            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);


            console.log('File was downloaded successfully.');
        } 
    } catch (err) {
        console.error('Donwload error: ', err);
    }
}




// skal opdateres (beskrivelsen)

/** Navigate the file path - in the future it would go more than two direction and implement a 'history' feature using lists.
 * @param {*} path In the path there should at least be the project id, followed by the location you want to get information from.
 * @param {back} direction This parameter is used for whether the direction is going nowhere, backwards or forward. Currently it can only go backwards and nowhere, however with a 'history' implemention in the future, a forward direction could be implemented 
 * */
async function navigateFileDirection(projectId, path, direction) {
    switch(direction) { // Get the different directions split up
        case 'back': {
            const newPath = path.substring(0, secondLastIndexOf(path, '/') + 1); // The + 1 is to keep the '/'.
            console.log('This is the new path: ' + newPath);
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


/* **************************************************
                File Viewer HTML Handling
   ************************************************** */

let isModalOpen = false; // If the Modal is not open
let currentContentPath = '/';

// When the file-viewer is fully loaded, then this is executed.
document.addEventListener('DOMContentLoaded', async () => { // Should this just return the project ID fromt the start?
   refreshFileViewer(currentContentPath);
   console.log('something loaded');
});


// Refresh the GUI
// Should be the thing that collects all the elements and visualises it in a div

async function refreshFileViewer(path) {
    currentContentPath = path; // Update the current path.
    // Delete any elements in the GUI.
    const removeAllElements = document.querySelectorAll('.file-element, .folder-element');
    removeAllElements.forEach(element => {
        element.remove();
    })
    
    // Get every element in the path.
    const getAllElements = await navigateFileDirection(currentProject, path, 'nothing');

    getAllElements.forEach(element => {
        if (element.isFile || element.isFolder) {
            // Add the element to the HTML
            const elementDiv = createNewElement(element, path);
            currentFolderHTMLContainer.appendChild(elementDiv);
        } else console.log("The file is not recognized as either a file nor a folder.");
    })

    // Update the directory display .
    currentViewedFolderPath.textContent = currentContentPath;
}


/* **************************************************
                HTML Element Functions
   ************************************************** */

let idCounter = 0;

function createUniqueId() {
    idCounter++;
    const Id = "element-id#" + idCounter;
    return Id;
}

// Create elements for HTML
function createNewElement(element) {
    const elementDiv = document.createElement('div'); // Element created is a div.
    
    elementDiv.id = createUniqueId(); // Create an unique ID for the element.

    // Creating the image for the element.
    const elementImage = document.createElement('img'); // Element created is an image.
    elementImage.draggable = false;
    elementImage.classList.add("prevent-select");

    // Creating the name for the element.
    const elementName = document.createElement('p'); // Element created is a paragraph.
    elementName.classList.add("name");
    elementName.classList.add("prevent-select");
    elementName.textContent = element.name; // Sets the paragraph to the name of the element.

    // Give the data from the element to the new established div.
    elementDiv.dataset.name = element.name; // The name of the file
    elementDiv.dataset.relativePath = element.relativePath; // Give the relative path to the div.
    elementDiv.dataset.pathWithoutProject = element.pathWithoutProject; // Give the relative path without the project ID to the div.
    elementDiv.dataset.isFile = element.isFile; // Is the element a file (true or false).
    elementDiv.dataset.isFolder = element.isFolder; // Is the element a folder (true or false).

    // Distinguish between a file and a folder.
    if (element.isFile) {
        elementDiv.classList.add("file-element"); // Add the element to the file class.
        elementImage.src = "img/file.png"; // Set the source of the image to file png.
        elementImage.alt = "Image of a file"; // If element image is not loaded, the alt is set.
    } else if (element.isFolder) {
        elementDiv.classList.add("folder-element"); // Add the element to the folder class.
        elementImage.src = "img/folder.png"; // Set the source of the image to folder png.
        elementImage.alt = "image of a folder"; // If element image is not loaded, the alt is set.
        elementImage.ondblclick = async () => { console.log(element)
            await refreshFileViewer(element.pathWithoutProject + element.name) }; 
    }
   
    // Add created name and image to the element.
    elementDiv.appendChild(elementImage); 
    elementDiv.appendChild(elementName);

    return elementDiv;
}


/** TODO !!!!!!!!!!!!!!!!!!!!!!!!!
 * Der skal sættes en "currentContentPath" fra starten af.
 * connect "currentSelectedContents" til det data fra navigateFileViewer.
 */




let currentViewedFolderPath = document.getElementById('current-path');  ///////// SKAL LAVES OM
const currentSelectedContents = []; // Den er i brug
const currentFolderHTMLContainer = document.getElementById('current-folder-contents-container');



/* **************************************************
                        Buttons
   ************************************************** */

// Go 1 back button (ID LAVES OM + currentContentPath indføres ordentligt)
document.getElementById('back-to-root-button').addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page.
    //Cuts off the last part of the folder path name

    const newFolderPath = await navigateFileDirection(currentProject, currentContentPath, 'back');
    await refreshFileViewer(newFolderPath[0].pathWithoutProject); // Take the parent root of the first element without the project ID. 
});

// Delete button
document.getElementById('trashcan-button').addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page.
    for (const element of currentSelectedContents) {
        if (element.dataset.isFile === 'true') {
            await deleteFile(currentProject, element.dataset.pathWithoutProject + element.dataset.name);
        } else if (element.dataset.isFolder === 'true') {
            await deleteFolder(currentProject, element.dataset.pathWithoutProject + element.dataset.name + '/');
        }
    }

    // Clear currentSelectedContents 


    await refreshFileViewer(currentContentPath); 
}); 

// Download button
document.getElementById('download-button').addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page.
    
    if (currentSelectedContents.length === 0 || currentSelectedContents == null) {
       console.log('There are no content selected.');
       return; 
    } 

    // Download every element.
    for (const element of currentSelectedContents) {
        console.log('We are inside of this ');
        if (element.dataset.isFile === 'true') await downloadFile(currentProject, element.dataset.pathWithoutProject, element.dataset.name);
    }
});

// Upload button
document.getElementById('upload-to-folder-button').addEventListener('click', (event) => {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page.
    if (isModalOpen) return;
    isModalOpen = true; 

    // Open modal window that makes you able to upload files.
    uploadModal.classList.remove('hide');
});



/* **************************************************
                    The Upload Modal
   ************************************************** */

const uploadModal = document.getElementById('upload-modal');

// List of all the files selected to be uploaded.
const fileList = document.getElementById('file-list');

let selectedFiles = [];

// Close the modal.
document.getElementById('close-upload-modal').addEventListener('click', () => {
    closeModal();
});

// The file-input button is made invisble and can hereby not be clicked on.
document.getElementById('file-input').addEventListener('change', handleFiles); // When file is uploaded "change", handleFiles is being called.

// The file-select-button is a replacement for file-input (this is due to design choice).
document.getElementById('file-select-button').addEventListener('click', () => {
    document.getElementById('file-input').click(); // Select the files
});


// Confirm the selection of the uploaded files and create them as HTML elements.
document.getElementById('confirm-upload-button').addEventListener('click', async () => {
    // Send the project ID and path to the upload
    // It gets the files by using document.getElementById('file-input').
    console.log(document.getElementById('file-input'));
    if (document.getElementById('file-input').files.length === 0) { // If nothing is selected, then the modal is closed.
        closeModal(); 
        return;
    }
    uploadFile(currentProject, currentContentPath);
    // Clear currentSelectedContents 
    closeModal();
    await refreshFileViewer(currentContentPath);
});

function closeModal() {
    uploadModal.classList.add('hide');
    fileList.innerHTML = '';
    selectedFiles.length = 0;
    isModalOpen = false;
}



//Handle the files so they get each get put into a list
function handleFiles(element) {
    const files = element.target.files;
    fileList.innerHTML = '';
    //for each of the selected files push them into the list and push the file names into an array
    for (const file of files) {
        //Pushes names into array
        selectedFiles.push(file);

        //Puts the files with their names in a list together with their file size
        const li = document.createElement('li');
        li.textContent = `${file.name} (${Math.round(file.size / 1024)} KB)`;
        li.name = file.name;
        fileList.appendChild(li);
    }
}











//Files and Folders have to be clickable
//and open a modal window that makes you able to:
// Download the file or folder
// Rename the file or folder
//Folders have to have a button that makes you able to open them as a container

//A searchbar in the top has to show what folder path is currently selected
//It is maybe searchable
//And it maybe shows you folders you could possibly open

//A button opens a window and makes you able to upload:
//Files into the current folder
//Folders into the current folder

//Contents within the current folder have to be selectable
//When they are sellected they have to be deleteable
//Maybe copyable so you can put them in another folder





// Blackbox for now

/* **************************************************
                    Selector box
   ************************************************** */
// Selector this selects things into the array currentSelectedContents
//And draws a selector box

//div that is the selction box
const selectionBox = document.getElementById('selection-box');
//Selecting only within the box that is the folder container thing
const folderArea = document.querySelector('.current-folder-contents-container');
//starting x and y for the box
let startX, startY;
//Condition for whether the user is selecting
let isSelecting = false;

//If the user hold the left mousebutton down within the folder area then the selction is started
folderArea.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return; // Only left click
    if (isModalOpen) return;
    isSelecting = true;

    currentSelectedContents.length = 0; // Clear previous selection

    //Setting the start of the box
    startX = event.pageX;
    startY = event.pageY;

    //Styling for the box
    selectionBox.style.left = `${startX}px`;
    selectionBox.style.top = `${startY}px`;
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.display = 'block';
});

//Getting all the elements within the selection
folderArea.addEventListener('mousemove', (event) => {
    if (!isSelecting) return;



    //Making the math on the box
    const x = Math.min(event.pageX, startX);
    const y = Math.min(event.pageY, startY);
    const w = Math.abs(event.pageX - startX);
    const h = Math.abs(event.pageY - startY);

    //Styling for the box
    selectionBox.style.left = `${x}px`;
    selectionBox.style.top = `${y}px`;
    selectionBox.style.width = `${w}px`;
    selectionBox.style.height = `${h}px`;
});

folderArea.addEventListener('mouseup', () => {
    //needs to return if the state isnt default
    if (isModalOpen) return;

    //Getting all file and folder elements
    const allElements = document.querySelectorAll('.file-element, .folder-element');
    //Looking at the client for how big the elements are
    const boxRect = selectionBox.getBoundingClientRect();


    //Checks if each file or folder is within the selectionbox
    allElements.forEach(element => {
        const elementReact = element.getBoundingClientRect();
        if (
            //Checks if the box overlaps with the elements box
            boxRect.left < elementReact.right &&
            boxRect.right > elementReact.left &&
            boxRect.top < elementReact.bottom &&
            boxRect.bottom > elementReact.top
        ) {
            //Adds selected to the element and pushes the element to currentSelectedContents
            element.classList.add('selected');
            currentSelectedContents.push(element);
        } else {
            //Removes selected from the object and pushes the element to currentSelectedContents
            element.classList.remove('selected');
        }
    });
    //turn of selecting and hide the seletor box
    isSelecting = false;
    selectionBox.style.display = 'none';
    console.log("Current Selected IDs:", currentSelectedContents.map(element => element.id));
}); 

