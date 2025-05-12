
/* **************************************************
                      File Viewer
   ************************************************** */
/* 
const currentProject = 2;

let newdata = await navigateFileDirection(currentProject + '/Test/Hej/', 'back'); // The data that is contained in a specific path.
console.log(newdata); */


/* let getRoot = await refreshFileViewer();
console.log(getRoot); */


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
    const input = document.getElementById('localFile'); // The local file that is being transfered.
    const newFile = input.files[0]; // Out of every file selected, it takes the first file.
    
    const form = new FormData(); // The formDat is like a JSON object, but instead of a string based format it is a multipart format.
    form.append('projectId', projectId); // The project ID is being appended under the name 'projectId'.
    form.append('destPath', destPath); // The destination path is being appended under the name 'destPath'.
    form.append('file', newFile); // The file is being appended under the name 'file'.
    
    const response = await fetch('/file/uploadFile', { // Make an object using fetch via router.js
        method: 'POST', // The method used for sending the file name is a POST.
        // To include a boundary parameter with the "multipart/form-data" in the content-type, headers is not used but is being send automatically with the formData.
        body: form
        }
    );
    
    if (response.ok) { // If the response is okay, then proceed.
        console.log('File was uploaded successfully.');
    } else {
        console.log('Error in uploadFile.');
    }
}



// Download
async function downloadFile(projectId, filePath, fileName) {
    console.log('test');
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



// Refresh the GUI - Not done yey
// Should be the thing that collects all the elements and visualises it in a div

async function refreshFileViewer() {

    
    


}



/** Navigate the file path - in the future it would go more than two direction and implement a 'history' feature using lists.
 * @param {*} path In the path there should at least be the project id, followed by the location you want to get information from.
 * @param {back} direction This parameter is used for whether the direction is going nowhere, backwards or forward. Currently it can only go backwards and nowhere, however with a 'history' implemention in the future, a forward direction could be implemented 
 * */
async function navigateFileDirection(projectId, path, direction) {
    switch(direction) { // Get the different directions split up
        case 'back': { 
            const newPath = path.substring(0, path.lastIndexOf('/'));
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



let currentState = "default";
let currentViewedFolderPath = document.getElementById('current-path');
const currentSelectedContents = [];
const currentFolderHTMLContainer = document.getElementById('current-folder-contents-container');

//4 main buttons
const backToRootButton = document.getElementById('back-to-root-button');
const trashcanButton = document.getElementById('trashcan-button');
const downloadButton = document.getElementById('download-button');
const uploadToFolderButton = document.getElementById('upload-to-folder-button')

//Upload modal
const uploadModal = document.getElementById('upload-modal');
const closeUploadModalButton = document.getElementById('close-upload-modal');
const fileInput = document.getElementById('file-input');
const fileSelectButton = document.getElementById('file-select-button');
const fileList = document.getElementById('file-list');
const confirmUploadButton = document.getElementById('confirm-upload-button');


//Opens a default folder
document.addEventListener('DOMContentLoaded', () => {
    //openFolder("file-viewer-folder-test/test");
});



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

/* **************************************************
                     Buttons
   ************************************************** */

//Back to root button click
backToRootButton.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page
    //Cuts off the last part of the folder path name
    const newFolderPath = (currentViewedFolderPath.value).substring(0, (currentViewedFolderPath.value).lastIndexOf('/'));
    openFolder(newFolderPath);

});

//upload to folder button click
uploadToFolderButton.addEventListener('click', (event) => {
    event.preventDefault();
    if (currentState !== "default") return;
    currentState = "upload-modal";

    //open modal window that makes you able to upload files
    uploadModal.classList.remove('hide');
});

//download button click
downloadButton.addEventListener('clcik', (event) => {
    event.preventDefault();
    if (currentSelectedContents.length === 1) {
        //open download modal that makes you able to download the file

    } else if (currentSelectedContents.length > 1) {
        //download mutiple files (download files in a folder)

    } else if (currentSelectedContents.length === 0) {
        //Doesn't download anything since nothing is selected
        console.log("nothing is selected so nothing is downloaded")

    } else {
        console.log("Bad info in download. currentselectedcontents: " + currentSelectedContents)
        return null;
    }
});

//Trashcan button click
trashcanButton.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page
    console.log("Pressed trachcan button with current selection: " + currentSelectedContents.map(element => element.id));
    doToAllCurrentSelectedContents("delete");
});

/* **************************************************
                     Open folder
   ************************************************** */

function openFolder(folderPath) {
    currentViewedFolderPath = folderPath;
    //Wait to impliment this requires back end
}

/* **************************************************
                HTML element functions
   ************************************************** */

let uniqueIdCounter = 0;

function createUniqueId() {
    const Id = "element-id#" + uniqueIdCounter++;
    return Id;
}

//Creating the HTML Element
function createHtmlElement(type, name, folderPath) {
    //type can be:
    //"folder"
    //"file"
    if (type !== "folder" && type !== "file") {
        console.log("Bad type in CreateHTMLelement, got : " + type)
        return null;
    }
    if (name === '' || name === undefined || name === null) {
        console.log("Bad name in CreateHTMLElement, got: " + name)
    }

    //element div
    const element = document.createElement('div');
    //unique id
    element.id = createUniqueId();

    //img
    const elementImage = document.createElement('img');
    elementImage.draggable = false;
    elementImage.classList.add("prevent-select");

    //name
    const elementName = document.createElement('p');
    elementName.classList.add("name");
    elementName.textContent = name;

    //Folder or File adds
    if (type === "folder") {
        //element
        element.classList.add("folder-element");
        //image
        elementImage.src = "img/folder.png";
        elementImage.alt = "image of a folder"
        elementImage.ondblclick = function () { openFolder(folderPath) };
    } else if (type === "file") {
        //element
        element.classList.add("file-element");
        //image
        elementImage.src = "img/file.png";
        elementImage.alt = "image of a file";
    }

    element.appendChild(elementImage);
    element.appendChild(elementName);

    return element;

}

//Add the element to the HTML
function addElementToHTML(type, element) {
    switch (type) {
        case "file":
        case "folder":
            currentFolderHTMLContainer.appendChild(element);
            break;
        default:
            console.log("Bad info in addElementToHTML got: " + type);
            break;
    }
}

//Delete all File and Folder elements in the html
function deleteAllCurrentFolderElements() {

    const allElements = document.querySelectorAll('.file-element, .folder-element');
    allElements.forEach(element => {
        element.remove();
    })
};

/* **************************************************
                General element functions
   ************************************************** */


//Delete element
function deleteElement(elementID) {
    //Get html element by ID
    const element = document.getElementById(elementID);
    console.log("Removed element: " + elementID)
    element.remove();
}

//Rename element
function renameElement(elementID, newName) {
    //Get html element by ID
    const element = document.getElementById(elementID);
    console.log("this is the element: " + element);
    //Get the name to rename (there is only 1 so it takes the first)
    const name = (element.getElementsByClassName("name"))[0];
    console.log("this is the name: " + name.textContent)
    //Give new name
    element.textContent = newName;
}

//Do to all selected contents
function doToAllCurrentSelectedContents(action) {
    switch (action) {
        case "delete":
            currentSelectedContents.forEach(element => {
                deleteElement(element.id)
            });
            break;
        default:
            console.log("Bad info in doToAllCurrentSelectedContents: " + action)
    }
}

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
    if (currentState !== "default") return;
    isSelecting = true;

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

    currentSelectedContents.length = 0; // Clear previous selection

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

document.addEventListener('mouseup', () => {
    //needs to return if the state isnt default
    if (currentState !== "default") return;

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

/* **************************************************
                    The Upload Modal
   ************************************************** */

closeUploadModalButton.addEventListener('click', () => {
    uploadModal.classList.add('hide');
    fileList.innerHTML = ''; // Clears the list
    currentState = "default";
});

fileSelectButton.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', handleFiles);

let selectedFiles = [];

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

//confirm the selection of the uploaded files and create them as html elements
confirmUploadButton.addEventListener('click', () => {
    //For each file create a html with its
    selectedFiles.forEach(file => {
        const element = createHtmlElement("file", file.name);
        addElementToHTML("file", element);
    });

    uploadModal.classList.add('hide');
    fileList.innerHTML = '';
    selectedFiles = [];
    currentState = "default";
});
