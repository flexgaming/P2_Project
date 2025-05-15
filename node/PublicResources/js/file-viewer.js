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
    console.log(currentSelectedContents.length);
    if (currentSelectedContents.length > 1) await refreshFileViewer(currentContentPath);
}, 20000); // Every 20 seconds, a refresh is made.

/* **************************************************
                File Viewer HTML Handling
   ************************************************** */

let isUploadModalOpen = false; // Set upload Modal to not open. 
let isRenameModalOpen = false; // Set upload Modal to not open.
let isNewFolderModalOpen = false; // Set upload Modal to not open.
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

let currentViewedFolderPath = document.getElementById('current-path');
const currentSelectedContents = []; 
const currentFolderHTMLContainer = document.getElementById('current-folder-contents-container');



/* **************************************************
                        Buttons
   ************************************************** */

// The layout 1 to 8 is the same setup inside the HTML document.

// New folder button (1).
document.getElementById('createFolder-button').addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page.
    
    if (isNewFolderModalOpen) return; // If the pop-up window (modal) is already open, nothing happens.
    document.getElementById('newfolder').value = ''; // Set the name text field to empty.
    isNewFolderModalOpen = true; // Set the pop-up window (modal) to be open.
    
    // Open modal window that makes you able to upload files.
    newFolderModal.classList.remove('hide');
}); 

// Move element button (2).
document.getElementById('move-button').addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page.
    
    if (isMoveModalOpen) return; // If the pop-up window (modal) is already open, nothing happens.
    if (currentSelectedContents.length !== 1) {
        alert('Select exactly one item to move.');
        return;
    }
    
    moveBrowsePath = '/'; // Set the browse path to the start path.
    document.getElementById('move-path-input').value = moveBrowsePath;
    renderMoveModal(); // Make the different clickable folder appear.
    isMoveModalOpen = true; // Set the pop-up window (modal) to be open.
    
    // Open modal window that makes you able to move files and folders.
    document.getElementById('move-modal').classList.remove('hide');

}); 

// Go to root (3).
document.getElementById('goToRoot-button').addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page.
    await refreshFileViewer('/');
}); 

// Go to parent folder (4).
document.getElementById('goToParent-button').addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page.
    //Cuts off the last part of the folder path name

    const newFolderPath = await navigateFileDirection(currentProject, currentContentPath, 'back');
    await refreshFileViewer(newFolderPath[0].pathWithoutProject); // Take the parent root of the first element without the project ID. 
});

// Rename button (5).
document.getElementById('rename-button').addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page.
    
    if (isRenameModalOpen) return; // If the pop-up window (modal) is already open, nothing happens.
    if (currentSelectedContents.length !== 1) {
        alert('Select exactly one item to rename.');
        return;
    }
    document.getElementById('rename').value = ''; // Set the rename text field to empty.
    isRenameModalOpen = true; // Set the pop-up window (modal) to be open.
    
    // Open modal window that makes you able to upload files.
    renameModal.classList.remove('hide');
}); 

// Upload button (6).
document.getElementById('uploadFile-button').addEventListener('click', (event) => {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page.
    if (isUploadModalOpen) return; // If the pop-up window (modal) is already open, nothing happens.
    isUploadModalOpen = true; // Set the pop-up window (modal) to be open.
    
    fileInputField.value = ''; // Makes sure that the files selected previously to upload is not within the currently file selector.

    // Open modal window that makes you able to upload files.
    uploadModal.classList.remove('hide');
});

// Download button (7).
document.getElementById('download-button').addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page.
    // If there is not selected an item, print alert.
    if (!currentSelectedContents.length >= 1) {
        alert('Select a item to download.');
        return;
    }

    // Download every element.
    for (const element of currentSelectedContents) {
        // Makes sure that the selected element is a file.
        if (element.dataset.isFile === 'true') await downloadFile(currentProject, element.dataset.pathWithoutProject, element.dataset.name);
    }
});

// Delete button (8).
document.getElementById('delete-button').addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page.
    // If there is not selected an item, print alert.
    if (!currentSelectedContents.length >= 1) {
        alert('Select a item to delete.');
        return;
    }
    for (const element of currentSelectedContents) {
        if (element.dataset.isFile === 'true') {
            await deleteFile(currentProject, element.dataset.pathWithoutProject + element.dataset.name);
        } else if (element.dataset.isFolder === 'true') {
            await deleteFolder(currentProject, element.dataset.pathWithoutProject + element.dataset.name + '/');
        }
    }
    await refreshFileViewer(currentContentPath); 
}); 

/* **************************************************
                The Create Folder Modal
   ************************************************** */

const newFolderModal = document.getElementById('newfolder-modal');

// Close new folder modal.
document.getElementById('close-newfolder-modal').addEventListener('click', () => {
    closeNewFolderModal();
});


// Confirm the name of the new folder.
const newFolderButton = document.getElementById('confirm-newfolder-button');
newFolderButton.addEventListener('click', async () => {

    if (document.getElementById('newfolder').value === '') { // If the new folder text field is empty, then the moddal is closed.
        closeNewFolderModal(); 
        return;
    }

    newFolderButton.disabled = true; // Disable the confirm new folder while naming.
     
    await createNewFolder(currentProject, currentContentPath
        + document.getElementById('newfolder').value + '/');// Create folder with name.
    
    newFolderButton.disabled = false; // Enable the confirm new folder after naming.

    closeNewFolderModal(); // Close the pop-up window (modal).
    await refreshFileViewer(currentContentPath); // Refresh the file viewer.
});



/** 
 * This function is used to close the modal pop-up window.
 */
function closeNewFolderModal() {
    newFolderModal.classList.add('hide');
    isNewFolderModalOpen = false;
}

/* **************************************************
                The Move Element Modal
   ************************************************** */

let isMoveModalOpen = false;
let moveBrowsePath = '/';

// Close the modal button.
document.getElementById('close-move-modal').addEventListener('click', () => {
    document.getElementById('move-modal').classList.add('hide');
    isMoveModalOpen = false;
});

// “Go Back” button.
document.getElementById('move-up-button').addEventListener('click', () => {
    // Strip trailing slash, drop last segment, re-add slash:
    let parts = moveBrowsePath.replace(/\/$/, '').split('/');
    if (parts.length > 1) {
        parts.pop(); // Removes the last element of the array and returns it.
        moveBrowsePath = parts.join('/') + '/';
        document.getElementById('move-path-input').value = moveBrowsePath;
        renderMoveModal(); 
    }
});

// Render folder list.
async function renderMoveModal() {
    const listEl = document.getElementById('move-folder-list');
    listEl.innerHTML = '';

    // Let them also manually edit the path.
    moveBrowsePath = document.getElementById('move-path-input').value;
    if (!moveBrowsePath.endsWith('/')) moveBrowsePath += '/'; // At the end if there are no '/', then add it. 

        // Fetch contents from the current browse path.
        const contents = await navigateFileDirection(currentProject, moveBrowsePath, 'nothing');
        const folders  = contents.filter(e => e.isFolder); // Make sure that it is a folder.

        folders.forEach(f => {
            const div = document.createElement('div'); // Create element.
            div.className = 'folder-element'; // Give the element a class name.
            div.textContent = f.name; // The element inherits the name from the folder 'f'.
            div.addEventListener('click', () => { // If the element is clicked on.
            moveBrowsePath = f.pathWithoutProject + f.name + '/'; // Browse path is updated.
            document.getElementById('move-path-input').value = moveBrowsePath;
            renderMoveModal();
        });
        listEl.appendChild(div);
    });

    // Enable confirm if path is non‐empty.
    document.getElementById('confirm-move-button').disabled = !moveBrowsePath;
}

// Confirm Move.
document.getElementById('confirm-move-button').addEventListener('click', async () => {
    const srcName   = currentSelectedContents[0].dataset.name;
    const srcFolder = currentSelectedContents[0].dataset.pathWithoutProject;
    // If the move element is a folder, then add '/' else dont do anything.
    const suffix    = currentSelectedContents[0].dataset.isFolder === 'true' ? '/' : '';
    // Add the path, file or folder name and the suffix.
    const oldPath   = srcFolder + srcName + suffix;
    // Get the browse path.
    const targetDir = document.getElementById('move-path-input').value;
    // Add the path, file or folder name and the suffix.
    const newPath   = targetDir + srcName + suffix;

    document.getElementById('confirm-move-button').disabled = true;
    try {
        await movePath(currentProject, oldPath, newPath);
    } catch (err) {
        alert('Move failed: ' + err.message);
    } finally {
        document.getElementById('confirm-move-button').disabled = false;
    }

    document.getElementById('move-modal').classList.add('hide'); // Remove the modal window.
    isMoveModalOpen = false;
    await refreshFileViewer(currentContentPath);
});

/* **************************************************
                    The Rename Modal
   ************************************************** */

const renameModal = document.getElementById('rename-modal');

// Close rename modal.
document.getElementById('close-rename-modal').addEventListener('click', () => {
    closeRenameModal();
});


// Confirm the rename of selected file or folder.
const renameButton = document.getElementById('confirm-rename-button');
renameButton.addEventListener('click', async () => {

    if (document.getElementById('rename').value === '') { // If the rename text field is empty, then the moddal is closed.
        closeRenameModal(); 
        return;
    }

    if (currentSelectedContents.length !== 1) { // If nothing is selected, then the modal is closed.
        closeRenameModal(); 
        return;
    } else if (currentSelectedContents.length === 1) {
        renameButton.disabled = true; // Disable the confirm renaming while renaming.
        if (currentSelectedContents[0].dataset.isFile) {
            await renamePath(currentProject, currentSelectedContents[0].dataset.pathWithoutProject 
                + currentSelectedContents[0].dataset.name, currentSelectedContents[0].dataset.pathWithoutProject 
                    + document.getElementById('rename').value); // Rename the selected content if file.

        } else if (currentSelectedContents[0].dataset.isFolder) {
            await renamePath(currentProject, currentSelectedContents[0].dataset.pathWithoutProject 
                + currentSelectedContents[0].dataset.name + '/', currentSelectedContents[0].dataset.pathWithoutProject 
                    + document.getElementById('rename').value + '/'); // Rename the selected content if folder.
        }
        renameButton.disabled = false; // Enable the confirm renaming after renaming.

        closeRenameModal(); // Close the pop-up window (modal).
        await refreshFileViewer(currentContentPath); // Refresh the file viewer.
    }
});



/** 
 * This function is used to close the modal pop-up window.
 */
function closeRenameModal() {
    renameModal.classList.add('hide');
    isRenameModalOpen = false;
}

/* **************************************************
                    The Upload Modal
   ************************************************** */

const uploadModal = document.getElementById('upload-modal');

// List of all the files selected to be uploaded.
const fileList = document.getElementById('file-list');

let selectedFiles = [];

// Close upload modal.
document.getElementById('close-upload-modal').addEventListener('click', () => {
    closeUploadModal();
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
        closeUploadModal(); 
        return;
    }

    fileInputField.disabled = true; // Disable the file input while uploading.
    uploadButton.disabled = true; // Disable the confirm upload while uploading.

    await uploadFile(currentProject, currentContentPath); // Upload the selected content.

    fileInputField.disabled = false; // Enable the file input after uploading.
    uploadButton.disabled = false; // Enable the confirm upload after uploading.

    closeUploadModal(); // Close the pop-up window (modal).
    await refreshFileViewer(currentContentPath); // Refresh the file viewer.
});

/** 
 * This function is used to close the modal pop-up window.
 */
function closeUploadModal() {
    uploadModal.classList.add('hide');
    fileList.innerHTML = '';
    selectedFiles.length = 0;
    isUploadModalOpen = false;
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
    if (isUploadModalOpen) return; // If the pop-up window (modal) is already open, nothing happens.
    isSelecting = true; // Setting the selected state.

    currentSelectedContents.length = 0; // Clear previous selection.

    // Setting the start of the box.
    startX = event.pageX;
    startY = event.pageY;

    // Styling for the box.  
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

    // Styling for the box.
    selectionBox.style.left = `${x}px`;
    selectionBox.style.top = `${y}px`;
    selectionBox.style.width = `${w}px`;
    selectionBox.style.height = `${h}px`;
});

// When the left mouse button is no longer down, the selection is done.
folderArea.addEventListener('mouseup', () => {
    if (isUploadModalOpen) return; // If the pop-up window (modal) is already open, nothing happens.

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
            console.log(element.dataset);
            currentSelectedContents.push(element); // Adds the selected element to array.
        } else {
            //Removes selected from the object and pushes the element to currentSelectedContents
            element.classList.remove('selected');
        }
    });
    // Turn of selecting and hide the seletor box.
    isSelecting = false; // Change the state of the selected.
    selectionBox.style.display = 'none'; // Ensure that the visual box (blue selectorbox) is not visable.
}); 