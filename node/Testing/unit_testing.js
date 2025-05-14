// Import functions to test. IMPORTANT!! The startServer() call (app.js line 37) should not run.
import { validateLogin } from '../PrivateResources/app.js';
import { securePath } from '../PrivateResources/server.js';

/**
 * Function for comparing in the unit testing function.
 * @param {*} a First entity.
 * @param {*} b Second entity.
 * @returns True if they are the same. False otherwise.
 */
function deepEqual(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
        return a.length === b.length && a.every((val, i) => deepEqual(val, b[i]));
    }
    return a === b;
}

/**
 * Function for unit testing.
 * @param {*} func The function to test.
 * @param {*} input The parameters to use in the functions.
 * @param {*} expectedOutput The expected output with the given input.
 */
function unitTest(func, input, expectedOutput) {
    // Feeds the input to the function and saves the result.
    const result = func(...input);

    // Compares the result to the expected output.
    const passed = deepEqual(result, expectedOutput);

    // Logs the result.
    console.log(`Test ${passed ? 'PASSED' : 'FAILED'}\nExpected: ${expectedOutput}\nGot: ${result}\n`);
}

/**
 * Test the securePath function.
 */
function securePathTest() {
    console.log('Testing the securePath function.\n');
    // Do update the expected output, as this one is tailored to my (Anders) system.
    // Normal input.
    unitTest(securePath, ['/html/login.html'], 'c:\\Users\\Bruger\\Documents\\Github\\P2_Project\\node\\PublicResources\\html\\login.html');
    
    // Input trying to access parent folder.
    unitTest(securePath, ['../..\\../html/login.html'], 'c:\\Users\\Bruger\\Documents\\Github\\P2_Project\\node\\PublicResources\\html\\login.html');
    
    // Input containing the letter NULL.
    unitTest(securePath, ['test\0'], undefined);
}

function validateLoginTest() {
    console.log('Testing the validateLogin function.\n');

    // Normal input.
    unitTest(validateLogin, ['Anders', '19ea4ac2e1a53b1267fe5a61a3b6b81f760ce4223a25b495a5e2b6183da68717'], ['Anders', '19ea4ac2e1a53b1267fe5a61a3b6b81f760ce4223a25b495a5e2b6183da68717']);
    
    // Incorrect username and password format.
    unitTest(validateLogin, ['A', 'anders'], [null, null]);
    
    // Illegal characters. Illegal character in password is added to correct length.
    unitTest(validateLogin, ['And\0ers', '19ea4ac2e1a53b1267fe5a61a3b6b81f760ce4223a25b495a5e2b6183da68717*&%'], ['Anders', '19ea4ac2e1a53b1267fe5a61a3b6b81f760ce4223a25b495a5e2b6183da68717']);
}

function runUnitTests() {
    console.log('\nStart of Unit Testing!\n');
    securePathTest();
    validateLoginTest();
    console.log('End of Unit Testing!\n');
}

runUnitTests();
