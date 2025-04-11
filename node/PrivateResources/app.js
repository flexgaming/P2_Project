
/* **************************************************
                    Import & Export
   ************************************************** */

export { validateLogin };
import { startServer } from './server.js';

const minNameLength = 3;
const maxNameLength = 20;

startServer();


/* **************************************************
                    Input Verification
   ************************************************** */

/* Removes all malicious characters. */
function sanitize(str) {
    str = str
    .replace(/&/g, '')
    .replace(/</g, '')
    .replace(/>/g, '')
    .replace(/"/g, '')
    .replace(/'/g, '')
    .replace(/`/g, '')
    .replace(/\//g, '');

    return str.trim();
}

/* Function to prevent injections using the sanitize function.
This function also checks that the length of the username is acceptable */
function validateUsername(username) {
    const name = sanitize(username);

    if (name.length < minNameLength || name.length > maxNameLength) {
        throw(new Error('Validation Error'));
    }

    return name;
}

function validateLogin(data) {
    if (data.has('username') && data.has('password')) {
        const username = String(data.get('username'));
        const password = String(data.get('password'));
        
        console.log('Username: ' + username + ', Password: ' + password);
    }
}
