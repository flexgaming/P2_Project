// Wait for the DOM to fully load before running the script
document.addEventListener('DOMContentLoaded', () => {
    // Get references to the form, input field, and chat messages container
    const chatForm = document.getElementById('chat-form');
    const inputField = document.getElementById('input-field');
    const chatMessagesContainer = document.getElementById('chat-messages-container');

    // Create a WebSocket connection #Using 'wss' for 'https'
    const chatSocket = new WebSocket('ws://127.0.0.1:3000');

    // WebSocket event listeners
    chatSocket.addEventListener('open', () => {
        console.log('Open: Connected to WebSocket server');
    });

    chatSocket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'auth-expired') {
            window.location.href = '/login';
        }

        chatMessagesContainer.innerHTML = ''; // Clear the chat messages container
        data.messages.forEach((message) => {
            const newMessage = createChatMessage(
                message.text,
                message.username,
                reformatTimestamp(message.timestamp) // Reformat the timestamp
            );
            chatMessagesContainer.appendChild(newMessage);
        });

        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    });

    chatSocket.addEventListener('close', (event) => {
        if (event.code === 4001) {
            window.location.href = '/login';
        }
    });

    /** Reformats the timestamp from '2025-05-10T19:02:46.680Z' to '10. May. 19:02 */
    function reformatTimestamp(timestamp) {
        const date = new Date(timestamp); // Parse the timestamp
        // Creates an array of month names
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        const month = months[date.getMonth()]; // getMonth outputs a between 0-11, so we use it to get the month name
        const day = String(date.getDay()).padStart(2, '0'); // Get the day
        const hours = String(date.getHours()).padStart(2, '0'); // Get the hours
        const minutes = String(date.getMinutes()).padStart(2, '0'); // Get the minutes
        return `${day}. ${month}. ${hours}.${minutes}`; // Return in DD. MMM. HH.MM format
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
     * Extract the form submission logic into a separate function
     */
    function handleFormSubmit() {
        // Get the value of the input field
        const messageContent = inputField.value;

        // Check if the input field is not empty
        if (messageContent) {
            chatSocket.send(JSON.stringify({
                message: messageContent // Sends the users message
            }));
            
            // Clear the input field for the next message
            inputField.value = '';
        }
    }

    /**
     * Update the form's submit event listener to use the new function
     */
    chatForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent the form from submitting and refreshing the page
        handleFormSubmit(); // Call the form submission logic
    });

    /**
     * Event listener for the "Enter" key in the textarea
     * Submits the form when "Enter" is pressed
     */
    inputField.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevent adding a new line
            handleFormSubmit(); // Call the form submission logic directly
        }
    });
});

