/* **************************************************
                    Import & Export
   ************************************************** */
import { pool } from './server.js';
import { validateAccessToken,
         parseCookies,
         accessTokenLogin } from './app.js';
export { handleWebSocketConnection };

import { WebSocket } from 'ws';

/* **************************************************
            // WebSocket Server & Request Handling
   ************************************************** */

// Use a Set to store connected clients
let clients = new Set(); 

function handleWebSocketConnection(wss, req, res) {
    const cookies = parseCookies(req.headers.cookie);
    let userId = null;

    // Checks if the access token is in the cookie.
    if (cookies.accessToken) {
        // Verifies the access token.
        const accessToken = validateAccessToken(cookies.accessToken);

        // If the access token is valid, extract the userId from it. If no access token is found, the WebSocket connection is closed.
        if (accessToken) {
            userId = accessToken.userId;
        } else {
            return wss.close();
        }
    } else {
        return wss.close();
    }

    // Add the new client to the set of clients.
    clients.add(wss);

    // Send the chat history to the new client.
    getMessages(wss); 

    // Event listener for incoming WebSocket messages. Parses the message, stores it in the database, and broadcasts the updated chat to all clients.    
    wss.on('message', async (message) => {
        try {
            let access = accessTokenLogin(req, res);

            if (!access && !cookies.refreshToken) {
                wss.send(JSON.stringify({ type: 'auth-expired' }));
                wss.close(4001, 'Access token is missing or invalid.');
                return;
            }

            // Parse the incoming message as JSON
            const parsedMessage = JSON.parse(message); 

            // Generate a timestamp for the message
            const timestamp = generateTimestamp(); 

            // Adds the message to the database
            await addMessage(userId, parsedMessage.message, timestamp);

            // Broadcast the full updated chat to all connected clients
            broadcastMessage();
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });
    // Event listener for when the WebSocket connection is closed. Removes the client from the set of clients.
    wss.on('close', () => {
        clients.delete(wss);
    });

    // Event listener for errors.
    wss.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    /* wss.on('upgrade', (req, socket, head) => {
    if (req.url === '/ws') {
        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req);
        });
    } else {
        socket.destroy(); // Reject other upgrade paths
    } */
});
}

/**
 * Iterates through all connected WebSocket clients and sends them the latest chat history.
 * Skips any clients that are not currently open, so user who doesn't have the chat open.
 */
async function broadcastMessage() {
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            await getMessages(client); // Send updated chat history to each client
        } else {
            console.log('Client is not open, skipping...');
        }
    }
}

/** Send all messages from chat to client */
function sendChat(ws, res) {
    // Send the chat messages to the WebSocket client
    ws.send(JSON.stringify({ messages: res }));
}

/** Generates a timestamp for the message - adds 2 hours for local time. */
function generateTimestamp() {
    return new Date(new Date().getTime()).toISOString();
}


/* **************************************************
            Database Connection and Queries
   ************************************************** */

/** Retrieves the chat_id from the database */
async function getChat_Id() {
    // The pg library prevents SQL injections using the following setup.
    const text = `SELECT chat_id 
                  FROM chat.Chats LIMIT 1`;

    try {
        const res = await pool.query(text);

        // Checks if there are any rows in the chat.Chats table.
        if (res.rowCount === 0) {
            console.error('No chats found in the chat.Chats table.');
            return null;
        }

        // Returns the first row from chat.Chats table.
        return res.rows[0].chat_id;
    } catch (err) {
        console.error('Query erorr', err.stack);
        return null;
    }

}

/** Adds a message to the database. */
async function addMessage(user_id, text, timestamp) {    
    try {
        // Retrieve the chat_id.
        const chat_id = await getChat_Id();
        if (!chat_id) {
            throw new Error('Could not find chat_id');
        }

        // Inserts the message into the database.
        // The pg library prevents SQL injections using the following setup.
        const query = `INSERT INTO chat.Messages (chat_id, user_id, text, timestamp) 
                       VALUES ($1, $2, $3, $4)`;
        const values = [chat_id, user_id, text, timestamp];

        await pool.query(query, values);

        } catch (err) {
    console.error('Query error', err.stack);
    }
}
    
/** Retrieves all messages from the database and sends them to the client. */
async function getMessages(ws) {
    try {
        // Retrieve the chat_id.
        const chat_id = await getChat_Id();
        if (!chat_id) {
            throw new Error('Could not find chat_id');
        }
        // Retrieves all messages for a specific chat_id, joizeng project.Users to get usernames instead of user_id.
        // The pg library prevents SQL injections using the following setup.
        const query =`SELECT m.text, m.timestamp, u.username 
                      FROM chat.Messages m 
                      JOIN project.Users u 
                      ON m.user_id = u.user_id 
                      WHERE m.chat_id = $1 
                      ORDER BY m.timestamp ASC`;
        const values = [chat_id];
        
        const res = await pool.query(query, values);

        // Send all messages in chat to client.
        sendChat(ws, res.rows);
    } catch (err) { 
        console.error('Error fetching messages:', err.stack);
    }
}