/* **************************************************
                    Import & Export
   ************************************************** */

import { pool } from './server.js';
export { handleWebSocketConnection };

/* **************************************************
            // WebSocket Server & Request Handling
   ************************************************** */

let clients = new Set(); // Use a Set to store connected clients

/** Generates a timestamp for the message - adds 2 hours for local time. */
function generateTimestamp() {
    return new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString();
}

function handleWebSocketConnection(ws) {
    clients.add(ws);

    getMessages(ws);
    broadcastMessage();

    ws.on('message', async (message) => {
        try {
            const parsedMessage = JSON.parse(message); // Parse the incoming message as JSON
            const timestamp = generateTimestamp();     // Generate a timestamp for the message
            // Adds the message to the database
            await addMessage(parsedMessage.sender, parsedMessage.message, timestamp);
            // Sends updated chat to all clients connected.
            broadcastMessage();
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

}

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


/* **************************************************
            Database Connection and Queries
   ************************************************** */

async function getUserIdByUsername(username) {
    // The pg library prevents SQL injections using the following setup.
    const text = 'SELECT user_id FROM project.Users WHERE username = $1';
    const values = [username];

    try {
        const res = await pool.query(text, values);

        if (res.rowCount === 0) {
            console.error(`User not found for username: ${username}`);
            return null;
        }

        return res.rows[0].user_id;
    } catch (err) {
        console.error('Error fetching user_id:', err.stack);
        return null;
    }
}

async function getChat_Id() {
    // The pg library prevents SQL injections using the following setup.
    const text = 'SELECT chat_id FROM chat.Chats LIMIT 1';

    try {
        const res = await pool.query(text);

        if (res.rowCount === 0) {
            console.error('No chats found in the project.Chats table.');
            return null;
        }

        return res.rows[0].chat_id;
    } catch (err) {
        console.error('Query erorr', err.stack);
        return null;
    }

}

async function addMessage(username, text, timestamp) {    
    try {
        // Retrieve the chat_id.
        const chat_id = await getChat_Id();
        if (!chat_id) {
            throw new Error('Could not find chat_id');
        }

        // Retrieve the user_id based on the username.
        const user_id = await getUserIdByUsername(username);
        if (!user_id) {
            throw new Error('Could not find user');
        }
        
        const query = 'INSERT INTO chat.Messages (chat_id, user_id, text, timestamp) VALUES ($1, $2, $3, $4)';
        const values = [chat_id, user_id, text, timestamp];
    
        await pool.query(query, values);

        } catch (err) {
    console.error('Query error', err.stack);
    }
}
    
async function getMessages(ws) {
    try {
        // Retrieve the chat_id.
        const chat_id = await getChat_Id();
        if (!chat_id) {
            throw new Error('Could not find chat_id');
        }
        // Retrieves all messages for a specific chat_id, joizeng project.Users to get usernames instead of user_id.
        // The pg library prevents SQL injections using the following setup.
        const query ='SELECT m.text, m.timestamp, u.username FROM chat.Messages m JOIN project.Users u ON m.user_id = u.user_id WHERE m.chat_id = $1 ORDER BY m.timestamp ASC';
        const values = [chat_id];
    
        const res = await pool.query(query, values);
        // Send all messages in chat to client.
        sendChat(ws, res.rows);
    } catch (err) { 
        console.error('Error fetching messages:', err.stack);
    }
}