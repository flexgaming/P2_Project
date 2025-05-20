/* **************************************************
                    Import & Export
   ************************************************** */

export { processReq };

import { jwtLoginHandler, 
         accessTokenLogin, 
         registerHandler } from './app.js';

import { reportError, 
         fileResponse,
         redirect,
        fetchRedirect } from './server.js';
         
// Import ToDo-related server handlers
import { getTodosServer,
         addTodoServer,
         deleteTodoServer,
         updateTodoServer,
         swapPosTodosServer,
         getCountServer } from './todo-server.js';

// Import Workspace-related server handlers
import { fetchWorkspacesServer,
         addWorkspaceServer,
         deleteWorkspaceServer,
         updateWorkspaceServer } from './workspaces-server.js'; 
import { } from './chat-server.js';
import { saveNoteHandler, 
         getNoteHandler} from './notes-server.js';

// Import the functions used for the file viewer.
import { getElements,
         createFolder,
         renamePath,
         movePath,
         deleteFile,
         deleteDirectory,
         uploadFile,
         downloadFile } from './file-viewer-server.js';

/* **************************************************
                    Request Processing
   ************************************************** */

/** 
 * This function figures out which direction the request is heading and how to process it. 
 * POST: A method to send data to the server (Login request and so on).
 * GET: A method to retrieve data from the server (HTML documents and so on).
 */
function processReq(req, res) {
    console.log(`\nGOT: ${req.method} ${req.url}`);

    let baseURL = `http://${req.headers.host}/`; // Example: http://www.example.com
    let url = new URL(req.url, baseURL); // Example: http://www.example.com/This/is/an/example
    let queryPath = decodeURIComponent(url.pathname); // Example: /This/is/an/example

    // Splits at every /, turning the pathname into an array; example[] = {['This'],['is'],['an'],['example']}.
    let pathElements = queryPath.split('/');

    // This is added to check if the user has any tokens.
    let userId = accessTokenLogin(req, res);

    /* Extracting method from the request and processed into either a POST or a GET. */
    switch (req.method) {
        case 'POST': {
            switch (pathElements[1]) {
                case 'login': {
                    jwtLoginHandler(req, res);
                    break;
                }
                case 'register': {
                    registerHandler(req, res);
                    break;
                }
                default: {
                    if (userId) {
                        switch (pathElements[1]) {
                            case 'todo': {
                                switch (pathElements[2]) {
                                    case 'fetch': {
                                        getTodosServer(req, res);
                                        break;
                                    }
                                    case 'add': {
                                        addTodoServer(req, res);
                                        break;
                                    }
                                    case 'delete': {
                                        deleteTodoServer(req, res);
                                        break;
                                    }
                                    case 'update': {
                                        updateTodoServer(req, res);
                                        break;
                                    }
                                    case 'move': {
                                        swapPosTodosServer(req, res);
                                        break;
                                    }
                                    case 'getCount': {
                                        getCountServer(req, res);
                                        break;
                                    }
                                    default: {
                                        reportError(res, new Error('Error 404: Not Found'));
                                        break;
                                    }
                                }
                                break;
                            }
                            case 'workspace': {
                                switch (pathElements[2]) {
                                    case 'fetchall': {
                                        fetchWorkspacesServer(req, res);
                                        break;
                                    }
                                    case 'add': {
                                        addWorkspaceServer(req, res);
                                        break;
                                    }
                                    case 'delete': {
                                        deleteWorkspaceServer(req, res);
                                        break;
                                    }
                                    case 'update': {
                                        updateWorkspaceServer(req, res);
                                        break;
                                    }
                                    default: {
                                        reportError(res, new Error('Error 404: Not Found'));
                                        break;
                                    }
                                }
                                break;
                            }
                            // In case user wants to interact with notes, we switch to the notes case.
                            case 'notes': {
                                switch (pathElements[2]) {
                                    case 'save': { // Save note to the database using the saveNoteHandler function from notes-server.js
                                        saveNoteHandler(req, res);
                                        break;
                                    }
                                    case 'get': { // Get note from the database using the getNote function from notes-server.js
                                        getNoteHandler(req, res);
                                        break;
                                    }
                                    default: {
                                        reportError(res, new Error('Error 404: Not Found'));
                                        break;
                                    }
                                }
                                break;
                            }
                            case 'file': {
                                switch (pathElements[2]) {
                                    case 'fetch': {
                                        getElements(req, res);
                                        break;
                                    }
                                    case 'createFolder': {
                                        createFolder(req, res);
                                        break;
                                    }
                                    case 'renamePath': {
                                        renamePath(req, res);
                                        break;
                                    }
                                    case 'movePath': {
                                        movePath(req, res);
                                        break;
                                    }
                                    case 'deleteFile': {
                                        deleteFile(req, res);
                                        break;
                                    }
                                    case 'deleteFolder': {
                                        deleteDirectory(req, res);
                                        break;
                                    }
                                    case 'uploadFile': {
                                        uploadFile(req, res);
                                        break;
                                    } 
                                    case 'downloadFile': {
                                        downloadFile(req, res);
                                        break;
                                    }
                                    default: {
                                        reportError(res, new Error('Error 404: Not Found'));
                                        break;
                                    }
                                }
                                break;
                            }
                            default: {
                                reportError(res, new Error('Error 404: Not Found'));
                                break;
                            }
                        }
                        break;
                    } else {
                        console.log('test');
                        fetchRedirect(res, '/');
                    }
                }
            } 
            
            break;
        }
        case 'GET': {
            // Checks if the client has an access token, or if the requested resource is accessible without access tokens.
            if (userId || pathElements[1] === '' || ['login.css', 'login.js'].includes(pathElements[2])) {
                switch (pathElements[1]) {
                    case '': {
                        if (userId) { // Redirect to /workspaces.
                            redirect(res, '/workspaces');
                        } else {
                            fileResponse(res, '/html/login.html');
                        }
                        break;
                    }
                    case 'chat': {
                        fileResponse(res, '/html/chat.html');
                        break;
                    }
                    case 'file-viewer': {
                        fileResponse(res, '/html/file-viewer.html');
                        break;
                    }
                    case 'notes': {
                        fileResponse(res, '/html/notes.html');
                        break;
                    }
                    case 'projects': {
                        fileResponse(res, '/html/projects.html');
                        break;
                    }
                    case 'whiteboard': {
                        fileResponse(res, '/html/whiteboard.html');
                        break;
                    }
                    case 'videochat': {
                        fileResponse(res, '/html/videochat.html');
                        break;
                    }
                    case 'workspaces': {
                        fileResponse(res, '/html/workspaces.html');
                        break;
                    }
                    default: {
                        fileResponse(res, req.url);
                    }
                }
            } else {
                //redirect(res, '/'); // Redirect to login page.
            }
            break;
        }
        default: {
            /* Nothing happens if the method is neither a POST nor a GET. */
            reportError(res, new Error('No Such Resource'));
        }
    }
}
