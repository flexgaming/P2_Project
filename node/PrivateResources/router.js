/* **************************************************
                    Import & Export
   ************************************************** */

export { processReq };
import { validateLogin, 
         jwtLoginHandler, 
         jwtRefreshHandler, 
         accessTokenLogin, 
         registerHandler } from './app.js';
import { reportError, 
         fileResponse, 
         extractForm, 
         redirect } from './server.js';
         
// Import ToDo-related server handlers
import { getTodosServer,
         addTodoServer,
         deleteTodoServer,
         updateTodoServer,
         swapPosTodosServer,
         getCountServer } from './todo-server.js';
// Import Project-related server handlers
/* import { fetchProjectsServer,
         addProjectServer,
         deleteProjectServer,
         updateProjectServer } from './projects-server.js';*/
// Import Workspace-related server handlers
import { fetchWorkspacesServer,
         fetchSingleWorkspaceServer,
         addWorkspaceServer,
         deleteWorkspaceServer,
         updateWorkspaceServer } from './workspaces-server.js'; 
import { } from './chat-server.js';
import { getNote, saveNoteHandler } from './notes-server.js';

/* **************************************************
                    Request Processing
   ************************************************** */

/** This function figures out which direction the request is heading and how to process it. 
 * 
 * POST: A method to send data to the server (Login request and so on).
 * 
 * GET: A method to retrieve data from the server (HTML documents and so on). */
function processReq(req, res) {
    console.log(`\nGOT: ${req.method} ${req.url}`);

    let baseURL = `http://${req.headers.host}/`; // Example: http://www.example.com
    let url = new URL(req.url, baseURL); // Example: http://www.example.com/This/is/an/example
    let queryPath = decodeURIComponent(url.pathname); // Example: /This/is/an/example

    let pathElements = queryPath.split('/'); // Splits at every /, turning the pathname into an array; example[] = {['This'],['is'],['an'],['example']}

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
                        case 'fetch': {
                            fetchSingleWorkspaceServer(req, res);
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
                case 'project': {
                    switch (pathElements[2]) {
                        case 'fetch': {
                            fetchProjectsServer(req, res);
                            break;
                        }
                        case 'add': {
                            addProjectServer(req, res);
                            break;
                        }
                        case 'delete': {
                            deleteProjectServer(req, res);
                            break;
                        }
                        case 'update': {
                            updateProjectServer(req, res);
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
                            getNote(req, res);
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
        }
        case 'GET': {
            let userId = accessTokenLogin(req, res);

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
                    case 'default-workspace': {
                        fileResponse(res, '/html/default-workspace.html');
                        break;
                    }
                    default: {
                        fileResponse(res, req.url);
                    }
                }
            } else {
                redirect(res, '/'); // Redirect to login page.
            }
            break;
        }
        default: {
            /* Nothing happens if the method is neither a POST nor a GET. */
            reportError(res, new Error('No Such Resource'));
        }
    }
}
