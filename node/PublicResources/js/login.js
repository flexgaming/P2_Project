// Function to handle incorrect input and show error message
function showError(message){
    event.preventDefault(); // Prevent form submission
    const errorMessage = document.getElementById('error');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block'; // Show error message
}

// JavaScript for input validation
document.getElementById('loginForm').addEventListener('submit', function(event) {

    // Get input values
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    // Simple validation logic
    if (username.length < 3) { 	
        showError('Username must be at least 3 characters long!');
    } else if (username.length > 50){
        showError('Username can max be 50 characters long!');
    } else if (password.length < 6) {
        showError('Password must be at least 6 characters long!');
    } else if (password.length > 50) {
        showError('Password can max be 50 characters long!');
    } else {
        // Optionally, hide error message if inputs are valid
        document.getElementById('error').style.display = 'none';
    }
});