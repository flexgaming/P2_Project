
const inputfieldWorkspaceName = document.getElementById("workspace-name")
const inputfieldWorkspaceType = document.getElementById("workspace-type")
const newWorkspaceSubmit = document.getElementById("add-new-workspace-form")
const workspaceContainer = document.getElementById("workspace-container")

//Function create workspace ############################################
function createWorkspace(name, type) {
    // Container for workspace
    const workspace = document.createElement('div');
    workspace.className = 'workspace-element';
    workspace.id = createWorkspaceID();

    //Create the delete button
    const workspaceDeleteButton = document.createElement('button');
    workspaceDeleteButton.classList.add("delete-workspace-button");
    workspaceDeleteButton.classList.add("close-button");
    workspaceDeleteButton.classList.add("hide");
    workspaceDeleteButton.type = "button";
    workspaceDeleteButton.onclick = function () { deleteWorkspaceElement(workspace.id) };
    workspaceDeleteButton.textContent = "x";
    // <button class="close-button delete-workspace-button hide" type="button"
    //          onclick="deleteWorkspaceElement('workspace-element-id-1')">x</button>

    // Create the name element (which is also the header)
    const workspaceName = document.createElement('h2');
    workspaceName.classList.add("workspace-name")
    workspaceName.textContent = name;

    //Create the rename form element
    const workspaceRenameForm = document.createElement('form');
    workspaceRenameForm.action = "/workspaces";
    workspaceRenameForm.classList.add("workspace-rename-form");
    workspaceRenameForm.classList.add("hide");
    //Create the rename form input field and putting it in the form
    const workspaceRenameFormInput = document.createElement('input');
    workspaceRenameFormInput.type = "text";
    workspaceRenameFormInput.placeholder = "Enter new name here";
    workspaceRenameFormInput.classList.add("workspace-rename-input");
    workspaceRenameFormInput.value = "";
    workspaceRenameForm.appendChild(workspaceRenameFormInput);
    //Create the rename form button and putting it in the form
    const workspaceRenameFormButton = document.createElement('button');
    workspaceRenameFormButton.classList.add("workspace-rename-button");
    workspaceRenameFormButton.type = "button";
    workspaceRenameFormButton.onclick = function () { renameWorkspaceElement(workspace.id) };
    workspaceRenameFormButton.textContent = "Submit";

    workspaceRenameForm.appendChild(workspaceRenameFormButton);
    //<form action="/workspaces" class="workspace-rename-form hide">
    //                    <input type="text" class="workspace-rename-input" value="" placeholder="Enter new name here...">
    //                    <button class="workspace-rename-button" type="button"
    //                        onclick="renameWorkspaceElement('workspace-element-id-0')">Submit</button>
    //                </form>


    // Create the type element
    const workspaceType = document.createElement('p');
    workspaceType.textContent = type;

    //Create the div that makes it clickable
    const workspaceClickDiv = document.createElement('div');
    workspaceClickDiv.classList.add("click-workspace-overlay")
    workspaceClickDiv.onclick = function () { workspaceClicked() }; //This needs to have the link to the workspace

    //<div class="click-workspace-overlay" onclick="workspaceClicked(1)"></div>

    //Append to workspace
    workspace.appendChild(workspaceDeleteButton);
    workspace.appendChild(workspaceName);
    workspace.appendChild(workspaceRenameForm)
    workspace.appendChild(workspaceType);
    workspace.appendChild(workspaceClickDiv);

    return workspace;
}

//Function that makes id's it attaches to the workspace this will probably have to be redone when the get actual id's
let workspaceIdCounter = 0;
function createWorkspaceID() {
    workspaceIdCounter++;
    return "workspace-element-id-" + workspaceIdCounter;
}


//Add new workspace button ###########################################

//show and hide modal box
const closeAddNew = document.getElementById("closeAddNew")
const openAddNew = document.getElementById("openAddNew")
const modal = document.getElementById("modal")

openAddNew.addEventListener("click", () => {
    hideClickableWorkspaces(true);
    showManageWorkspacesElements(false);
    modal.classList.add("show-modal");
});
closeAddNew.addEventListener("click", () => {
    hideClickableWorkspaces(false);
    modal.classList.remove("show-modal");
});

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.remove("show-modal");
        console.log("Triggered modal not shown")
        hideClickableWorkspaces(false);
    }
})

// Manage workspaces button ##############################################

const manageWorkspacesbutton = document.getElementById("manage-button")
let manageWorkspacesTrueFalse = false;

manageWorkspacesbutton.addEventListener("click", () => {
    if (manageWorkspacesTrueFalse === false) {
        manageWorkspacesTrueFalse = true;
        showManageWorkspacesElements(true);
        hideClickableWorkspaces(true);
    }
    else {
        manageWorkspacesTrueFalse = false;
        showManageWorkspacesElements(false);
        hideClickableWorkspaces(false);
    }
});

//show Delete workspace button
function showManageWorkspacesElements(bool) {
    const deleteWorkspaceButtons = document.getElementsByClassName("delete-workspace-button");
    const renameForms = document.getElementsByClassName("workspace-rename-form");
    //console.log(deleteWorkspaceButtons);
    if (bool === true) {
        for (let i = 0; i < deleteWorkspaceButtons.length; i++) {
            deleteWorkspaceButtons[i].classList.remove("hide");
            //console.log(deleteWorkspaceButtons);
        }
        for (let i = 0; i < renameForms.length; i++) {
            renameForms[i].classList.remove("hide");
        }
    }
    else if (bool === false) {
        for (let i = 0; i < deleteWorkspaceButtons.length; i++) {
            deleteWorkspaceButtons[i].classList.add("hide");
            //console.log(deleteWorkspaceButtons);
        }
        for (let i = 0; i < renameForms.length; i++) {
            renameForms[i].classList.add("hide");
        }
    }
    else {
        console.log("Wrong input in showManageWorkspacesElements")
    }
}

//Delete workspace
function deleteWorkspaceElement(workspaceID) {
    const workspace = document.getElementById(workspaceID);
    workspace.remove();
}
//Rename workspace
function renameWorkspaceElement(workspaceID) {
    //get workspace element
    const workspace = document.getElementById(workspaceID);
    console.log("this is the workspace: " + workspace);

    //Get the workspace name (there is only 1 so it takes the first)
    const workspaceName = (workspace.getElementsByClassName("workspace-name"))[0];
    console.log("this is the workspace name: " + workspaceName)

    //Get the value of rename input
    const newName = workspace.getElementsByClassName("workspace-rename-input")[0].value;
    console.log("this is the new name: " + newName);

    //Give new name and clear input
    workspaceName.textContent = newName;
    workspace.getElementsByClassName("workspace-rename-input")[0].value = '';
}



//hide and show clickable workspaces ############################################
function hideClickableWorkspaces(bool) {
    const clickableWorkspaces = document.getElementsByClassName("click-workspace-overlay");
    if (bool === true) {
        for (let i = 0; i < clickableWorkspaces.length; i++) {
            clickableWorkspaces[i].classList.add("hide");
            //console.log(clickableWorkspaces);
        }
    }
    else if (bool === false) {
        for (let i = 0; i < clickableWorkspaces.length; i++) {
            clickableWorkspaces[i].classList.remove("hide");
            //console.log(clickableWorkspaces);
        }
    }
    else {
        console.log("Wrong input in hideClickableWorkspaces")
    }
}

//Submit workspace #######################################################
newWorkspaceSubmit.addEventListener('submit', (event) => {
    event.preventDefault();

    const newWorkspaceName = inputfieldWorkspaceName.value
    const newWorkspaceType = inputfieldWorkspaceType.value

    console.log("New workspace name: " + newWorkspaceName)
    console.log("New workspace type: " + newWorkspaceType)

    if (newWorkspaceName && newWorkspaceType) {
        //create the workspace
        const newWorkspace = createWorkspace(newWorkspaceName, newWorkspaceType);
        console.log("New workspace " + newWorkspace);
        //add the workspace to the html
        workspaceContainer.appendChild(newWorkspace);

        // Clear the input field
        inputfieldWorkspaceName.value = '';
        inputfieldWorkspaceType.value = '';

        modal.classList.remove("show-modal");
        hideClickableWorkspaces(false);
    }
    else {
        alert("Add both name and Type")
    }
});

//Detect hovered workspace ##################################

function workspaceClicked(x) {
    if (x == 1) {
        redirect('default-workspace')
    }

}

// redirect ################################################
async function redirect(x) {
    switch (x) {
        case 'default-workspace': {

            const response = await fetch('/default-workspace', { // Attempt to redirect to /default-workspace
                method: 'GET'
            });

            if (response.ok) { // Redirect to /default-workspace
                window.location.href = response.url;
            } else {
                console.log('Redirect failed');
            }
            break;
        }
        default: {
            console.log("Hit Default in workspace redirect")
        }
    }
}