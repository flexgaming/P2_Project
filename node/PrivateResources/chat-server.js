/* **************************************************
                    Import & Export
   ************************************************** */
/*import { pool, wsServer } from './server.js';*/

/* **************************************************
            WebSocket Server & Request Handling
   ************************************************** */
/*let clients = new Set(); // Use a Set to store connected clients

function generateTimestamp() {
    return new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString();
}

wsServer.on('connection', async (ws) => {
    console.log('WebSocket connection established!');
    clients.add(ws);

    try {
        const chat_id = await getChat_Id(); // Retrieve the chat_id before using it
        if (chat_id) {
            getMessages(chat_id, ws); // Fetch messages for when someone opens the chat.
        } else {
            console.error('Unable to fetch messages: chat_id is undefined.');
        }
    } catch (error) {
        console.error('Error fetching chat_id:', error);
    }

    ws.on('message', async (message) => {
        try {
            // Parse the incoming message as JSON
            const parsedMessage = JSON.parse(message);

            // Log the received message
            console.log(`Received message from ${parsedMessage.sender}: ${parsedMessage.message}`);

            // Generates a timestamp for the message.
            const timestamp = generateTimestamp();

            // Sends and adds the message to the database, retrieves all messages from chat, and displays them.
            sendMessage(parsedMessage.sender, parsedMessage.message, timestamp, ws);
            broadcastMessage(JSON.stringify({ sender: parsedMessage.sender, message: parsedMessage.message, timestamp: timestamp }));

        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed!');
        clients.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});*/

/**
 * Broadcast a message to all connected clients.
 * @param {string} message - The message to broadcast (in JSON format).
 */
/*function broadcastMessage(message) {
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
}*/

/* **************************************************
            Database Connection and Queries
   ************************************************** */
/*

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

async function sendMessage(username, text, timestamp, ws) {    
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
        console.log('Query:', query, 'values:', values);
    
        await pool.query(query, values);

        await getMessages(chat_id, ws); // Fetch messages after sending a new one

        } catch (err) {
    console.error('Query error', err.stack);
    }
}
    
async function getMessages(chat_id, ws) {
        // Retrieves all messages for a specific chat_id, joining project.Users to get usernames instead of user_id.
        // The pg library prevents SQL injections using the following setup.
        const query ='SELECT m.text, m.timestamp, u.username FROM chat.Messages m JOIN project.Users u ON m.user_id = u.user_id WHERE m.chat_id = $1 ORDER BY m.timestamp ASC';
        const values = [chat_id];
    try {
        const res = await pool.query(query, values);
        console.log('Messages:', res.rows);
        ws.send(JSON.stringify({ type: "chat_history", messages: res.rows }));
    } catch (err) {
        console.error('Error fetching messages:', err.stack);
    }
}*/