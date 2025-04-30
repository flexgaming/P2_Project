// Function to auto-expand textareas
document.querySelectorAll('.auto-expand').forEach(textarea => {
    textarea.addEventListener('input', function () {
        this.style.height = 'auto'; // Reset height to calculate new height
        this.style.height = `${this.scrollHeight}px`; // Set height to match content
    });
});

// Function to add a new row to the grid
document.getElementById('addRowButton').addEventListener('click', function () {
    const grid = document.querySelector('.todo-grid');
    const newItem = document.createElement('div');
    newItem.id = 'todo-item' + (grid.children.length + 1); // Unique ID for each item
    newItem.className = 'todo-item';

    // Create the checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';

    // Create the textarea
    const textarea = document.createElement('textarea');
    textarea.className = 'auto-expand';
    textarea.rows = 1;
    textarea.placeholder = 'Add a new task...';

    // Add auto-expand functionality to the new textarea
    textarea.addEventListener('input', function () {
        this.style.height = 'auto'; // Reset height to calculate new height
        this.style.height = `${this.scrollHeight}px`; // Set height to match content
    });

    // Append checkbox and textarea to the new item
    newItem.appendChild(checkbox);
    newItem.appendChild(textarea);

    // Append the new item to the grid
    grid.appendChild(newItem);

    // Scroll to the new item
    newItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});


