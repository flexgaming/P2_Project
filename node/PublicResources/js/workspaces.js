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
let workspaceIdCounter = 0;
let manageWorkspacesActive = false;

// Utility Functions
function createWorkspaceID() {
    workspaceIdCounter++;
    return `workspace-element-id-${workspaceIdCounter}`;
}

function toggleClass(elements, className, add) {
    for (const element of elements) {
        element.classList.toggle(className, add);
    }
}

// Workspace Functions
function createWorkspace(name, type, workspaceID) {
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
    workspaceType.textContent = type;

    // Clickable Overlay
    const clickOverlay = document.createElement('div');
    clickOverlay.className = "click-workspace-overlay";
    clickOverlay.onclick = () => workspaceClicked(workspace.id); // Pass the workspace ID

    // Append Elements
    workspace.append(deleteButton, workspaceName, renameForm, workspaceType, clickOverlay);
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
    input.placeholder = "Enter new name here";
    input.className = "workspace-rename-input";

    const button = document.createElement('button');
    button.type = "button";
    button.className = "workspace-rename-button";
    button.textContent = "Submit";
    button.onclick = () => renameWorkspaceElement(workspaceID);

    form.append(input, button);
    return form;
}

async function deleteWorkspace(workspaceID) {
    const WorkspaceID = workspaceID.replace('workspace-element-id-', ''); // Extract numeric ID

    try {
        const response = await fetch('/workspace/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspace_id: WorkspaceID }) // Send the numeric ID to the server
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const workspace = document.getElementById(workspaceID);
        if (workspace) workspace.remove(); // Remove the workspace from the UI
        console.log('Workspace deleted successfully!');
    } catch (error) {
        console.error('Error deleting workspace:', error);
    }
}

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
                name: renameInput.value,
                type: workspace.querySelector(".workspace-type").textContent // Include the type if needed
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

    toggleClass(deleteButtons, "hide", !show);
    for (let i = 0; i < renameForms.length; i++) {
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
        addWorkspace(name, type); // Call the server-side add function
        inputfieldWorkspaceName.value = '';
        inputfieldWorkspaceType.value = '';
        toggleModal(false);
    } else {
        alert("Please provide both a name and type for the workspace.");
    }
});

// Workspace Click Handler
function workspaceClicked(workspaceID) {
    console.log(`Workspace clicked! ID: ${workspaceID}`);

    // Extract the numeric part of the workspace ID
    const numericWorkspaceID = workspaceID.replace('workspace-element-id-', '');

    // Find the workspace element in the DOM
    const workspaceElement = document.getElementById(workspaceID);

    if (!workspaceElement) {
        console.error(`Workspace element with ID ${workspaceID} not found.`);
        return;
    }

    // Get the workspace type from the DOM
    const workspaceType = workspaceElement.querySelector(".workspace-type").textContent;

    // Redirect based on the workspace type
    if (workspaceType === 'notes') {
        redirect('notes', numericWorkspaceID); // Redirect to a notes workspace
    } else if (workspaceType === 'files') {
        redirect('file-viewer', numericWorkspaceID); // Redirect to a file-viewer workspace
    } else {
        console.error(`Unknown workspace type: ${workspaceType}`);
    }
}

// Redirect Function
async function redirect(path, workspaceID) {
    try {
        const response = await fetch(`/${path}?workspace_id=${workspaceID}`, { method: 'GET' });
        if (response.ok) {
            window.location.href = `/${path}?workspace_id=${workspaceID}`; // Include workspace ID in the URL
        } else {
            console.error('Redirect failed');
        }
    } catch (error) {
        console.error('Error during redirect:', error);
    }
}

// Fetch Workspaces
async function fetchWorkspaces() {
    try {
        const response = await fetch('/workspace/fetchall', {
            method: 'POST',
            headers: { 'Content-Type': 'text/txt' },
            body: '1' // Replace with the actual project ID
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const workspaces = await response.json();

        // Filter workspaces to only include 'notes' and 'files'
        const visibleWorkspaces = workspaces.filter(workspace => 
            workspace.type === 'notes' || workspace.type === 'files'
        );

        // Render only the filtered workspaces
        visibleWorkspaces.forEach(workspace => {
            const newWorkspace = createWorkspace(workspace.name, workspace.type, workspace.workspace_id);
            workspaceContainer.appendChild(newWorkspace);
        });
    } catch (error) {
        console.error('Error fetching workspaces:', error);
    }
}

// Add Workspace
async function addWorkspace(name, type) {
    try {
        const response = await fetch('/workspace/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_id: 1, name, type }) // Replace with actual project ID
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

document.addEventListener('DOMContentLoaded', fetchWorkspaces);