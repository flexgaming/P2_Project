// Function to handle incorrect input and show error message
function showError(message) {
    event.preventDefault(); // Prevent form submission
    const errorMessage = document.getElementById('error');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block'; // Show error message
}

// MD5 implementation in JavaScript
function md5(string) {
    // Step 1: Define helper functions
    function rotateLeft(value, shift) {
        return (value << shift) | (value >>> (32 - shift));
    }
    function F(x, y, z) {
        return (x & y) | (~x & z);
    }
    function G(x, y, z) {
        return (x & z) | (y & ~z);
    }
    function H(x, y, z) {
        return x ^ y ^ z;
    }
    function I(x, y, z) {
        return y ^ (x | ~z);
    }

    const T = [
        0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
        0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
        // (Omitting for brevity)
    ];

    let a = 0x67452301;
    let b = 0xefcdab89;
    let c = 0x98badcfe;
    let d = 0x10325476;

    let input = unescape(encodeURIComponent(string));
    let length = input.length * 8;

    input += String.fromCharCode(0x80);
    while (input.length % 64 !== 56) {
        input += String.fromCharCode(0);
    }

    for (let i = 0; i < input.length; i += 64) {
        let chunk = input.substring(i, i + 64);
        for (let j = 0; j < 16; j++) {
            let f, g;
            if (j < 16) {
                f = F(b, c, d);
                g = j;
            } else if (j < 32) {
                f = G(b, c, d);
                g = (5 * j + 1) % 16;
            } else if (j < 48) {
                f = H(b, c, d);
                g = (3 * j + 5) % 16;
            } else {
                f = I(b, c, d);
                g = (7 * j) % 16;
            }

            let temp = d;
            d = c;
            c = b;
            b = b + rotateLeft(a + f + T[j] + chunk[g], 7);
            a = temp;
        }
    }

    return [a, b, c, d].map(num => num.toString(16)).join('');
}

// JavaScript for input validation and password hashing
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission

    // Get input values
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // Simple validation logic
    if (username.length < 3) {
        showError('Username must be at least 3 characters long!');
        return;
    } else if (username.length > 50) {
        showError('Username can max be 50 characters long!');
        return;
    } else if (password.length < 6) {
        showError('Password must be at least 6 characters long!');
        return;
    } else if (password.length > 50) {
        showError('Password can max be 50 characters long!');
        return;
    }

    // If validation passes, hash the password
    const hashedPassword = md5(password);

    // Replace the plain password with the hashed password
    document.getElementById('password').value = hashedPassword;

    // Optionally, hide error message if inputs are valid
    document.getElementById('error').style.display = 'none';

    // Submit the form
    document.getElementById('loginForm').submit();
});