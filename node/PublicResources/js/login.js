// Function to handle incorrect input and show error message
function showError(message) {
/*     event.preventDefault(); // Prevent form submission */
    const errorMessage = document.getElementById('error');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block'; // Show error message
}

async function hashSHA256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// JavaScript for input validation and password hashing
document.getElementById('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent default form submission

    // Get input values
    const username = document.getElementById('username').value.trim();
    const passwordRaw = document.getElementById('password').value.trim();

    // Simple validation logic
    if (username.length < 3) {
        showError('Username must be at least 3 characters long!');
        return;
    } else if (username.length > 50) {
        showError('Username can max be 50 characters long!');
        return;
    } else if (passwordRaw.length < 6) {
        showError('Password must be at least 6 characters long!');
        return;
    } else if (passwordRaw.length > 50) {
        showError('Password can max be 50 characters long!');
        return;
    } else if (!isAlphanumeric(username) || !isAlphanumeric(passwordRaw)) {
        showError('Username and Password must only contain letters and numbers!');
        return;
    }

    // If validation passes, hash the password
    const password = await hashSHA256(passwordRaw);

    // Hide error message if inputs are valid
    document.getElementById('error').style.display = 'none';

    // Determine which button was clicked
    const clickedButton = event.submitter.id; // Get the ID of the button that triggered the form submission
    let endpoint = '/' + clickedButton; // Example: /login or /register.
    
    // Send the request to the appropriate endpoint
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    
    if (response.ok) {
            // Redirect to /workspaces on successful login
            const workspaceResponse = await fetch('/workspaces', { method: 'GET' });
            if (workspaceResponse.ok) {
                window.location.href = workspaceResponse.url;
            } else {
                console.log('Redirect to workspaces failed');
            }
    } else {
        const errorText = await response.text();
        showError(errorText);
    }
});

function isAlphanumeric(str) {
    return /^[a-zA-Z0-9]+$/.test(str);
}