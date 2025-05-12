// DOM Elements
const inputfieldProjectName = document.getElementById("project-name");
const newProjectSubmit = document.getElementById("add-new-project-form");
const projectContainer = document.getElementById("project-container");
const closeAddNew = document.getElementById("closeAddNew");
const openAddNew = document.getElementById("openAddNew");
const modal = document.getElementById("modal");
const manageProjectsButton = document.getElementById("manage-button");

// State Variables
let manageProjectsActive = false;

function toggleClass(elements, className, add) {
    for (const element of elements) {
        element.classList.toggle(className, add);
    }
}

// Project Functions
function createProject(name, projectID) {
    const project = document.createElement('div');
    project.className = 'project-element';
    project.id = `project-element-id-${projectID}`; // Use the database-generated ID

    // Delete Button
    const deleteButton = createDeleteButton(project.id);

    // Project Name
    const projectName = document.createElement('h2');
    projectName.className = "project-name";
    projectName.textContent = name;

    // Rename Form
    const renameForm = createRenameForm(project.id);

    // Clickable Overlay
    const clickOverlay = document.createElement('div');
    clickOverlay.className = "click-project-overlay";
    clickOverlay.onclick = () => projectClicked(project.id); // Pass the project ID

    // Append Elements
    project.append(deleteButton, projectName, renameForm, clickOverlay);
    return project;
}

function createDeleteButton(projectID) {
    const button = document.createElement('button');
    button.className = "delete-project-button close-button hide";
    button.type = "button";
    button.textContent = "x";
    button.onclick = () => deleteProject(projectID);
    return button;
}

function createRenameForm(projectID) {
    const form = document.createElement('form');
    form.action = "/projects";
    form.className = "project-rename-form hide";

    const input = document.createElement('input');
    input.type = "text";
    input.placeholder = "Enter new name here";
    input.className = "project-rename-input";

    // Add an event listener for the "Enter" key
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent form submission
            renameProjectElement(projectID); // Trigger the rename logic
        }
    });

    const button = document.createElement('button');
    button.type = "button";
    button.className = "project-rename-button";
    button.textContent = "Submit";
    button.onclick = () => renameProjectElement(projectID);

    form.append(input, button);
    return form;
}

async function deleteProject(projectID) {
    const ProjectID = projectID.replace('project-element-id-', ''); // Extract numeric ID

    try {
        const response = await fetch('/project/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_id: ProjectID }) // Send the numeric ID to the server
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const project = document.getElementById(projectID);
        if (project) project.remove(); // Remove the project from the UI
        console.log('Project deleted successfully!');
    } catch (error) {
        console.error('Error deleting project:', error);
    }
}

async function renameProjectElement(projectID) {
    const project = document.getElementById(projectID);
    const projectName = project.querySelector(".project-name");
    const renameInput = project.querySelector(".project-rename-input");

    // Update the project name in the UI
    projectName.textContent = renameInput.value;

    // Extract the numeric part of the project ID
    const numericProjectID = projectID.replace('project-element-id-', '');

    try {
        // Send the updated name to the server
        const response = await fetch('/project/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project_id: numericProjectID,
                name: renameInput.value
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('Project renamed successfully!');
    } catch (error) {
        console.error('Error renaming project:', error);
    }

    // Toggle out of managing projects
    if (manageProjectsActive) {
        toggleManageProjects();
    }
}

// Modal Functions
function toggleModal(show) {
    modal.classList.toggle("show-modal", show);
}

function hideClickableProjects(hide) {
    const clickableProjects = document.getElementsByClassName("click-project-overlay");
    toggleClass(clickableProjects, "hide", hide);
}

// Manage Projects Functions
function toggleManageProjects() {
    manageProjectsActive = !manageProjectsActive;
    showManageProjectsElements(manageProjectsActive);
    hideClickableProjects(manageProjectsActive);
}

function showManageProjectsElements(show) {
    const deleteButtons = document.getElementsByClassName("delete-project-button");
    const renameForms = document.getElementsByClassName("project-rename-form");
    const projectNames = document.getElementsByClassName("project-name");

    toggleClass(deleteButtons, "hide", !show);
    for (let i = 0; i < renameForms.length; i++) {
        renameForms[i].classList.toggle("hide", !show);
        projectNames[i].classList.toggle("hide", show);

        if (show) {
            const renameInput = renameForms[i].querySelector(".project-rename-input");
            renameInput.value = projectNames[i].textContent;
        }
    }
}

// Event Listeners
openAddNew.addEventListener("click", () => toggleModal(true));
closeAddNew.addEventListener("click", () => toggleModal(false));
window.addEventListener("click", (e) => {
    if (e.target === modal) toggleModal(false);
});

manageProjectsButton.addEventListener("click", toggleManageProjects);

newProjectSubmit.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = inputfieldProjectName.value;

    if (name) {
        addProject(name); // Call the server-side add function
        inputfieldProjectName.value = '';
        toggleModal(false);
    } else {
        alert("Please provide a name for the project.");
    }
});

// Project Click Handler
function projectClicked(projectID) {
    const numericProjectID = projectID.replace('project-element-id-', '');
    console.log(`Project clicked! ID: ${numericProjectID}`);
    localStorage.setItem('currentProjectId', numericProjectID);

    window.location.href = '/project-viewer';
}

// Fetch Projects
async function fetchProjects(projectId) {
    try {
        const response = await fetch('/project/fetchall', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_id: projectId })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const projects = await response.json();

        // Render projects
        for (const project of projects) {
            const newProject = createProject(project.name, project.project_id);
            projectContainer.appendChild(newProject);
        }
    } catch (error) {
        console.error('Error fetching projects:', error);
    }
}

// Add Project
async function addProject(name) {
    try {
        const response = await fetch('/project/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_id: 1, name }) // Replace with actual project ID
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const newProject = await response.json();
        const projectElement = createProject(newProject.name, newProject.project_id);
        projectContainer.appendChild(projectElement);
    } catch (error) {
        console.error('Error adding project:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchProjects(1);
    // set the current project ID in local storage to 1
    localStorage.setItem('currentProjectId', 1); 
});

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
function createWorkspace(name, type, workspaceID, todoCount = 0) {
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

    // Todo Count
    const todoCountElement = document.createElement('p');
    todoCountElement.className = "workspace-todo-count";
    todoCountElement.textContent = `Todos: ${todoCount}`;

    // Clickable Overlay
    const clickOverlay = document.createElement('div');
    clickOverlay.className = "click-workspace-overlay";
    clickOverlay.onclick = () => workspaceClicked(workspace.id); // Pass the workspace ID

    // Append Elements
    workspace.append(deleteButton, workspaceName, renameForm, workspaceType, todoCountElement, clickOverlay);
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
    const numericWorkspaceID = workspaceID.replace('workspace-element-id-', '');
    console.log(`Workspace clicked! ID: ${numericWorkspaceID}`);
    localStorage.setItem('currentWorkspaceId', numericWorkspaceID);

    const workspaceElement = document.getElementById(workspaceID);
    if (!workspaceElement) {
        console.error(`Workspace element with ID ${workspaceID} not found.`);
        return;
    }

    const workspaceType = workspaceElement.querySelector(".workspace-type").textContent;
    if (workspaceType === 'notes') {
        window.location.href = '/notes'
    } else if (workspaceType === 'files') {
        window.location.href = '/file-viewer'
    } else {
        console.error(`Unknown workspace type: ${workspaceType}`);
    }
}

// Fetch Workspaces
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
            workspace.type === 'notes' || workspace.type === 'files'
        );

        // Render only the filtered workspaces
        for (const workspace of visibleWorkspaces) {
            const todoCount = await fetchTodoCount(workspace.workspace_id); // Await the result
            const newWorkspace = createWorkspace(workspace.name, workspace.type, workspace.workspace_id, todoCount);
            workspaceContainer.appendChild(newWorkspace);
        }
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

async function fetchTodoCount(workspaceID) {
    try {
        const response = await fetch(`/workspace/${workspaceID}/todos/count`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.count;
    } catch (error) {
        console.error('Error fetching todo count:', error);
        return 0;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchWorkspaces(1);
    // set the current workspace ID in local storage to 1
    localStorage.setItem('currentWorkspaceId', 1); 
});
