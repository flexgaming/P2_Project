// Select button and sidebar
const toggleButton = document.getElementById('toggle-button');
const sidebar = document.getElementById('sidebar');

toggleButton.addEventListener('click', () => {
    // Toggle the sidebar's visibility
    sidebar.classList.toggle('active');
});