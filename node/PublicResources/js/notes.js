const note = document.getElementById('note');


note.addEventListener('unfocus', async function(event) {
    event.preventDefault();
    //send note content to the server and save it in the database
    const response = await fetch('/saveNote', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/txt'
        },
        body: note.body.value // Get the note content from the textarea
    });
    console.log(response + '\n');
    if (response.ok) {
        console.log('Note saved successfully!');
    } else {
        console.error('Error saving note:', response.statusText);
    }
});