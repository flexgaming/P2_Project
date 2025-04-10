
/* **************************************************
                    Import & Export
   ************************************************** */

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
    let name = sanitize(username);

    if (name.length < minNameLength || name.length > maxNameLength) {
        throw(new Error('Validation Error'));
    }

    return name;
}
