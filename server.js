// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const axios = require("axios");

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:3000",
//     methods: ["GET", "POST"],
//   },
// });

// // Store user data
// const userSockets = new Map();

// app.get("/", (req, res) => {
//   res.send("WebSocket server is running");
// });

// io.on("connection", async (socket) => {
//   console.log("A user connected", socket.id);

//   socket.on("register", async (userData) => {
//     console.log("User registered:", userData);
//     userSockets.set(socket.id, userData);

//     try {
//       const res = await axios.post(
//         "http://localhost:3000/api/presence/update",
//         {
//           userId: userData.userId,
//           status: "online",
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${userData.token}`, // If you need auth
//           },
//         }
//       );
//       console.log(
//         "Successfully updated online status for user:",
//         userData.userId
//       );
//     } catch (error) {
//       console.error("Failed to update online status:", error.message);
//     }
//   });

//   socket.on("disconnect", async () => {
//     console.log("User disconnected", socket.id);
//     const userData = userSockets.get(socket.id);

//     if (userData) {
//       try {
//         await axios.post(
//           "http://localhost:3000/api/presence/update",
//           {
//             userId: userData.userId,
//             status: "offline",
//           },
//           {
//             headers: {
//               Authorization: `Bearer ${userData.token}`, // If you need auth
//             },
//           }
//         );
//         console.log(
//           "Successfully updated offline status for user:",
//           userData.userId
//         );
//       } catch (error) {
//         console.error("Failed to update offline status:", error.message);
//       }

//       userSockets.delete(socket.id);
//     }
//   });
// });

// const PORT = process.env.PORT || 3001;
// server.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });
// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const axios = require("axios");

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:3000",
//     methods: ["GET", "POST"],
//   },
// });

// // Store user data
// const userSockets = new Map();
// const disconnectTimers = new Map(); // To debounce disconnection events

// app.get("/", (req, res) => {
//   res.send("WebSocket server is running");
// });

// io.on("connection", (socket) => {
//   console.log(`[Connection] User connected: ${socket.id}`);

//   socket.on("register", async (userData) => {
//     console.log(`[Register] User registered:`, userData);
//     userSockets.set(socket.id, userData);

//     // Clear any pending disconnection timer
//     if (disconnectTimers.has(socket.id)) {
//       clearTimeout(disconnectTimers.get(socket.id));
//       disconnectTimers.delete(socket.id);
//     }

//     try {
//       const res = await axios.post(
//         "http://localhost:3000/api/presence/update",
//         {
//           userId: userData.userId,
//           status: "online",
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${userData.token}`, // If you need auth
//           },
//         }
//       );
//       console.log(
//         `[Register] Successfully updated online status for user: ${userData.userId}`
//       );
//     } catch (error) {
//       console.error(
//         `[Register] Failed to update online status for user ${userData.userId}:`,
//         error.message
//       );
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log(`[Disconnect] User disconnected: ${socket.id}`);

//     // Debounce disconnection handling to prevent redundant API calls
//     disconnectTimers.set(
//       socket.id,
//       setTimeout(async () => {
//         const userData = userSockets.get(socket.id);

//         if (userData) {
//           try {
//             await axios.post(
//               "http://localhost:3000/api/presence/update",
//               {
//                 userId: userData.userId,
//                 status: "offline",
//               },
//               {
//                 headers: {
//                   Authorization: `Bearer ${userData.token}`, // If you need auth
//                 },
//               }
//             );
//             console.log(
//               `[Disconnect] Successfully updated offline status for user: ${userData.userId}`
//             );
//           } catch (error) {
//             console.error(
//               `[Disconnect] Failed to update offline status for user ${userData.userId}:`,
//               error.message
//             );
//           }

//           userSockets.delete(socket.id); // Clean up
//         }
//         disconnectTimers.delete(socket.id); // Clean up timer
//       }, 1000) // Delay in milliseconds (adjust as needed)
//     );
//   });
// });

// const PORT = process.env.PORT || 3001;
// server.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");
const Redis = require("ioredis");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const redis = new Redis();

const disconnectTimers = new Map();

app.get("/", (req, res) => {
  res.send("WebSocket server is running");
});

io.on("connection", (socket) => {
  console.log(`[Connection] User connected: ${socket.id}`);

  socket.on("register", async (userData) => {
    console.log(`[Register] User registered:`, userData);

    // Save user data in Redis with socket ID as the key
    await redis.hset(
      `socket:${socket.id}`,
      "userId",
      userData.userId,
      "token",
      userData.token
    );

    // Clear any pending disconnection timer from Redis
    if (disconnectTimers.has(socket.id)) {
      clearTimeout(disconnectTimers.get(socket.id));
      disconnectTimers.delete(socket.id);
    }

    try {
      const res = await axios.post(
        "http://localhost:3000/api/presence/update",
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
  });

  socket.on("disconnect", () => {
    console.log(`[Disconnect] User disconnected: ${socket.id}`);

    // Debounce disconnection handling to prevent redundant API calls
    disconnectTimers.set(
      socket.id,
      setTimeout(async () => {
        const userData = await redis.hgetall(`socket:${socket.id}`);

        if (userData && userData.userId) {
          try {
            await axios.post(
              "http://localhost:3000/api/presence/update",
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

          // Clean up user data from Redis
          await redis.del(`socket:${socket.id}`);
        }
        disconnectTimers.delete(socket.id); // Clean up timer
      }, 1000) // Delay in milliseconds (adjust as needed)
    );
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
