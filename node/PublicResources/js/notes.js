const note = document.getElementById('note');
const saveButton = document.getElementById('saveButton');
const output = document.getElementById('output');
console.log('Note element:');

var isFocused = false; // Flag to track focus state

//5 second recurring interval to initiate uptade or save note, depending on the focus state of the textarea.
setInterval(async function() {
    if (isFocused) {
        saveNote(); // Save the note content if the textarea is focused
    } else {
        fetchNote(); // Fetch the note content if the textarea is not focused
    }
}, 5000); // 5 seconds interval

fetchNote(); // Fetch the note content when the page loads

// Add focus event listener to the textarea
note.addEventListener('focus', function() {
    isFocused = true; // Set the flag to true when focused
});

//Add unfocus event listener to the textarea
note.addEventListener('blur', function() {
    isFocused = false; // Set the flag to false when unfocused
});

// Save button click event
saveButton.addEventListener('click', async function(event) {
    event.preventDefault();
    output.textContent = 'Saved!';

    saveNote(); // Call the saveNote function to save the note content
});

/** Function to fetch the note content from the server and update the textarea
 * 
 * This function is called when the page loads and every 5 seconds if the textarea is not focused.
 */
async function fetchNote() {
    // Fetch the note content from the server
    const response = await fetch('/notes/get', {
        method: 'POST',
        headers: { 'Content-Type': 'text/txt' }
    });

    if (response.ok) {
        const noteContent = await response.text();
        note.value = noteContent; // Set the textarea value to the fetched note content
        console.log('Note fetched successfully!');
    } else {
        console.error('Error fetching note:', response.statusText);
    }
}

/** Function to save the note content to the database.
 * 
 *  This function is called when the save button is clicked and every 5 seconds if the textarea is focused.
 */
async function saveNote() {
    //send note content to the server and save it in the database
    const response = await fetch('/notes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'text/txt' },
        body: note.value // Get the note content from the textarea
    });
    console.log(response + '\n');
    if (response.ok) {
        console.log('Note saved successfully!');
    } else {
        console.error('Error saving note:', response.statusText);
    }
}