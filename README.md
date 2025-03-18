# WebSocket Server for Slackzz Clone

This `server.js` file sets up a WebSocket server using Node.js, Express, and Socket.IO. It handles real-time communication for a Slack-like application, allowing users to connect, disconnect, and maintain their online presence status.

## Key Components

### 1. Environment Configuration

- The server uses `dotenv` to load environment variables from a `.env` file.
- These variables include sensitive information like `BASE_URL`, `REDIS_URL`, and `PORT`.

### 2. Express and HTTP Server

- An Express application is created to handle HTTP requests.
- The server listens on a specified port and provides a simple endpoint to confirm that it is running.

### 3. Socket.IO Integration

- `Socket.IO` is used to manage WebSocket connections.
- It enables real-time, bidirectional communication between the server and clients.

### 4. Redis for State Management

- `Redis` is used to store and manage user connection data.
- It tracks the number of active connections per user, which is crucial for determining their online status.

### 5. Connection Handling

- When a user connects, their socket ID is registered, and their connection count is incremented.
- If it's their first connection, their status is updated to **"online"** via an API call.

### 6. Disconnection Handling

- When a user disconnects, a timer is set to handle potential reconnections.
- If the user does not reconnect within a specified time, their connection count is decremented.
- If no connections remain, their status is updated to **"offline"**.

## Importance

### 🔹 Multiple Tabs/Devices Support

- The server tracks the number of active connections per user.
- This ensures that a user is only marked as **"offline"** when all their connections are closed.

### 🔹 Real-time Presence Updates

- By integrating with an external API, the server updates user presence in real time.
- This allows other users to see accurate **online/offline** statuses.

### 🔹 Scalability

- Using `Redis` for state management allows the server to scale efficiently.
- Redis can handle a large number of operations per second and is well-suited for distributed systems.

### 🔹 Resilience

- The use of **disconnection timers** helps manage temporary network issues.
- This reduces false offline status updates when a user briefly loses connection.

---

This setup is essential for providing a seamless and responsive user experience in a real-time communication application like **Slackzz**. It ensures that user presence is accurately tracked and updated, even in complex scenarios involving multiple connections.
