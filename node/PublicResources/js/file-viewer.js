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
