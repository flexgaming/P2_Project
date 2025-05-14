/**
 * Fix the height of textareas with the class 'auto-expand'.
 */
function fixTextAreaHeight() {
    document.querySelectorAll('.auto-expand').forEach(textarea => {
        textarea.style.height = 'auto'; // Reset height to calculate new height
        textarea.style.height = `${textarea.scrollHeight}px`; // Set height to match content
    });
}

/**
 * Class representing a ToDo item.
 */
class ToDoItem {
    /**
     * Create a ToDo item.
     * @param {number} id - The ID of the ToDo item.
     */
    constructor(id) {
        this.id = id;
        this.element = this.createToDoItem(); // Create the ToDo item element
    }

    /**
     * Create the HTML element for the ToDo item.
     * @returns {HTMLElement} - The created ToDo item element.
     */
    createToDoItem() {
        const newItem = document.createElement('div');
        newItem.id = `todo-item${this.id}`; // Assign a unique ID
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

        return newItem; // Return the created element
    }
}

/**
 * Add a new row with data from the database or create a blank row.
 * 
 * @param {number|null} id - The ID of the ToDo item (null for a new item).
 * @param {string} content - The content of the ToDo item.
 * @param {boolean} checked - Whether the ToDo item is checked.
 */
function addRow(id = null, content = '', checked = false) {
    const grid = document.querySelector('.todo-grid');

    // Create a new ToDo item
    const newToDoItem = new ToDoItem(id);

    // Set the content of the textarea
    const textarea = newToDoItem.element.querySelector('textarea');
    textarea.value = content;

    // Set the checkbox state
    const checkbox = newToDoItem.element.querySelector('input[type="checkbox"]');
    checkbox.checked = checked;

    // Insert the new item into the grid
    grid.appendChild(newToDoItem.element);

    fixTextAreaHeight(); // Adjust the height of the textarea
    console.log(`Row added: ID=${id}, Content=${content}, Checked=${checked}`);
}

// Variables to track the focused and last focused ToDo items
let focusedItem = null;
let lastFocusedItem = null;

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

// Variable to track the cooldown state for syncing
let syncCooldown = false;

// Function to handle hover and trigger syncTodos with cooldown
async function handleHoverWithCooldown() {
    if (!syncCooldown) {
        await updateTodo(); // Call updateTodo function to save changes
        const workspaceId = localStorage.getItem('currentWorkspaceId'); // Retrieve the workspace ID
        await syncTodos(workspaceId); // Call syncTodos function
        syncCooldown = true; // Set cooldown state
        fixTextAreaHeight(); // Adjust textarea height

        // Reset cooldown after 2 seconds
        setTimeout(() => {
            syncCooldown = false;
        }, 2000);
    }
}

// Add hover event listeners to the manage buttons and each ToDo item
['addRowButton', 'moveUpButton', 'moveDownButton', 'deleteFocusedRowButton'].forEach(buttonId => {
    const button = document.getElementById(buttonId);
    button.addEventListener('mouseover', handleHoverWithCooldown);
});

// Add hover event listeners to each ToDo item
document.addEventListener('mouseover', function (event) {
    if (event.target.closest('.todo-item')) {
        handleHoverWithCooldown();
    }
});

// Track the focused textarea
document.addEventListener('focusin', function (event) {
    if (event.target.tagName === 'TEXTAREA') {
        updateTodo(); // Save changes to the previously focused item

        focusedItem = event.target.closest('.todo-item'); // Get the parent .todo-item of the focused textarea
        lastFocusedItem = focusedItem;
        console.log('Focused Item Set:', focusedItem); // Debugging line

        // Show the manage buttons
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
                    updateTodo(); // Save changes to the unfocused item
                }
            }
        }, 0); // Delay to allow button click to register
    }
});

// Function to hide the buttons and clear the focused item
function hideButtons() {
    document.querySelectorAll('.manage-buttons').forEach(button => {
        button.style.visibility = 'hidden';
    });
    document.getElementById('addRowButton').style.visibility = 'visible';
    focusedItem = null; // Clear the focused item
    console.log('Focused Item Cleared'); // Debugging line
}

/**
 * Fetch and load ToDo items when the HTML is loaded.
 */
document.addEventListener('DOMContentLoaded', async function () {
    const workspaceId = parseInt(localStorage.getItem('currentWorkspaceId'), 10); // Retrieve the workspaceId
    console.log('Workspace ID:', workspaceId); // Debugging line
    if (workspaceId) {
        await getTodos(workspaceId); // Load ToDo items for the correct workspace
    } else {
        console.error('Workspace ID is missing.');
    }
});

// Update the ToDo item when the checkbox is clicked
document.addEventListener('change', function (event) {
    console.log('Checkbox changed:', event.target); // Debugging line
    if (event.target.tagName === 'INPUT' && event.target.type === 'checkbox') {
        lastFocusedItem = event.target.closest('.todo-item'); // Get the parent .todo-item of the checkbox

        // Save the updated checkbox state
        updateTodo();
    }
});

// Add a new ToDo item when the addRowButton is clicked
document.getElementById('addRowButton').addEventListener('click', async function () {
    const workspaceId = localStorage.getItem('currentWorkspaceId'); // Retrieve the workspace ID
    if (!workspaceId) {
        console.error('Workspace ID is missing.');
        return;
    }
    await addTodo(workspaceId); // Pass the workspace ID
    lastFocusedItem = document.querySelector('.todo-item:last-child'); // Get the last added item
    focusOnLastItem(); // Focus on the last added item
});

// Delete the currently focused ToDo item
document.getElementById('deleteFocusedRowButton').addEventListener('click', async function () {
    deleteTodo(); // Delete the focused ToDo item
});

// Move the focused ToDo item up
document.getElementById('moveUpButton').addEventListener('click', async function () {
    swapPosTodos('up'); // Move the focused item up
});

// Move the focused ToDo item down
document.getElementById('moveDownButton').addEventListener('click', async function () {
    swapPosTodos('down'); // Move the focused item down
});

// Function to fetch ToDo items from the server and add them to the list
async function getTodos(workspaceId) {
    try {
        const response = await fetch('/todo/fetch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspace_id: workspaceId }) // Workspace ID
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const todoData = await response.json();
        console.log("Todo's count:", todoData.length); // Debugging line

        for (let i = 0; i < todoData.length; i++) {
            addRow(todoData[i].todo_element_id, todoData[i].text, todoData[i].checked);
        }

        console.log(todoData); // Debugging line
    } catch (error) {
        console.error('Error loading ToDo items:', error);
    }
}

/**
 * Add a new ToDo item to the database and UI.
 * 
 * @param {number} workspaceId - The ID of the workspace to which the ToDo item belongs.
 * @returns {Promise<void>} - A promise that resolves when the ToDo item is added.
 */
async function addTodo(workspaceId) {
    try {
        const response = await fetch('/todo/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspace_id: workspaceId }) // Workspace ID
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const newTodoId = await response.json(); // Parse the response as JSON
        // Add the new item to the UI
        addRow(newTodoId, '', false);
        console.log('ToDo item added successfully!'); // Debugging line
    } catch (error) {
        console.error('Error adding ToDo item:', error);
    }
}

/**
 * Delete the currently focused ToDo item.
 * 
 * @returns {Promise<void>} - A promise that resolves when the ToDo item is deleted.
 */
async function deleteTodo() {
    const todoId = focusedItem.id.replace('todo-item', ''); // Extract the ID of the focused item

    try {
        const response = await fetch('/todo/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ todo_id: todoId }) // Send the ID to the server
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

/**
 * Update the currently focused ToDo item in the database.
 * 
 * @returns {Promise<void>} - A promise that resolves when the ToDo item is updated.
 */
async function updateTodo() {
    const todoId = lastFocusedItem.id.replace('todo-item', ''); // Extract the ID of the last focused item
    const textarea = lastFocusedItem.querySelector('textarea');
    const checkbox = lastFocusedItem.querySelector('input[type="checkbox"]');

    try {
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
    } catch (error) {
        console.error('Error updating ToDo item:', error);
    }
}

/**
 * Swap the position of the currently focused ToDo item with its sibling.
 * 
 * @param {string} direction - The direction to move the ToDo item ('up' or 'down').
 * @returns {Promise<void>} - A promise that resolves when the positions are swapped.
 */
async function swapPosTodos(direction) {
    const todoId = focusedItem.id.replace('todo-item', ''); // Get the ID of the focused item
    const sibling = direction === 'up' ? focusedItem.previousElementSibling : focusedItem.nextElementSibling;

    if (!sibling) {
        // Refocus the textarea of the moved item
        const textarea = focusedItem.querySelector('textarea');
        textarea.focus();
        focusedItem = lastFocusedItem; // Update the focused item to the moved one
        return;
    }

    const siblingId = sibling.id.replace('todo-item', ''); // Get the ID of the sibling item

    try {
        const response = await fetch('/todo/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
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

// Function to sync the database with the current state of the ToDo items
async function syncTodos(workspaceId) {
    try {
        const response = await fetch('/todo/fetch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspace_id: workspaceId }) // Send the workspace ID to the server
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const todoData = await response.json();
        console.log('Fetched ToDo items from the database:', todoData); // Debugging line

        const grid = document.querySelector('.todo-grid');
        const currentItems = Array.from(grid.children);

        // Update existing items or add new ones if needed
        for (let i = 0; i < todoData.length; i++) {
            if (i < currentItems.length) {
                // Update existing item
                const existingItem = currentItems[i];
                const textarea = existingItem.querySelector('textarea');
                const checkbox = existingItem.querySelector('input[type="checkbox"]');
                textarea.value = todoData[i].text;
                checkbox.checked = todoData[i].checked;
            } else {
                // Add new item
                addRow(todoData[i].todo_element_id, todoData[i].text, todoData[i].checked);
            }
        }

        // Remove extra items if there are too many
        while (currentItems.length > todoData.length) {
            const extraItem = currentItems.pop();
            extraItem.remove();
        }

        if (focusedItem) {
            focusOnLastItem(); // Refocus on the last focused item
        }

        console.log('UI synced with the database successfully!');
    } catch (error) {
        console.error('Error syncing ToDo items:', error);
    }
}

// Function to refocus on the last focused item
function focusOnLastItem() {
    if (lastFocusedItem) {
        const todoId = lastFocusedItem.id.replace('todo-item', '');
        const textarea = document.querySelector(`#todo-item${todoId} textarea`);
        textarea.focus();
    }
}