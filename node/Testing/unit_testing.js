// Import functions to test. IMPORTANT!! The startServer() call (app.js line 37) should not run.
import { validateLogin,
         validateAccessToken,
         generateTokens,
         parseCookies } from '../PrivateResources/app.js';
import { securePath } from '../PrivateResources/server.js';

let totalTests = 0;
let passedTests = 0;

/**
 * Function for comparing in the unit testing function.
 * @param {*} a First entity.
 * @param {*} b Second entity.
 * @returns True if they are the same. False otherwise.
 */
function deepEqual(a, b) {
    // Checks if they are primitively the same (e.g. 4 === 4).
    if (a === b) return true;

    // If they are not objects in this case, return false (arrays are a type of object in JS).
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
        return false;
    }

    // If one of them is an array while the other is not an array, return false.
    if (Array.isArray(a) !== Array.isArray(b)) {
        return false;
    }

    // Saves the keys to two constants.
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    // Checks if they have the same amount of keys, if not, return false.
    if (keysA.length !== keysB.length) {
        return false;
    }

    /* Checks if all keys in A satisfies the condition to the right of the =>
    The condition is that B has the same key, and that the values in those keys
    are the exact same recursively. */
    return keysA.every(key => keysB.includes(key) && deepEqual(a[key], b[key]));
}

/**
 * Function for unit testing.
 * @param {*} func The function to test.
 * @param {*} input The parameters to use in the functions.
 * @param {*} expectedOutput The expected output with the given input.
 */
function unitTest(func, input, expectedOutput) {
    totalTests += 1;

    // Feeds the input to the function and saves the result.
    const result = func(...input);

    // Compares the result to the expected output.
    const passed = deepEqual(result, expectedOutput);

    // Helper to stringify objects/arrays, but leave primitives as-is
    function pretty(val) {
        if (typeof val === 'object' && val !== null) {
            return JSON.stringify(val, null, 2);
        }
        return String(val);
    }

    // Logs the result.
    console.log(`Test ${passed ? 'PASSED' : 'FAILED'}\nExpected: ${pretty(expectedOutput)}\nGot: ${pretty(result)}\n`);

    if (passed) passedTests += 1;
}

/**
 * Test the securePath function.
 */
function securePathTest() {
    console.log('Testing the securePath function.\n');
    // Do update the expected output, as this one is tailored to my (Anders) system.
    // Normal input.
    const input1 = ['/html/login.html'];
    const expectedOutput1 = 'c:\\Users\\Bruger\\Documents\\Github\\P2_Project\\node\\PublicResources\\html\\login.html';
    unitTest(securePath, input1, expectedOutput1);
    
    // Input trying to access parent folder.
    const input2 = ['../..\\../html/login.html'];
    const expectedOutput2 = 'c:\\Users\\Bruger\\Documents\\Github\\P2_Project\\node\\PublicResources\\html\\login.html';
    unitTest(securePath, input2, expectedOutput2);
    
    // Input containing the letter NULL.
    const input3 = ['test\0'];
    const expectedOutput3 = undefined;
    unitTest(securePath, input3, expectedOutput3);
}

function validateLoginTest() {
    console.log('Testing the validateLogin function.\n');

    // Normal input.
    const input1 = ['Anders', '19ea4ac2e1a53b1267fe5a61a3b6b81f760ce4223a25b495a5e2b6183da68717'];
    const expectedOutput1 = ['Anders', '19ea4ac2e1a53b1267fe5a61a3b6b81f760ce4223a25b495a5e2b6183da68717'];
    unitTest(validateLogin, input1, expectedOutput1);
    
    // Incorrect username and password format.
    const input2 = ['A', 'anders'];
    const expectedOutput2 = [null, null];
    unitTest(validateLogin, input2, expectedOutput2);
    
    // Illegal characters. Illegal character in password is added to correct length.
    const input3 = ['And\0ers', '19ea4ac2e1a53b1267fe5a61a3b6b81f760ce4223a25b495a5e2b6183da68717*&%']
    const expectedOutput3 = ['Anders', '19ea4ac2e1a53b1267fe5a61a3b6b81f760ce4223a25b495a5e2b6183da68717']
    unitTest(validateLogin, input3, expectedOutput3);
}

function validateAccessTokenTest() {
    console.log('Testing the validateAccessToken function.\n');
    // Do update the expected output, as this one is tailored to my (Anders) database.
    // Normal input.
    const input1 = ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI1LCJpYXQiOjE3NDcyMjMxMTgsImV4cCI6MTc0NzIyNDkxOH0.ETjGaKqrA5nbz-UCBTA-dfodyTZcTyANsOnK964KKmU'];
    const expectedOutput1 = { userId: 25, iat: 1747223118, exp: 1747224918 };
    unitTest(validateAccessToken, input1, expectedOutput1);

    // Random input.
    const input2 = ['Hello very random indeed.'];
    const expectedOutput2 = null;
    unitTest(validateAccessToken, input2, expectedOutput2);

    // Expired token.
    const input3 = ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIzLCJpYXQiOjE3NDcyMjEyMjksImV4cCI6MTc0NzIyMzAyOX0.itvpyedW2WhRAiLad09gZ9I0SpynJKHtJQ2c5Y-PSYs'];
    const expectedOutput3 = null;
    unitTest(validateAccessToken, input3, expectedOutput3);
}

function generateTokensTest() {
    console.log('Testing the generateTokens function.\n');

    // Tests with normal input.
    const input1 = [1];
    const expectedOutput1 = {
        accessToken: 'string',
        refreshToken: 'string'
    };

    unitTest(
        (userId) => {
            const result = generateTokens(userId);
            if (
                result &&
                typeof result.accessToken === 'string' &&
                typeof result.refreshToken === 'string'
            ) {
                return { accessToken: 'string', refreshToken: 'string' };
            }
            return result;
        },
        input1,
        expectedOutput1
    );
}

function parseCookiesTest() {
    console.log('Testing the parseCookies function.\n');

    // Tests with empty string.
    const input1 = [''];
    const expectedOutput1 = {};
    unitTest(parseCookies, input1, expectedOutput1);

    // Tests with normal input.
    const input2 = ['refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsImlhdCI6MTc0NzI5MTg5MSwiZXhwIjoxNzQ3ODk2NjkxfQ.2dMlBX_7sT9E51zpCb95-98vbGKhrD41S_PhVqR0VH4; accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsImlhdCI6MTc0NzI5MTg5MSwiZXhwIjoxNzQ3MjkzNjkxfQ.IozVtMPuzxyFYqnDYrq82dnDfJAayfdr92Ag0-9aD88'];
    const expectedOutput2 = {
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsImlhdCI6MTc0NzI5MTg5MSwiZXhwIjoxNzQ3ODk2NjkxfQ.2dMlBX_7sT9E51zpCb95-98vbGKhrD41S_PhVqR0VH4',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsImlhdCI6MTc0NzI5MTg5MSwiZXhwIjoxNzQ3MjkzNjkxfQ.IozVtMPuzxyFYqnDYrq82dnDfJAayfdr92Ag0-9aD88'
        };
    unitTest(parseCookies, input2, expectedOutput2);

    // Tests with trimming and decoding.
    const input3 = ['  accessToken=abc%20123  ;   refreshToken=def%20456  '];
    const expectedOutput3 = { accessToken: 'abc 123', refreshToken: 'def 456' }
    unitTest(parseCookies, input3, expectedOutput3);

}

function runUnitTests() {
    console.log('\nStart of Unit Testing!\n');
    securePathTest();
    validateLoginTest();
    validateAccessTokenTest();
    generateTokensTest();
    parseCookiesTest();
    console.log(`End of Unit Testing!\nScore: ${passedTests}/${totalTests} tests passed\n`);
}

runUnitTests();
