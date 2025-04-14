// Function to auto-expand textareas
document.querySelectorAll('.auto-expand').forEach(textarea => {
    textarea.addEventListener('input', function() {
        this.style.height = 'auto'; // Reset height to calculate new height
        this.style.height = this.scrollHeight + 'px'; // Set height to match content
    });
});

// Function to add a new row to the table
document.getElementById('addRowButton').addEventListener('click', function() {
    const table = document.getElementById('todoTable');
    const newRow = document.createElement('tr');

    // Create the checkbox cell
    const checkboxCell = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkboxCell.appendChild(checkbox);

    // Create the textarea cell
    const textareaCell = document.createElement('td');
    const textarea = document.createElement('textarea');
    textarea.className = 'auto-expand';
    textarea.style.width = '100%';
    textarea.style.padding = '10px';
    textarea.style.border = 'solid black 2px';
    textarea.style.margin = '5px';
    textarea.style.resize = 'none';
    textarea.rows = 1;
    textarea.placeholder = 'Add a new task...';

    // Add auto-expand functionality to the new textarea
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });

    textareaCell.appendChild(textarea);

    // Append cells to the new row
    newRow.appendChild(checkboxCell);
    newRow.appendChild(textareaCell);

    // Append the new row to the table
    table.appendChild(newRow);

    // Scroll to the new row
    newRow.scrollIntoView({ behavior: 'smooth', aligntobottom: true });
});


