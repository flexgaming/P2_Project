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
                    updateTodo() // Call updateTodo function to save changes
                }
            }
        }, 0); // Delay to allow button click to register
    }
});

function hideButtons() {
    document.querySelectorAll('.manage-buttons').forEach(button => {
        button.style.visibility = 'hidden';
    });
    document.getElementById('addRowButton').style.visibility = 'visible';
    focusedItem = null; // Clear the focused item
    console.log('Focused Item Cleared'); // Debugging line
}

// debug button to fetch ToDo items
document.getElementById('fetchButton').addEventListener('click', async function () {
    getTodos(); // Call getTodos function to load ToDo items
});

// Function to fetch and load ToDo items when the HTML is loaded
document.addEventListener('DOMContentLoaded', async function () {
    getTodos(); // Call getTodos function to load ToDo items
});

document.getElementById('addRowButton').addEventListener('click', async function () {
    addTodo(); // Call addTodo function to add ToDo items
});

document.getElementById('deleteFocusedRowButton').addEventListener('click', async function () {
    deleteTodo(); // Call deleteTodo function to delete ToDo items 
});

document.getElementById('moveUpButton').addEventListener('click', async function () {
    swapPosTodos('up'); // Call swapPosTodos function to move ToDo items
});

document.getElementById('moveDownButton').addEventListener('click', async function () {
    swapPosTodos('down'); // Call swapPosTodos function to move ToDo items
});


// Function to fetch ToDo items from the server and add them to the list
async function getTodos(req, res) {
    try {
        const response = await fetch('/todo/fetch', {
            method: 'POST',
            headers: { 'Content-Type': 'text/txt' },
            body: '1'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const todoData = await response.json();
        console.log(todoData.length); // Debugging line

        for (let i = 0; i < todoData.length; i++) {
            addRow(todoData[i].position, todoData[i].id, todoData[i].text, todoData[i].checked);
        }

        console.log(todoData); // Debugging line
    } catch (error) {
        console.error('Error loading ToDo items:', error);
    }
}

async function addTodo() {
    try {
        const response = await fetch('/todo/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspace_id: 1 }) // Replace with the actual workspace ID
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const newTodo = await response.json();
        addRow(null, newTodo.todo_id, '', false); // Add a blank row with the new ID
        console.log('ToDo item added successfully!');
    } catch (error) {
        console.error('Error adding ToDo item:', error);
    }
}

async function deleteTodo() {
    if (!focusedItem) return;

    const todoId = focusedItem.id.replace('todo-item', '');

    try {
        const response = await fetch('/todo/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspace_id: 1, todo_id: todoId }) // Replace with the actual workspace ID
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        focusedItem.remove(); // Remove the item from the UI
        focusedItem = null;
        console.log('ToDo item deleted successfully!');
    } catch (error) {
        console.error('Error deleting ToDo item:', error);
    }
}

async function updateTodo() {
    if (!focusedItem) return;

    const todoId = focusedItem.id.replace('todo-item', '');
    const textarea = focusedItem.querySelector('textarea');
    const checkbox = focusedItem.querySelector('input[type="checkbox"]');

    try {
        // Update the selected ToDo item in the database
        const response = await fetch('/todo/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                todo_id: todoId,
                content: textarea.value,
                checked: checkbox.checked
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('ToDo item updated successfully!');

        // Clear all ToDo items from the UI
        const grid = document.querySelector('.todo-grid');
        while (grid.firstChild) {
            grid.removeChild(grid.firstChild);
        }

        // Fetch all ToDo items from the database and re-render them
        await getTodos();

    } catch (error) {
        console.error('Error updating ToDo item:', error);
    }
}

async function swapPosTodos(direction) {
    if (!focusedItem) return;

    const todoId = focusedItem.id.replace('todo-item', '');
    const sibling = direction === 'up' ? focusedItem.previousElementSibling : focusedItem.nextElementSibling;

    if (!sibling) return;

    const siblingId = sibling.id.replace('todo-item', '');

    try {
        const response = await fetch('/todo/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                workspace_id: 1, // Replace with the actual workspace ID
                todo_id1: todoId,
                todo_id2: siblingId
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Swap the items in the UI
        if (direction === 'up') {
            focusedItem.parentNode.insertBefore(focusedItem, sibling);
        } else {
            sibling.parentNode.insertBefore(sibling, focusedItem);
        }

        // Refocus the textarea of the moved item
        const textarea = focusedItem.querySelector('textarea');
        textarea.focus();
        focusedItem = lastFocusedItem; // Update the focused item to the moved one

        console.log('ToDo items swapped successfully!');
    } catch (error) {
        console.error('Error swapping ToDo items:', error);
    }
}