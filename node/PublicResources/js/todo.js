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
    checkbox.id = 'checkbox' + (grid.children.length + 1); // Unique ID for each checkbox

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

let focusedItem = null; // Variable to track the currently focused ToDo item
let lastFocusedItem = null; // Variable to track the last focused ToDo item

// Track the focused textarea
document.addEventListener('focusin', function (event) {
    if (event.target.tagName === 'TEXTAREA') {
        focusedItem = event.target.closest('.todo-item'); // Get the parent .todo-item of the focused textarea
        lastFocusedItem = event.target.closest('.todo-item');
        console.log('Focused Item Set:', focusedItem); // Debugging line
        document.querySelectorAll('.manage-buttons').forEach(button => {
            button.style.visibility = 'visible';
        });
    }
});

// Clear the focused item when focus is lost
document.addEventListener('focusout', function (event) {
    if (event.target.tagName === 'TEXTAREA') {
        setTimeout(() => {
            // Check if the newly focused element is NOT the delete button
            const activeElement = document.activeElement;
            if (!activeElement || (activeElement.tagName !== 'TEXTAREA' && activeElement.id !== 'deleteRowButton')) {
                document.querySelectorAll('.manage-buttons').forEach(button => {
                    button.style.visibility = 'hidden';
                });
                document.getElementById('addRowButton').style.visibility = 'visible';
                focusedItem = null; // Clear the focused item
                console.log('Focused Item Cleared'); // Debugging line
            }
        }, 0);
    }
});

// Delete the currently focused row
document.getElementById('deleteRowButton').addEventListener('click', function () {
    console.log('Delete Button Clicked'); // Debugging line
    if (lastFocusedItem) {
        lastFocusedItem.remove(); // Remove the last focused item from the DOM
        lastFocusedItem = null; // Clear the last focused item
        console.log('Focused Item Deleted'); // Debugging line
    }
});

document.getElementById('moveUpButton').addEventListener('click', function () {
    console.log('Up Button Clicked'); // Debugging line
    }
);