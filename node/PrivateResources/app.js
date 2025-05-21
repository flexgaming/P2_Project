/* **************************************************
                    Import & Export
   ************************************************** */

export { validateLogin,
         loginHandler,
         refreshHandler,
         accessTokenLogin,
         sendJSON,
         registerHandler,
         sanitize,
         validateAccessToken,
         generateTokens,
         parseCookies };

import { startServer, 
         extractJSON,  
         errorResponse,
         checkUsernameAvailability, 
         registerUser, 
         loginRequest,
         redirect } from './server.js';

import jwt from 'jsonwebtoken';

// Password validation values.
const minNameLength = 3;
const maxNameLength = 20;
const hashLength = 64;

// Token expiration times.
const accessExpiration = '30m';
const refreshExpiration = '7d';

// Token security codes.
const accessCode = 'i9eag7zj3cobxl40dv6urwn15yk82mqthfsp';
const refreshCode = 'k01hqu7a92ceyjfiobvldrpxw4n8zt6sm35g';

startServer(); // Starts the server when app.js is running.


/* **************************************************
                    Input Verification
   ************************************************** */

/** Removes all non-alphanumeric characters. */
function sanitize(str) {
    // Replace all characters that are not a-z, A-Z or 0-9 with ''.
    return str.replace(/[^a-zA-Z0-9]/g, '');
}

/** Validate the username. */
function validateUsername(username) {
    // Prevent injections using the sanitize function.
    const name = sanitize(username);

    // Check the length of the username.
    if (name.length < minNameLength || name.length > maxNameLength) {
        return null;
    }

    return name;
}

/** Validate the password. */
function validatePassword(password) {
    // Prevent injections using the sanitize function.
    const key = sanitize(password);

    // Check the length of the password.
    if (key.length !== hashLength) {
        return null;
    }

    return key;
}

/** Validate both username and password. */
function validateLogin(username, password) {
    // Check if the username and password completes the requirements and deny any injection attempts.
    username = validateUsername(username);
    password = validatePassword(password);

    return [username, password];
}

/** Validates the login credentials in the database, and creates and sends tokens to client. */
async function login(res, username, password) {
    // Contact the database and see if the login credentials are saved in the users table.
    const userId = await loginRequest(username, password);
    
    if (userId) { // If the login credentials matched an account in the database.
        const tokens = generateTokens(userId); // Generate access- and refresh token.
        sendCookie(res, tokens); // Sends the tokens back to the client.
        res.end(); // Ends the response (sends the response to the client).
    }
    else {
        // Inform the client that login failed.
        errorResponse(res, 409, 'Username or Password is incorrect.');
    }
}

/** Hi */
async function registerHandler(req, res) {
    try {
        // Fetch the data from the request and validate that the login credentials follow the requirements.
        const body = await extractJSON(req, res);
        const { username, password } = body;
        const [user, pass] = validateLogin(username, password);

        // if the username or password do not follow the requirements, inform the client.
        if (!user || !pass) errorResponse(res, 400, 'Username or Password is incorrect format.');

        // If the username is available, save the login credentials to the database, and log the user in.
        if (await checkUsernameAvailability(user)) {
            await registerUser(user, pass);
            login(res, user, pass);
        } else {
            // Inform the client that register failed.
            errorResponse(res, 409, 'Username is unavailable.');
        }
    } catch (err) {
        // Inform the client that register failed.
        errorResponse(res, err.code, err);
    }
}


/* **************************************************
                Authentication Tokens
   ************************************************** */

/** When logging in, gets the login data. */
async function loginHandler(req, res) {
    try {
        // Get and validate the login data.
        const body = await extractJSON(req, res);
        const { username, password } = body;
        const [user, pass] = validateLogin(username, password);

        login(res, user, pass); // Attempt to login using this data.
    } catch (err) {
        // Inform the client that login failed.
        errorResponse(res, err.code, err);
    }    
}

/** Handles requests to refresh access token. */
function refreshHandler(res, refreshToken) {
    try {
        // Decode the refresh token and read the user ID from it.
        const decoded = jwt.verify(refreshToken, refreshCode);
        const userId = decoded.userId;

        // Generate a new access token and send it to the client.
        const newAccessToken = jwt.sign({ userId: userId }, accessCode, { expiresIn: accessExpiration });
        sendCookie(res, { accessToken: newAccessToken });

        return userId;
    } catch (err) {
        // Inform the client that the access has been denied.
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
    // Reads the client cookies.
    const cookies = parseCookies(req.headers.cookie);

    // If there is an access token, and it is valid, then it will return the user ID.
    if (cookies.accessToken) {
        const accessToken = validateAccessToken(cookies.accessToken);
        if (accessToken) {
            return accessToken.userId;
        } else if (cookies.refreshToken) { // Request new access token.
            return refreshHandler(res, cookies.refreshToken);
        }
    } else if (cookies.refreshToken) { // Request new access token.
        return refreshHandler(res, cookies.refreshToken);
    } else {
        // If the client is attempting to access resources that they should be logged in to see.
        if (!['/', '/css/login.css', '/js/login.js'].includes(req.url) && req.method === 'GET') {
            // Redirect user to login page if they are not already there.
            redirect(res, '/');
        }
        return null; // Returning null means that the client is not yet logged in.
    }
}



/* **************************************************
                        Cookies
   ************************************************** */

/** Send the cookies to the client. */
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
            `Secure;`+ // Only works with https.
            `SameSite=Strict;` +
            `Expires=${refreshExpire.toUTCString()};` +
            `Path=/`
        );
    }
    if (obj.accessToken) {
        header.push(
            `accessToken=${obj.accessToken};` +
            `HttpOnly;` +
            `Secure;` + // Only works with https.
            `SameSite=Strict;` +
            `Expires=${accessExpire.toUTCString()};` +
            `Path=/`
        );
    }
    // Adds the cookie data to the header of the response object.
    res.setHeader('Set-Cookie', header);
}

/** Function to read the cookies. */
function parseCookies(cookieHeader = '') {
    return cookieHeader
    .split(';') // Splits "refreshToken=value; accessToken=value" into ["refreshToken=value", " accessToken=value"].
    .map(c => c.trim().split('=')) // Trims whitespace from the ends, and then splits them into ["refreshToken", "value"].
    .reduce((acc, [k, v]) => { // For all keyword-value pairs, check if there is a keyword, then add the decoded value to accumulator.
        if (k) acc[k] = decodeURIComponent(v); // Unicode decoding turns "%20" into " " etc.
        return acc;
    }, {}); // The "{}" here is the initial value of the accumulator, which is an empty object.
}
