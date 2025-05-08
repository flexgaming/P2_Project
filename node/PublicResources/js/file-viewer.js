
/* **************************************************
                    (o)._.(o)
   ************************************************** */

/* const publicResources = '/node/PublicResources/Files/'; // Change to '../PublicResources/Files/' on Ubuntu.
const rootFileSystem = process.cwd(); // The path to the project (P2_Project). */

// TEST: - Lortet virker ikke
function FileTesting(path) {
    console.log("HELLO?")
    const folderPath = `${path}`;
    fs.readdirSync(folderPath);

    console.log(fs.readdirSync(folderPath));
}
console.log("Hello?????");
document.getElementById('fileTester').addEventListener('click', FileTesting('C:/Users/Emil/.ssh/'));


// Navigate the file path
/** Navigate the file path - in the future it would go more than one direction and implement a 'history'.
 * @param {*} path is the path that you currently are on and is used for going backwards.
 * @param {back} direction is used for whether the direction is going backwards or forward. Currently it can only go backwards, however with the 'history' implemented in the future, a forward direction could be implemented */
async function navigateFileDirection(path, direction) {
    console.log(path); // Test

    let pathElements = path.split('/'); // Splits at every /, turning the pathname into an array; example[] = {['This'],['is'],['an'],['example']}
    let count = pathElements.length; // Get how many elements there are in the current path. example

    let newPath; // Get the new path.
    for (let i = 0; i - 1 < count; i++) {
        newPath += path.join(pathElements[i]);
    }

    switch(direction) {
        case 'back': {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'text/txt' },
                body: newPath
            });


            break;
        }
        default: {
            console.log('Default was hit in navigateFileDirection');
            break;
        }

    }
}
