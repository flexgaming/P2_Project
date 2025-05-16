/**
 * This function is used to redirect the user to the workspace page.
 */
async function redirectBack() {
    // Redirect to /workspaces on successful login
    const workspaceResponse = await fetch('/workspaces', { method: 'GET' });
    if (workspaceResponse.ok) {
        window.location.href = workspaceResponse.url;
    } else {
        console.log('Redirect to workspaces failed');
    }
}

// Redirect back to workspaces button
document.getElementById('goback-button').addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page.
    redirectBack();
}); 
