const note = document.getElementById('note');


note.addEventListener('unfocus', async function(event) {
    event.preventDefault();

    // Save the note content to local storage when it loses focus
    localStorage.setItem('noteContent', note.value);
    //send note content to the server and save it in the database
    const response = await fetch('/saveNote', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ noteContent: note.value })
    });
    
});