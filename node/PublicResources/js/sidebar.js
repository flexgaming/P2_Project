/**
 * Initialize the sidebar functionality when the DOM content is fully loaded.
 */
document.addEventListener("DOMContentLoaded", () => {
    // Get references to the sidebar and buttons
    const sidebar = document.getElementById("sidebar"); // The sidebar element
    const toggleButton = document.getElementById("toggle-button"); // Button to toggle the sidebar
    const openChatButton = document.getElementById("open-chat"); // Button to open the chat

    /**
     * Add a click event listener to the toggle button.
     * Toggles the visibility of the sidebar and adjusts button positions accordingly.
     */
    toggleButton.addEventListener("click", () => {
        // Toggle the "active" class on the sidebar to show/hide it
        sidebar.classList.toggle("active");

        // Adjust the positions of the buttons based on the sidebar's visibility
        if (sidebar.classList.contains("active")) {
            // Sidebar is visible
            toggleButton.style.right = "25.5%"; // Align the toggle button with the sidebar
            openChatButton.style.right = "calc(25.5% + 80px)"; // Position the chat button to the left of the toggle button
        } else {
            // Sidebar is hidden
            toggleButton.style.right = "10px"; // Reset the toggle button to its default position
            openChatButton.style.right = "90px"; // Reset the chat button to its default position
        }
    });
});

