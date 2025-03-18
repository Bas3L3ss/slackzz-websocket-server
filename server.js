require("dotenv").config(); // Load .env variables
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");
const Redis = require("ioredis");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const BASE_URL = process.env.BASE_URL;
// Connect to Redis
const redis = new Redis(process.env.REDIS_URL, {
  tls: { rejectUnauthorized: false }, // Required for Upstash (if using TLS)
});

const disconnectTimers = new Map();

app.get("/", (req, res) => {
  res.send("WebSocket server is running");
});

io.on("connection", (socket) => {
  console.log(`[Connection] User connected: ${socket.id}`);

  socket.on("register", async (userData) => {
    console.log(`[Register] User registered:`, userData);

    // Save socket-specific data
    await redis.hset(
      `socket:${socket.id}`,
      "userId",
      userData.userId,
      "token",
      userData.token
    );

    // Increment the user's connection counter
    const connectionsCount = await redis.incr(
      `user:${userData.userId}:connections`
    );
    console.log(
      `[Register] User ${userData.userId} now has ${connectionsCount} connections`
    );

    if (connectionsCount === 1) {
      try {
        await axios.post(
          `${BASE_URL}/api/presence/update`,
          {
            userId: userData.userId,
            status: "online",
          },
          {
            headers: {
              Authorization: `Bearer ${userData.token}`,
            },
          }
        );
        console.log(
          `[Register] Successfully updated online status for user: ${userData.userId}`
        );
      } catch (error) {
        console.error(
          `[Register] Failed to update online status for user ${userData.userId}:`,
          error.message
        );
      }
    }

    // Clear any pending disconnection timer
    if (disconnectTimers.has(socket.id)) {
      clearTimeout(disconnectTimers.get(socket.id));
      disconnectTimers.delete(socket.id);
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Disconnect] User disconnected: ${socket.id}`);

    disconnectTimers.set(
      socket.id,
      setTimeout(async () => {
        try {
          // Get user data for this socket
          const userData = await redis.hgetall(`socket:${socket.id}`);

          if (userData && userData.userId) {
            // Decrement connection counter
            const remainingConnections = await redis.decr(
              `user:${userData.userId}:connections`
            );
            console.log(
              `[Disconnect] User ${userData.userId} now has ${remainingConnections} connections`
            );

            // Only update status to offline if this was their last connection
            if (remainingConnections <= 0) {
              // Ensure counter doesn't go negative
              await redis.set(`user:${userData.userId}:connections`, 0);

              try {
                await axios.post(
                  `${BASE_URL}/api/presence/update`,
                  {
                    userId: userData.userId,
                    status: "offline",
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${userData.token}`,
                    },
                  }
                );
                console.log(
                  `[Disconnect] Successfully updated offline status for user: ${userData.userId}`
                );
              } catch (error) {
                console.error(
                  `[Disconnect] Failed to update offline status for user ${userData.userId}:`,
                  error.message
                );
              }
            }

            // Clean up socket data
            await redis.del(`socket:${socket.id}`);
          }
        } catch (error) {
          console.error("[Disconnect] Error handling disconnection:", error);
        }

        disconnectTimers.delete(socket.id);
      }, 1000)
    );
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
