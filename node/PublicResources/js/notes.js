const note = document.getElementById('note');
const saveButton = document.getElementById('saveButton');
const output = document.getElementById('output');
console.log('Note element:');

fetchNote(); // Fetch the note content when the page loads

// Save button click event
saveButton.addEventListener('click', async function(event) {
    event.preventDefault();
    output.textContent = 'Saved!';

    //send note content to the server and save it in the database
    const response = await fetch('/saveNote', {
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
});


async function fetchNote() {
    // Fetch the note content from the server
    const response = await fetch('/getNote', {
        method: 'POST',
        headers: { 'Content-Type': 'text/txt' }
    });

    if (response.ok) {
        const noteContent = await response.text();
        note.value = noteContent; // Set the textarea value to the fetched note content
    } else {
        console.error('Error fetching note:', response.statusText);
    }
}