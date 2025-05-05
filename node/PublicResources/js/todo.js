
// Function to auto-expand textareas
document.querySelectorAll('.auto-expand').forEach(textarea => {
    textarea.addEventListener('input', function () {
        this.style.height = 'auto'; // Reset height to calculate new height
        this.style.height = `${this.scrollHeight}px`; // Set height to match content
    });
});

// Class to represent a ToDo item
class ToDoItem {
    constructor(id) {
        this.id = id;
        this.element = this.createToDoItem();
    }

    // Method to create a ToDo item element
    createToDoItem() {
        const newItem = document.createElement('div');
        newItem.id = `todo-item${this.id}`;
        newItem.className = 'todo-item';

        // Create the checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `checkbox${this.id}`;

        // Create the textarea
        const textarea = document.createElement('textarea');
        textarea.className = 'auto-expand';
        textarea.id = `todo-text${this.id}`;
        textarea.rows = 1;
        textarea.placeholder = 'Add a new task...';

        // Add auto-expand functionality to the textarea
        textarea.addEventListener('input', function () {
            this.style.height = 'auto'; // Reset height to calculate new height
            this.style.height = `${this.scrollHeight}px`; // Set height to match content
        });

        // Append checkbox and textarea to the new item
        newItem.appendChild(checkbox);
        newItem.appendChild(textarea);

        return newItem;
    }
}

// Function to add a new row to the grid
document.getElementById('addRowButton').addEventListener('click', function () {
    addRow(); // Call addRow function to add a new row
});

// Function to add a new row with data from the database or create a blank row
function addRow(position = null, id = null, content = '', checked = false) {
    const grid = document.querySelector('.todo-grid');

    // Generate a unique ID if none is provided
    if (id === null) {
        id = grid.children.length + 1;
    }

    // Create a new ToDo item
    const newToDoItem = new ToDoItem(id);

    // Set the content of the textarea
    const textarea = newToDoItem.element.querySelector('textarea');
    textarea.value = content;

    // Set the checkbox state
    const checkbox = newToDoItem.element.querySelector('input[type="checkbox"]');
    checkbox.checked = checked;

    // Insert the new item at the specified position or append to the end
    if (position === null || position >= grid.children.length) {
        // Append to the end if no position is specified or position is out of bounds
        grid.appendChild(newToDoItem.element);
    } else {
        // Insert at the specified position
        const referenceNode = grid.children[position];
        grid.insertBefore(newToDoItem.element, referenceNode);
    }

    // Scroll to the new item
    newToDoItem.element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Focus on the textarea of the new item
    textarea.focus();

    console.log(`Row added: Position=${position}, ID=${id}, Content=${content}, Checked=${checked}`);
}

let focusedItem = null; // Variable to track the currently focused ToDo item
let lastFocusedItem = null; // Variable to track the last focused ToDo item

// Track if the mouse is hovering over any of the manage buttons
let isHoveringOverButton = false;

// Add mouseover and mouseout event listeners for the buttons
['moveUpButton', 'moveDownButton', 'deleteFocusedRowButton'].forEach(buttonId => {
    const button = document.getElementById(buttonId);
    button.addEventListener('mouseover', () => {
        isHoveringOverButton = true; // Mouse is over the button
    });
    button.addEventListener('mouseout', () => {
        isHoveringOverButton = false; // Mouse has left the button
    });
});

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
            const activeElement = document.activeElement; // Get the currently focused element
            if (
                !activeElement || // No active element
                activeElement.tagName !== 'TEXTAREA' // The new focus is not on another textarea
            ) {
                // Only hide buttons if the new focus is not on another textarea
                if (!isHoveringOverButton) {
                    hideButtons();
                }
            }
        }, 0); // Delay to allow button click to register
    }
});

// Delete the currently focused row
document.getElementById('deleteFocusedRowButton').addEventListener('click', function () {
    console.log('Delete Button Clicked'); // Debugging line
    if (lastFocusedItem) { // Check if the last focused item is null or not
        lastFocusedItem.remove(); // Remove the last focused item from the DOM
        lastFocusedItem = null; // Clear the last focused item
        console.log('Focused Item Deleted'); // Debugging line
        hideButtons(); // Hide buttons after deletion
    }
    
});

document.getElementById('moveUpButton').addEventListener('click', function () {
    console.log('Up Button Clicked'); // Debugging line
        
    }
);

document.getElementById('moveDownButton').addEventListener('click', function () {
    console.log('Down Button Clicked'); // Debugging line
    }
);

function hideButtons() {
    document.querySelectorAll('.manage-buttons').forEach(button => {
        button.style.visibility = 'hidden';
    });
    document.getElementById('addRowButton').style.visibility = 'visible';
    focusedItem = null; // Clear the focused item
    console.log('Focused Item Cleared'); // Debugging line
}

document.getElementById('fetchButton').addEventListener('click', function () {
    
    }
);