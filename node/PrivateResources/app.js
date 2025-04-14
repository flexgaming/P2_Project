
/* **************************************************
                    Import & Export
   ************************************************** */

export { validateLogin };
import { startServer } from './server.js';

const minNameLength = 3;
const maxNameLength = 20;
const hashLength = 32;

startServer();


/* **************************************************
                    Input Verification
   ************************************************** */

/** Removes all malicious characters. */
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

/** Function to prevent injections using the sanitize function.
 * 
 * This function also checks that the length of the username is acceptable. */
function validateUsername(username) {
    const name = sanitize(username);

    if (name.length < minNameLength || name.length > maxNameLength) {
        throw(new Error('Validation Error'));
    }

    return name;
}

/** Function to prevent injections using the sanitize function.
 *  
 * This function also checks that the length of the password is acceptable. */ 
function validatePassword(password) {
    const key = sanitize(password);

    if (key.length !== hashLength) {
        throw(new Error('Validation Error'));
    }

    return key;
}


/** This function validates the login information.
 *  
 * The username is verified by minimum and max length.
 * The password is verified by the length of the hash.
 * 
 * Both the username and password is sanitized to deny any injection attemps.
 */
function validateLogin(data) {
    if (data.has('username') && data.has('password')) {
        let username = String(data.get('username'));
        let password = String(data.get('password'));

        username = validateUsername(username); // Check if the username completes the requirements and deny any injection attempts.
        password = validatePassword(password); // Check if the password completes the requirements and deny any injection attempts.
        
        console.log('Username: ' + username + ', Password: ' + password);
    } else {
        // Error
        console.log('Error happened in validating the login (either username or password)');
        console.log('Username: ' + username + ', Password: ' + password);
    }
}
