// DOM Elements
const inputfieldWorkspaceName = document.getElementById("workspace-name");
const inputfieldWorkspaceType = document.getElementById("workspace-type");
const newWorkspaceSubmit = document.getElementById("add-new-workspace-form");
const workspaceContainer = document.getElementById("workspace-container");
const closeAddNew = document.getElementById("closeAddNew");
const openAddNew = document.getElementById("openAddNew");
const modal = document.getElementById("modal");
const manageWorkspacesButton = document.getElementById("manage-button");

// State Variables
let manageWorkspacesActive = false;

function toggleClass(elements, className, add) {
    for (const element of elements) {
        element.classList.toggle(className, add);
    }
}

// Workspace Functions
function createWorkspace(name, type, workspaceID, checkedCount = '0/0') {
    const workspace = document.createElement('div');
    workspace.className = 'workspace-element';
    workspace.id = `workspace-element-id-${workspaceID}`; // Use the database-generated ID

    // Delete Button
    const deleteButton = createDeleteButton(workspace.id);

    // Workspace Name
    const workspaceName = document.createElement('h2');
    workspaceName.className = "workspace-name";
    workspaceName.textContent = name;

    // Rename Form
    const renameForm = createRenameForm(workspace.id);

    // Workspace Type
    const workspaceType = document.createElement('p');
    workspaceType.className = "workspace-type";
    workspaceType.textContent = "Workspace type: " + type;

    // Todo Checked Count
    const todoCheckedCount = document.createElement('p');
    todoCheckedCount.className = "todo-checked-count";
    todoCheckedCount.textContent = `${checkedCount} Todo's completed`;

    // Clickable Overlay
    const clickOverlay = document.createElement('div');
    clickOverlay.className = "click-workspace-overlay";
    clickOverlay.onclick = () => workspaceClicked(workspace.id); // Pass the workspace ID

    // Append Elements
    workspace.append(deleteButton, workspaceName, renameForm, workspaceType, todoCheckedCount, clickOverlay);
    return workspace;
}

function createDeleteButton(workspaceID) {
    const button = document.createElement('button');
    button.className = "delete-workspace-button close-button hide";
    button.type = "button";
    button.textContent = "x";
    button.onclick = () => deleteWorkspace(workspaceID);
    return button;
}

function createRenameForm(workspaceID) {
    const form = document.createElement('form');
    form.action = "/workspaces";
    form.className = "workspace-rename-form hide";

    const input = document.createElement('input');
    input.type = "text";
    input.className = "workspace-rename-input";

    // Add an event listener for the "Enter" key
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent form submission
            renameWorkspaceElement(workspaceID); // Trigger the rename logic
        }
    });

    const button = document.createElement('button');
    button.type = "button";
    button.className = "workspace-rename-button";
    button.textContent = "Submit";
    button.onclick = () => renameWorkspaceElement(workspaceID);

    form.append(input, button);
    return form;
}

/**
 * Delete a workspace from the project and remove it from the UI.
 * 
 * @param {string} workspaceID - The ID of the workspace to be deleted.
 * @returns {Promise<void>} - A promise that resolves when the workspace is deleted.
 */
async function deleteWorkspace(workspaceID) {
    const numericWorkspaceID = workspaceID.replace('workspace-element-id-', '');

    try {
        const response = await fetch('/workspace/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspace_id: numericWorkspaceID })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const workspace = document.getElementById(workspaceID);
        if (workspace) workspace.remove();
        console.log('Workspace deleted successfully!');
    } catch (error) {
        console.error('Error deleting workspace:', error);
    }
}

/**
 * Rename a workspace and update its name in the UI and database.
 * 
 * @param {string} workspaceID - The ID of the workspace to be renamed.
 * @returns {Promise<void>} - A promise that resolves when the workspace is renamed.
 */
async function renameWorkspaceElement(workspaceID) {
    const workspace = document.getElementById(workspaceID);
    const workspaceName = workspace.querySelector(".workspace-name");
    const renameInput = workspace.querySelector(".workspace-rename-input");

    // Update the workspace name in the UI
    workspaceName.textContent = renameInput.value;

    // Extract the numeric part of the workspace ID
    const numericWorkspaceID = workspaceID.replace('workspace-element-id-', '');

    try {
        // Send the updated name to the server
        const response = await fetch('/workspace/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                workspace_id: numericWorkspaceID,
                name: renameInput.value
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('Workspace renamed successfully!');
    } catch (error) {
        console.error('Error renaming workspace:', error);
    }

    // Toggle out of managing workspaces
    if (manageWorkspacesActive) {
        toggleManageWorkspaces();
    }
}

// Modal Functions
function toggleModal(show) {
    modal.classList.toggle("show-modal", show);
}

function hideClickableWorkspaces(hide) {
    const clickableWorkspaces = document.getElementsByClassName("click-workspace-overlay");
    toggleClass(clickableWorkspaces, "hide", hide);
}

// Manage Workspaces Functions
function toggleManageWorkspaces() {
    manageWorkspacesActive = !manageWorkspacesActive;
    showManageWorkspacesElements(manageWorkspacesActive);
    hideClickableWorkspaces(manageWorkspacesActive);
}

function showManageWorkspacesElements(show) {
    const deleteButtons = document.getElementsByClassName("delete-workspace-button");
    const renameForms = document.getElementsByClassName("workspace-rename-form");
    const workspaceNames = document.getElementsByClassName("workspace-name");
    const workspaceElements = document.getElementsByClassName("workspace-element");

    for (let i = 0; i < workspaceElements.length; i++) {
        const workspaceTypeElement = workspaceElements[i].querySelector(".workspace-type");
        const workspaceType = workspaceTypeElement.textContent.replace("Workspace type: ", "").trim().toLowerCase();

        if (workspaceType === 'files') {
            deleteButtons[i].classList.add("hide");
        } else {
            deleteButtons[i].classList.toggle("hide", !show);
        }

        renameForms[i].classList.toggle("hide", !show);
        workspaceNames[i].classList.toggle("hide", show);

        if (show) {
            const renameInput = renameForms[i].querySelector(".workspace-rename-input");
            renameInput.value = workspaceNames[i].textContent;
        }
    }
}

// Event Listeners
openAddNew.addEventListener("click", () => toggleModal(true));
closeAddNew.addEventListener("click", () => toggleModal(false));
window.addEventListener("click", (e) => {
    if (e.target === modal) toggleModal(false);
});

manageWorkspacesButton.addEventListener("click", toggleManageWorkspaces);

newWorkspaceSubmit.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = inputfieldWorkspaceName.value;
    const type = inputfieldWorkspaceType.value;

    if (name && type) {
        addWorkspace(1, name, type); // Call the server-side add function
        inputfieldWorkspaceName.value = '';
        inputfieldWorkspaceType.value = '';
        toggleModal(false);
    } else {
        alert("Please provide both a name and type for the workspace.");
    }
});

// Workspace Click Handler
function workspaceClicked(workspaceID) {
    const numericWorkspaceID = workspaceID.replace('workspace-element-id-', '');
    console.log(`Workspace clicked! ID: ${numericWorkspaceID}`);
    localStorage.setItem('currentWorkspaceId', numericWorkspaceID);

    const workspaceElement = document.getElementById(workspaceID);
    if (!workspaceElement) {
        console.error(`Workspace element with ID ${workspaceID} not found.`);
        return;
    }

    const workspaceTypeElement = workspaceElement.querySelector(".workspace-type");
    const workspaceType = workspaceTypeElement.textContent.replace("Workspace type: ", "").trim().toLowerCase();

    if (workspaceType === 'notes') {
        window.location.href = '/notes';
    } else if (workspaceType === 'files') {
        window.location.href = '/file-viewer';
    } else if (workspaceType === 'videochat') {
        window.location.href = '/videochat';
    } else if (workspaceType === 'whiteboard') {
        window.location.href = '/whiteboard';
    } else {
        console.error(`Unknown workspace type: ${workspaceType}`);
    }
}

/**
 * Fetch all workspaces for a given project and render them in the UI.
 * 
 * @param {number} projectId - The ID of the project whose workspaces are to be fetched.
 * @returns {Promise<void>} - A promise that resolves when the workspaces are fetched and rendered.
 */
async function fetchWorkspaces(projectId) {
    try {
        const response = await fetch('/workspace/fetchall', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_id: projectId })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const workspaces = await response.json();

        // Filter workspaces to only include 'notes' and 'files'
        const visibleWorkspaces = workspaces.filter(workspace => 
            workspace.type === 'notes' || workspace.type === 'files' || workspace.type === 'videochat' || workspace.type === 'whiteboard'
        );

        // Render only the filtered workspaces
        for (const workspace of visibleWorkspaces) {
            try {
            const todoCount = await fetchTodoCount(workspace.workspace_id);
            let checkedCountString;
            if (todoCount.total_count === '0') {
                checkedCountString = '0/0'; // Default value if not provided
            } else {
                checkedCountString = `${todoCount.checked_count}/${todoCount.total_count}`;
            }
            const newWorkspace = createWorkspace(workspace.name, workspace.type, workspace.workspace_id, checkedCountString);
            workspaceContainer.appendChild(newWorkspace);
            } catch (error) {
            console.error(`Error processing workspace ID ${workspace.workspace_id}:`, error);
            }
        }
    } catch (error) {
        console.error('Error fetching workspaces:', error);
    }
}

/**
 * Add a new workspace to the project.
 * 
 * @param {number} projectId - The ID of the project to which the workspace belongs.
 * @param {string} name - The name of the workspace.
 * @param {string} type - The type of the workspace (e.g., 'notes', 'files', etc.).
 * @returns {Promise<void>} - A promise that resolves when the workspace is added.
 */
async function addWorkspace(projectId, name, type) {
    try {
        const response = await fetch('/workspace/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_id: projectId, name, type })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const newWorkspace = await response.json();
        const workspaceElement = createWorkspace(newWorkspace.name, newWorkspace.type, newWorkspace.workspace_id);
        workspaceContainer.appendChild(workspaceElement);
    } catch (error) {
        console.error('Error adding workspace:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchWorkspaces(1);
    // set the current workspace ID in local storage to 1
    localStorage.setItem('currentWorkspaceId', 1); 
});

/**
 * Fetch the count of completed and total todos for a given workspace.
 * 
 * @param {number} workspaceID - The ID of the workspace whose todo count is to be fetched.
 * @returns {Promise<{checked_count: number, total_count: number}>} - A promise that resolves with the todo count.
 */
async function fetchTodoCount(workspaceID) {
    try {
        const response = await fetch('/todo/getCount', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspace_id: workspaceID })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching todo count:', error);
    }
}