/* **************************************************
                    Impot & Export
   ************************************************** */

export { validateLogin, 
         jwtLoginHandler, 
         jwtRefreshHandler, 
         accessTokenLogin,
         sendJSON,  
         registerHandler };
import { startServer, 
         reportError, 
         extractJSON, 
         extractTxt, 
         errorResponse,
         checkUsername, 
         registerUser, 
         loginRequest } from './server.js';

import jwt from 'jsonwebtoken';

const minNameLength = 3;
const maxNameLength = 20;
const hashLength = 64;

const tokenStore = {};

const accessExpiration = '30m';
const refreshExpiration = '7d';

const accessCode = 'i9eag7zj3cobxl40dv6urwn15yk82mqthfsp';
const refreshCode = 'k01hqu7a92ceyjfiobvldrpxw4n8zt6sm35g';

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

    return [username, password];
}

async function loginHandler(res, username, password) {
    try {
        const userId = await loginRequest(username, password);
        console.log('USER ID: ' + userId);
        
        if (userId) {
            const tokens = generateTokens(userId);
        
            storeTokens(userId, tokens); // Stores the tokens in server memory.
            sendCookie(res, tokens); // Sends the tokens back to the clients.
            res.end();
        }
        else {
            // Inform the client that login failed.
            errorResponse(res, 409, 'Username or Password is incorrect.');
        }
    } catch(err) {
        reportError(res, err);
    }
}

async function registerHandler(req, res) {
    try {
        const body = await extractJSON(req, res);
        const { username, password } = body;
        const [user, pass] = validateLogin(username, password); // validateLogin can still be synchronous

        console.log(user, pass);

        if (await checkUsername(user)) {
            await registerUser(user, pass);
            loginHandler(res, user, pass);
        } else {
            console.log('Username giga taken bro');
            // Respond with an error or message to the client
            errorResponse(res, 409, 'Username is unavailable.');
        }
    } catch (err) {
        reportError(res, err);
    }
}



/* **************************************************
                Authentication Tokens
   ************************************************** */

/** When logging in, gets the login data, and makes JSON Web Tokens. */
function jwtLoginHandler(req, res) {
    extractJSON(req, res)
    .then(body => {
        const { username, password } = body; // Get username and password from login request.
        const [user, pass] = validateLogin(username, password); // Validate login and get the userId.
        
        loginHandler(res, user, pass);
    }).catch(e => reportError(res, e));
}

/** Handles requests to refresh access token. */
function jwtRefreshHandler(res, refreshToken) {
    try {
        const decoded = jwt.verify(refreshToken, refreshCode); // Decode the refresh token.
        const userId = decoded.userId;

        // Generate a new access token.
        const newAccessToken = jwt.sign({ userId: userId }, accessCode, { expiresIn: accessExpiration });

        // Stores the tokens by first reading the current data for given userId and then updating the access token.
        storeTokens(userId, { ...getTokens(userId), accessToken: newAccessToken });
        sendCookie(res, { accessToken: newAccessToken }); // Sends the tokens back to the clients.

        return userId;
    } catch (err) {
        errorResponse(res, 403, 'Forbidden Access');

        return null;
    }
}

/** Generates the tokens using the JWT library. */
function generateTokens(userId) {
    const accessToken = jwt.sign({ userId }, accessCode, { expiresIn: accessExpiration });
    const refreshToken = jwt.sign({ userId }, refreshCode, { expiresIn: refreshExpiration });
    
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

/** Verifies the access token. */
function validateAccessToken(token) {
    try {
        const decoded = jwt.verify(token, accessCode);
        return decoded;
    } catch (err) {
        return null;
    }
}

/** Function to login using access tokens. */
function accessTokenLogin(req, res) {
    const cookies = parseCookies(req.headers.cookie);
    if (cookies.accessToken) { // Check if the access token is valid.
        const accessToken = validateAccessToken(cookies.accessToken);

        if (accessToken) { // Login.
            return accessToken.userId;
        } else if (cookies.refreshToken) { // Request new access token.
            return jwtRefreshHandler(res, cookies.refreshToken);
        }
    } else if (cookies.refreshToken) { // Request new access token.
        return jwtRefreshHandler(res, cookies.refreshToken);
    } else {
        return null;
    }
}


/* **************************************************
                        Cookies
   ************************************************** */

/**
 * Sends the cookies to the client.
 * 
 * @param {object} obj The object containing cookies.
 * @param {response} res The response to the client.
 */
function sendCookie(res, obj) {
    const accessExpire = new Date(); // The expiration time for the access token.
    const refreshExpire = new Date(); // The expiration time for the refresh token.

    accessExpire.setTime(accessExpire.getTime() + 1000 * 60 * 30); // Expires after 30 minutes.
    refreshExpire.setTime(refreshExpire.getTime() + 1000 * 60 * 60 * 24 * 7); // Expires after 7 days.

    // Create header and add the refresh and access tokens from the object if any.
    let header = [];
    if (obj.refreshToken) {
        header.push(
            `refreshToken=${obj.refreshToken};` +
            `HttpOnly;` +
            /* `Secure;` + */ // Only works with https.
            `SameSite=Strict;` +
            `Expires=${refreshExpire.toUTCString()};` +
            `Path=/`
        );
    }
    if (obj.accessToken) {
        header.push(
            `accessToken=${obj.accessToken};` +
            `HttpOnly;` +
            /* `Secure;` + */
            `SameSite=Strict;` +
            `Expires=${accessExpire.toUTCString()};` +
            `Path=/`
        );
    }

    // Adds the cookie data to the header of the response object.
    res.setHeader('Set-Cookie', header);
}

function parseCookies(cookieHeader = '') {
    return cookieHeader
    .split(';') // Splits "refreshToken=value; accessToken=value" into ["refreshToken=value", " accessToken=value"].
    .map(c => c.trim().split('=')) // Trims whitespace from the ends, and then splits them into ["refreshToken", "value"].
    .reduce((acc, [k, v]) => { // For all keyword-value pairs, check if there is a keyword, then add the decoded value to accumulator.
        if (k) acc[k] = decodeURIComponent(v); // Unicode decoding turns "%20" into " " etc.
        return acc;
    }, {}); // The "{}" here is the initial value of the accumulator, which is an empty object.
}



