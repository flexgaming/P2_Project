/**
 * Display an error message on the login form.
 * 
 * @param {string} message - The error message to display.
 */
function showError(message) {
    const errorMessage = document.getElementById('error');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block'; // Show error message
}

/**
 * Hash a message using the SHA-256 algorithm.
 * 
 * @param {string} message - The message to hash.
 * @returns {Promise<string>} - A promise that resolves to the hashed message as a hexadecimal string.
 */
async function hashSHA256(message) {
    // Convert the message into a binary array (UTF-8).
    const msgBuffer = new TextEncoder().encode(message);

    // Use the native Web Crypto API to make an ArrayBuffer.
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer); // This is where the magic happens.

    // Convert the ArrayBuffer into a 32-byte binary SHA-256 hash.
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // Convert that array into a hex string.
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Validate the username and password, hash the password, and send the login or registration request. */
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

/**
 * Check if a string is alphanumeric (contains only letters and numbers).
 * 
 * @param {string} str - The string to check.
 * @returns {boolean} - True if the string is alphanumeric, false otherwise.
 */
function isAlphanumeric(str) {
    return /^[a-zA-Z0-9]+$/.test(str);
}
