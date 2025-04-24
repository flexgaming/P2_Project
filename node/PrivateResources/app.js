
/* **************************************************
                    Import & Export
   ************************************************** */

export { validateLogin, jwtLoginHandler, jwtRefreshHandler };
import { startServer, reportError, extractJSON, errorResponse } from './server.js';

import jwt from 'jsonwebtoken';

const minNameLength = 3;
const maxNameLength = 20;
const hashLength = 32;

const tokenStore = {};

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
function validateLogin(username, password) {
    username = validateUsername(username); // Check if the username completes the requirements and deny any injection attempts.
    password = validatePassword(password); // Check if the password completes the requirements and deny any injection attempts.

    const userId = username; // Get userId from database later.

    return userId;
}


/* **************************************************
                Authentication Tokens
   ************************************************** */

function jwtLoginHandler(req, res) {
    extractJSON(req, res)
    .then(body => {
        const { username, password } = body;
        const userId = validateLogin(username, password);
        const tokens = generateTokens(userId);
        storeTokens(userId, tokens);
        sendJSON(res, tokens);
    }).catch(e => reportError(res, e));
}

function jwtRefreshHandler(req, res) {
    extractJSON(req, res)
    .then(body => {
        const { userId, refreshToken } = body;
        const newAccessToken = refreshAccessToken(refreshToken);
        if (newAccessToken) {
            storeTokens(userId, { ...getTokens(userId), accessToken: newAccessToken });
            sendJSON(res, { accessToken: newAccessToken });
        } else {
            errorResponse(res, 403, 'Forbidden Access')
        }
    }).catch(e => reportError(res, e));
}

function generateTokens(userId) {
    const accessToken = jwt.sign({ userId }, 'access_token', { expiresIn: '5s' });
    const refreshToken = jwt.sign({ userId }, 'refresh_secret', { expiresIn: '7d' });
    console.log('Access Token: ' + accessToken);
    return { accessToken, refreshToken };
}

function storeTokens(userId, tokens) {
    tokenStore[userId] = tokens;
}

function getTokens(userId) {
    return tokenStore[userId];
}

function sendJSON(res, obj) {
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify(obj));
    res.end();
}

function validateAccessToken(token) {
    try {
        const decoded = jwt.verify(token, 'access_token');
        return decoded;
    } catch (err) {
        return null;
    }
}

function refreshAccessToken(refreshToken) {
    try {
        const decoded = jwt.verify(refreshToken, 'refresh_secret');
        const newAccessToken = jwt.sign({ userId: decoded.userId }, 'access_token', { expiresIn: '15m' });
        return newAccessToken;
    } catch (err) {
        return null;
    }
}
