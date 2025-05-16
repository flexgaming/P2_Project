const note = document.getElementById('note');
const saveButton = document.getElementById('saveButton');
const output = document.getElementById('output');

var isFocused = false; // Flag to track focus state

fetchNote(); // Fetch the note content when the page loads


//4 second recurring interval to initiate uptade or save note, depending on the focus state of the textarea.
setInterval(async function() {
    if (isFocused) {
        saveNote(); // Save the note content if the textarea is focused
    } else {
        fetchNote(); // Fetch the note content if the textarea is not focused
    }
}, 4000); // 4 seconds interval

// Add focus event listener to the textarea
note.addEventListener('focusin', function() {
    fetchNote(); // Fetch the note content when focused
    isFocused = true; // Set the flag to true when focused
});

//Add unfocus event listener to the textarea
note.addEventListener('focusout', function() {
    saveNote(); // Save the note content when unfocused
    isFocused = false; // Set the flag to false when unfocused
    fetchNote(); // Fetch the note content when unfocused
});

// Save button click event
saveButton.addEventListener('click', async function(event) {
    event.preventDefault();
    saveNote(); // Call the saveNote function to save the note content
});

/** Function to fetch the note content from the server and update the textarea
 * 
 * This function is called when the page loads and every 5 seconds if the textarea is not focused.
 */
async function fetchNote() {
    console.log('Fetching note from workspace ' +
        localStorage.getItem('currentWorkspaceId') + '...'); // Log the save action
    // Fetch the note content from the server
    const response = await fetch('/notes/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            workspaceId: localStorage.getItem('currentWorkspaceId'), // Replace with the actual workspace ID
        })
    });

    // Check if the response is OK (status code 200)
    // If the response is not OK, log the error and return
    if (response.ok) {
        const data = await response.json(); // Parse the response data

        if (data.access) {
            console.log('Access granted!'); // Log access granted message
            makeEditable(); // Make the textarea editable if access is granted
        }
        else {
            console.log('Access denied!'); // Log access denied message
            makeReadonly(); // Make the textarea readonly if access is denied
        }

        //console.log('\nnote: ' + data.content); // Log the fetched note content
        note.value = data.content; // Set the textarea value to the fetched note content
        console.log('Note fetched successfully!'); // Log the fetched note content
    } else {
        console.error('Error fetching note:', response.statusText);
    }
}

/** Function to save the note content to the database.
 * 
 *  This function is called when the save button is clicked and every 5 seconds if the textarea is focused.
 */
async function saveNote() {
    console.log('Saving note in workspace ' +
        localStorage.getItem('currentWorkspaceId') + '...'); // Log the save action
    //send note content to the server and save it in the database
    const response = await fetch('/notes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            workspaceId: localStorage.getItem('currentWorkspaceId'), // Replace with the actual workspace ID
            noteContent: note.value // Get the note content from the textarea
        })
    });

    if (response.ok) {  // Check if the response is OK (status code 200)
        makeEditable(); // Make the textarea editable if access is granted
        output.textContent = 'Saved!'; // Display saved message
        console.log('Note saved successfully!');
    } else if (response.status === 403) { // Check if the response status is 403 (Forbidden)
        output.textContent = 'Access denied!'; // Display access denied message
        makeReadonly(); // Make the textarea readonly if access is denied
        console.log('Note access denied!');
    }
    else {
        console.error('Error saving note:', response.statusText);
    }
}

//Function to make textarea readonly.
function makeReadonly() {
    note.blur(); // Remove focus from the textarea
    note.setAttribute('readonly', true); // Set the readonly attribute to true
    note.style.backgroundColor = '#f0f0f0'; // Change the background color to indicate readonly state
}

//Function to make textarea editable.
function makeEditable() {
    note.removeAttribute('readonly'); // Remove the readonly attribute
    note.style.backgroundColor = '#fff'; // Change the background color to indicate editable state
}