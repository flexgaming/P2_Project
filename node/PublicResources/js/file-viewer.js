
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

