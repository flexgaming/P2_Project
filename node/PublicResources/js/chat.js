// Wait for the DOM to fully load before running the script
document.addEventListener('DOMContentLoaded', () => {
    // Get references to the form, input field, and chat messages container
    const chatForm = document.getElementById('chat-form');
    const inputField = document.getElementById('input-field');
    const chatMessagesContainer = document.getElementById('chat-messages-container');

    // Placeholder username for the chat messages
    const username = localStorage.getItem('username') || 'Uff username not recognized'; // Get the username from local storage

    // Create a WebSocket connection
    const chatSocket = new WebSocket('ws://127.0.0.1:80');

    // WebSocket event listeners
    chatSocket.addEventListener('open', () => {
        console.log('Connected to WebSocket server');
    });

    chatSocket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
    
        if (data.type === 'chat_history') {
            data.messages.forEach((message) => {
                const newMessage = createChatMessage(message.text, message.username, reformatTimestamp(message.timestamp));
                chatMessagesContainer.appendChild(newMessage);
            });
    
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        } else if (data.sender && data.message) {
            // Handle new messages
            const newMessage = createChatMessage(data.message, data.sender, reformatTimestamp(data.timestamp));
            chatMessagesContainer.appendChild(newMessage);
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }
    });

    /**
     * Function to get the current timestamp in HH:MM format
     * @returns {string} The current time as a string
     */
/*     function getCurrentTimestamp() {
        const now = new Date(); // Get the current date and time
        const hours = String(now.getHours()).padStart(2, '0'); // Format hours to always have 2 digits
        const minutes = String(now.getMinutes()).padStart(2, '0'); // Format minutes to always have 2 digits
        return `${hours}:${minutes}`; // Return the formatted time
    }
  */
    function reformatTimestamp(timestamp) {
        const date = new Date(timestamp); // Create a Date object from the timestamp
        const timeFormat = { hour: '2-digit', minute: '2-digit', hour12: false }; // Format options for 24-hour time
        return date.toLocaleTimeString('en-US', timeFormat); // Format the time and return it as a string
    }

    /**
     * Function to create a new chat message element
     * @param {string} content - The text content of the chat message
     * @returns {HTMLElement} The chat message element
     */

    function createChatMessage(content, senderUsername, timestamp) {
         // Create the main container for the chat message
         const chatMessage = document.createElement('div');
         chatMessage.className = 'chat-message'; // Add the 'chat-message' class for styling

         // Create the header for the chat message (username and timestamp)
         const messageHeader = document.createElement('div');
         messageHeader.className = 'message-header'; // Add the 'message-header' class for styling

         // Create the username element and set its text
         const usernameElement = document.createElement('p');
         usernameElement.textContent = senderUsername;

         // Create the timestamp element and set its text
         const timestampElement = document.createElement('p');
         timestampElement.textContent = timestamp;

         // Append the username and timestamp to the message header
         messageHeader.appendChild(usernameElement);
         messageHeader.appendChild(timestampElement);

         // Create the content container for the chat message
         const messageContent = document.createElement('div');
         messageContent.className = 'chat-message-content'; // For styling

         // Create the paragraph element for the message text and set its content
         const messageText = document.createElement('p');
         messageText.textContent = content;

         // Append the message text to the content container
         messageContent.appendChild(messageText);

         // Append the header and content containers to the main chat message container
         chatMessage.appendChild(messageHeader);
         chatMessage.appendChild(messageContent);

         // Return the complete chat message element
         return chatMessage;
     }

    /**
     * Event listener for the form submission
     * Prevents the default form submission behavior and handles the chat message creation
     */
    chatForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent the form from submitting and refreshing the page
    
        // Get the value of the input field
        const messageContent = inputField.value;
    
        // Check if the input field is not empty
        if (messageContent) { 
            chatSocket.send(JSON.stringify({
                sender: username, // Include the sender's username
                message: messageContent // Include the message content
            }));
    
            // Create a new chat message element for the sender
            const newMessage = createChatMessage(messageContent, username);
            chatMessagesContainer.appendChild(newMessage);
    
            // Scroll to the bottom of the chat container to show the new message
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    
            // Clear the input field for the next message
            inputField.value = '';
        }
    });

    /**
     * Event listener for the "Enter" key in the textarea
     * Submits the form when "Enter" is pressed
     */
    inputField.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevent adding a new line
            chatForm.dispatchEvent(new Event('submit')); // Trigger the form submission
        }
    });
});

