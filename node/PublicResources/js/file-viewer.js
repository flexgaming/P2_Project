
/* **************************************************
                      File Viewer
   ************************************************** */

/* const publicResources = '/node/PublicResources/Files/'; // Change to '../PublicResources/Files/' on Ubuntu.
const rootFileSystem = process.cwd(); // The path to the project (P2_Project). */

// TEST: - Lortet virker ikke
/* function FileTesting(path) {
    console.log("HELLO?")
    const folderPath = `${path}`;
    fs.readdirSync(folderPath);

    console.log(fs.readdirSync(folderPath));
}
console.log("Hello?????");
document.getElementById('fileTester').addEventListener('click', FileTesting('C:/Users/Emil/.ssh/')); */



let newdata = await navigateFileDirection('Test/Hej/', 'back'); // The data that is contained in a specific path.
console.log(newdata);
/* let getRoot = await refreshFileViewer();
console.log(getRoot);
 */
let good = await navigateFileDirection('1/2/', 'nothing');
console.log('This is the result: ' + good);

// Refresh the GUI
async function refreshFileViewer() {

    let currentProject = 1;
    let currentWorkspace = 2;


    const response = await fetch('/file/root', { // Make an object using fetch via router.js
        method: 'POST', // The method use for sending the direction / new path is a POST.
        headers: { 'Content-Type': 'application/json' }, // The content type is JSON.

        // The information / data send into the app.js is the right project and workspace.
        body: JSON.stringify({ currentProjectId: currentProject, currentWorkspaceId: currentWorkspace }) 
    });
    if (response.ok) { // If the response is okay, then proceed.
        // Get all the data from the array into a JSON format.
        let data = await response.json(); // data[0].name = name of the first file.
        return data;
    } else {
        console.log('Error in navigateFileDirection (back).');
    }
    
}




/** Navigate the file path - in the future it would go more than one direction and implement a 'history'.
 * @param {*} path is the path that you currently are on and is used for going backwards.
 * @param {back} direction is used for whether the direction is going backwards or forward. Currently it can only go backwards, however with the 'history' implemented in the future, a forward direction could be implemented */
async function navigateFileDirection(path, direction) {

    const newPath = path.substring(0, path.lastIndexOf('/'));

    switch(direction) { // Get the different directions split up
        case 'back': { 
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
