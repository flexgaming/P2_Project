
/* **************************************************
                    Import & Export
   ************************************************** */

export { processReq };
import { validateLogin } from './app.js';
import { reportError, fileResponse, extractForm } from './server.js';


/* **************************************************
                    Request Processing
   ************************************************** */

/** This function figures out which direction the request is heading and how to process it. */ 
function processReq(req, res) {
    console.log(`\nGOT: ${req.method} ${req.url}`);

    let baseURL = `http://${req.headers.host}/`
    let url = new URL(req.url, baseURL);
    let queryPath = decodeURIComponent(url.pathname);

    /* Extracting method from the request and processed into either a POST or a GET. */
    switch(req.method) {
        case 'POST': {
            let pathElements = queryPath.split('/');
            console.log(pathElements[1]);

            switch(pathElements[1]) {
                case 'login': {
                    extractForm(req)
                    .then(data => validateLogin(data));
                    break;
                }
                default: {
                    console.log('We hit default');
                    break;
                }
            }

            break;
        }
        case 'GET': {
            let pathElements = queryPath.split('/');
            console.log(pathElements[1]);
            
            switch(pathElements[1]) {
                case '': {
                    fileResponse(res, '/html/login.html');
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
                case 'whiteboard': {
                    fileResponse(res, '/html/whiteboard.html');
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

            break;
        }
        default: {
            /* Nothing happens if the method is neither a POST or a GET. */
            reportError(res, new Error('No Such Resource'));
        }
    }
}
