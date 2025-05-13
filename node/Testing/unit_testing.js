// Import functions to test. IMPORTANT!! The startServer() call (app.js line 37) should not run.
import { securePath } from '../PrivateResources/server.js';
import { validateLogin } from '../PrivateResources/app.js';

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
    const passed = result === expectedOutput;

    // Logs the result.
    console.log(`Test ${passed ? 'PASSED' : 'FAILED'}\nExpected: ${expectedOutput}\nGot: ${result}\n`);
}

/**
 * Test the securePath function.
 */
function securePathTest() {
    console.log('Testing the securePath function.\n');
    // Do update the expected output, as this one is tailored to my (Anders) system.
    unitTest(securePath, ['/html/login.html'], 'c:\\Users\\Bruger\\Documents\\Github\\P2_Project\\node\\PublicResources\\html\\login.html');
    unitTest(securePath, ['../..\\../html/login.html'], 'c:\\Users\\Bruger\\Documents\\Github\\P2_Project\\node\\PublicResources\\html\\login.html');
    unitTest(securePath, ['test\0'], undefined);
}

function runUnitTests() {
    console.log('\nStart of Unit Testing!\n');
    securePathTest();
    console.log('End of Unit Testing!\n');
}

runUnitTests();
