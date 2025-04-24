
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

/** When logging in, gets the login data, and makes JSON Web Tokens. */
function jwtLoginHandler(req, res) {
    extractJSON(req, res)
    .then(body => {
        const { username, password } = body; // Get username and password from login request.
        const userId = validateLogin(username, password); // Validate login and get the userId.
        const tokens = generateTokens(userId);
        storeTokens(userId, tokens); // Stores the tokens in server memory.
        sendCookie(res, tokens); // Sends the tokens back to the clients.
    }).catch(e => reportError(res, e));
}

/** Handles requests to refresh access token. */
function jwtRefreshHandler(req, res) {
    extractJSON(req, res)
    .then(body => {
        const { userId, refreshToken } = body; // Gets userId and refresh token from refresh request.
        const newAccessToken = refreshAccessToken(refreshToken); // Generates a new access token.
        if (newAccessToken) {
            /* Updates the saved tokens for the given userid, by first getting the tokens saved, and then updating the access token. */
            storeTokens(userId, { ...getTokens(userId), accessToken: newAccessToken });
            sendCookie(res, { accessToken: newAccessToken }); // Sends the new access token to the client.
        } else {
            errorResponse(res, 403, 'Forbidden Access') // If access denied, send error to client.
        }
    }).catch(e => reportError(res, e));
}

/** Generates the tokens using the JWT library. */
function generateTokens(userId) {
    const accessToken = jwt.sign({ userId }, 'access_token', { expiresIn: '5s' });
    const refreshToken = jwt.sign({ userId }, 'refresh_secret', { expiresIn: '7d' });
    console.log('Access Token: ' + accessToken);
    return { accessToken, refreshToken };
}

/** Saves the tokens an object array. */
function storeTokens(userId, tokens) {
    tokenStore[userId] = tokens;
}

/** Returns the tokens of a user. */
function getTokens(userId) {
    return tokenStore[userId];
}

/** Sends the JSON object as response to client. */
function sendJSON(res, obj) {
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify(obj));
    res.end();
}

function sendCookie(res, obj) {
    const accessExpire = new Date();
    const refreshExpire = new Date();

    accessExpire.setTime(accessExpire.getTime() + 1000 * 60 * 30); // Expires after 30 minutes.
    refreshExpire.setTime(refreshExpire.getTime() + 1000 * 60 * 60 * 24 * 7); // Expires after 7 days.

    res.setHeader('Set-Cookie', [
        `refreshToken=${obj.refreshToken};` +
        `HttpOnly;` +
        `Secure;` +
        `SameSite=Strict;` +
        `Expires=${refreshExpire.toUTCString()};` +
        `Path=/`,

        `accessToken=${obj.accessToken};` +
        `HttpOnly;` +
        `Secure;` +
        `SameSite=Strict;` +
        `Expires=${accessExpire.toUTCString()};` +
        `Path=/`,
    ]);
    
    sendJSON(res, obj);
}

/** IDK */
function validateAccessToken(token) {
    try {
        const decoded = jwt.verify(token, 'access_token');
        return decoded;
    } catch (err) {
        return null;
    }
}

/** Verifies the refresh token and generates a new access token. */
function refreshAccessToken(refreshToken) {
    try {
        const decoded = jwt.verify(refreshToken, 'refresh_secret');
        const newAccessToken = jwt.sign({ userId: decoded.userId }, 'access_token', { expiresIn: '15m' });
        return newAccessToken;
    } catch (err) {
        return null;
    }
}
