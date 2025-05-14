/* **************************************************
                    Import & Export
   ************************************************** */

import { createNewFolder,
         renamePath,
         movePath,
         deleteFile,
         deleteFolder,
         uploadFile,
         downloadFile,
         navigateFileDirection } from './file-viewer-functions.js';


/* **************************************************
                      File Viewer
   ************************************************** */

const currentProject = 1; // If different project was implemented, a function should be called here.

// To ensure that the content that is shown is as accurate as possible, an interval was made.
setInterval( async () => {
    await refreshFileViewer(currentContentPath);
}, 10000); // Every 10 seconds, a refresh is made.


// skal slettes til sidst.
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
                File Viewer HTML Handling
   ************************************************** */

let isModalOpen = false; // If the Modal is not open
let currentContentPath = '/';

// When the file-viewer is fully loaded, then this is executed.
document.addEventListener('DOMContentLoaded', async () => { // Should this just return the project ID fromt the start?
   await refreshFileViewer(currentContentPath);
});


/** This function is used to refresh the current view of the file viewer.
 * 
 * @param {*} path The path is used to see the element of said path.
 */
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
    currentViewedFolderPath.value = currentContentPath;
}

/* **************************************************
                HTML Element Functions
   ************************************************** */

let idCounter = 0;

function createUniqueId() {
    idCounter++; // Counter adds one at each call.
    const Id = "element-id#" + idCounter; // Make ID from the counter.
    return Id; 
}

/** This function is used to create elements (file(s) or folder(s)) and add them to the HTML.
 * 
 * @param {*} element The element is the file or folder that gets added.
 * @returns It returns the newly created div (file or folder).
 */
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
        elementImage.ondblclick = async () => { 
            console.log('This is crazy: ');
            console.log(element.pathWithoutProject + element.name);
            await refreshFileViewer(element.pathWithoutProject + element.name + '/') }; 
    }
   
    // Add created name and image to the element.
    elementDiv.appendChild(elementImage); 
    elementDiv.appendChild(elementName);

    return elementDiv;
}

let currentViewedFolderPath = document.getElementById('current-path');  ///////// SKAL LAVES OM
const currentSelectedContents = []; // Den er i brug
const currentFolderHTMLContainer = document.getElementById('current-folder-contents-container');



/* **************************************************
                        Buttons
   ************************************************** */

// Go to parent folder.
document.getElementById('back-to-root-button').addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page.
    //Cuts off the last part of the folder path name

    const newFolderPath = await navigateFileDirection(currentProject, currentContentPath, 'back');
    await refreshFileViewer(newFolderPath[0].pathWithoutProject); // Take the parent root of the first element without the project ID. 
});

// Delete button.
document.getElementById('trashcan-button').addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page.
    for (const element of currentSelectedContents) {
        if (element.dataset.isFile === 'true') {
            await deleteFile(currentProject, element.dataset.pathWithoutProject + element.dataset.name);
        } else if (element.dataset.isFolder === 'true') {
            await deleteFolder(currentProject, element.dataset.pathWithoutProject + element.dataset.name + '/');
        }
    }
    await refreshFileViewer(currentContentPath); 
}); 

// Download button.
document.getElementById('download-button').addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page.
    // If the selected content is either null or 0, nothing happens.
    if (currentSelectedContents.length === 0 || currentSelectedContents == null) {
       console.log('There are no content selected.');
       return; 
    } 

    // Download every element.
    for (const element of currentSelectedContents) {
        // Makes sure that the selected element is a file.
        if (element.dataset.isFile === 'true') await downloadFile(currentProject, element.dataset.pathWithoutProject, element.dataset.name);
    }
});

// Upload button.
document.getElementById('upload-to-folder-button').addEventListener('click', (event) => {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page.
    if (isModalOpen) return; // If the pop-up window (modal) is already open, nothing happens.
    isModalOpen = true; // Set the pop-up window (modal) to be open.
    
    fileInputField.value = ''; // Makes sure that the files selected previously to upload is not within the currently file selector.

    // Open modal window that makes you able to upload files.
    uploadModal.classList.remove('hide');
});

// Go to root.
document.getElementById('').addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page.
    
}); 

// New folder button.
document.getElementById('').addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page.
    
}); 

// Rename button.
document.getElementById('').addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page.
    
}); 

// Move element button.
document.getElementById('').addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page.
    
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
const fileInputField = document.getElementById('file-input');
fileInputField.addEventListener('change', handleFiles); // When file is uploaded "change", handleFiles is being called.

// The file-select-button is a replacement for file-input (this is due to design choice).
document.getElementById('file-select-button').addEventListener('click', () => {
    fileInputField.click(); // Select the files
});

// Confirm the selection of the uploaded files and create them as HTML elements.
const uploadButton = document.getElementById('confirm-upload-button');
uploadButton.addEventListener('click', async () => {
    // Send the project ID and path to the upload
    // It gets the files by using document.getElementById('file-input').
    if (fileInputField.files.length === 0) { // If nothing is selected, then the modal is closed.
        closeModal(); 
        return;
    }

    fileInputField.disabled = true; // Disable the file input while uploading.
    uploadButton.disabled = true; // Disable the confirm upload while uploading.

    await uploadFile(currentProject, currentContentPath); // Upload the selected content.

    fileInputField.disabled = false; // Enable the file input after uploading.
    uploadButton.disabled = false; // Enable the confirm upload after uploading.

    closeModal(); // Close the pop-up window (modal).
    await refreshFileViewer(currentContentPath); // Refresh the file viewer.
});

/** 
 * This function is used to close the modal pop-up window.
 */
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

/* **************************************************
                    Selector box
   ************************************************** */
// Selector this selects things into the array currentSelectedContents and draws a selector box.

// Make an div element of the selction box.
const selectionBox = document.getElementById('selection-box');

// Making the area that can be selected be within the folder container.
const folderArea = document.querySelector('.current-folder-contents-container');

let startX, startY; // Declaring variables for the box.

let isSelecting = false; // Declare the current selected state.

// If the user hold the left mousebutton down within choosen area then the selection starts.
folderArea.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return; // Make sure that it is only left click.
    if (isModalOpen) return; // If the pop-up window (modal) is already open, nothing happens.
    isSelecting = true; // Setting the selected state.

    currentSelectedContents.length = 0; // Clear previous selection.

    // Setting the start of the box.
    startX = event.pageX;
    startY = event.pageY;

    // Styling for the box.                                     ///             Could be done in a CSS file instead.
    selectionBox.style.left = `${startX}px`;
    selectionBox.style.top = `${startY}px`;
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.display = 'block';
});

// Getting all the elements within the selected area.
folderArea.addEventListener('mousemove', (event) => {
    if (!isSelecting) return; // If nothing is selected, then nothing happens.

    // Setting both of the corners opposite of each other.
    const x = Math.min(event.pageX, startX);
    const y = Math.min(event.pageY, startY);
    const w = Math.abs(event.pageX - startX);
    const h = Math.abs(event.pageY - startY);

    // Styling for the box.                                     ///             Could be done in a CSS file instead.
    selectionBox.style.left = `${x}px`;
    selectionBox.style.top = `${y}px`;
    selectionBox.style.width = `${w}px`;
    selectionBox.style.height = `${h}px`;
});

// When the left mouse button is no longer down, the selection is done.
folderArea.addEventListener('mouseup', () => {
    if (isModalOpen) return; // If the pop-up window (modal) is already open, nothing happens.

    // Getting all of the selected elements.
    const allElements = document.querySelectorAll('.file-element, .folder-element');

    // Looking at the client for how big the elements are.
    const boxRect = selectionBox.getBoundingClientRect();


    // Checks if the selected elements are within the selectionbox.
    allElements.forEach(element => {
        const elementReact = element.getBoundingClientRect(); // Get the position of the element.
        if (
            // Checks if the box overlaps with the elements box.
            boxRect.left < elementReact.right &&
            boxRect.right > elementReact.left &&
            boxRect.top < elementReact.bottom &&
            boxRect.bottom > elementReact.top
        ) {
            // Adds selected to the element and pushes the element to currentSelectedContents.
            element.classList.add('selected');
            currentSelectedContents.push(element); // Adds the selected element to array.
        } else {
            //Removes selected from the object and pushes the element to currentSelectedContents
            element.classList.remove('selected');
        }
    });
    // Turn of selecting and hide the seletor box
    isSelecting = false; // Change the state of the selected.
    selectionBox.style.display = 'none'; // Ensure that the visual box (blue selectorbox) is not visable.
}); 

