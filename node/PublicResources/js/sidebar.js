document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("sidebar");
    const toggleButton = document.getElementById("toggle-button");
    const openChatButton = document.getElementById("open-chat");

    toggleButton.addEventListener("click", () => {
        sidebar.classList.toggle("active");

        // Adjust button positions based on sidebar visibility
        if (sidebar.classList.contains("active")) {
            toggleButton.style.right = "25.5%"; // Align with the sidebar
            openChatButton.style.right = "calc(25.5% + 80px)"; // Position to the left of the toggle button
        } else {
            toggleButton.style.right = "10px"; // Reset to default position
            openChatButton.style.right = "90px"; // Reset to default position
        }
    });
});

