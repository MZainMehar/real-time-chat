import { createServer } from "http";
import { Server } from "socket.io";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = 3000;
const users = new Map(); // Store connected users

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`✅ New client connected: ${socket.id}`);

    socket.on("userJoined", (username) => {
      if (username) {
        users.set(socket.id, username);
        io.emit("updateUsers", Array.from(users.values())); // Send updated user list
        io.emit("chatNotification", `${username} joined the chat!`);
      }
    });

    socket.on("sendMessage", (data) => {
      io.emit("receiveMessage", {
        username: data.username,
        message: data.message,
        timestamp: new Date().toLocaleTimeString(),
      });
    });

    socket.on("typing", (username) => {
      socket.broadcast.emit("userTyping", username);
    });

    socket.on("stopTyping", () => {
      socket.broadcast.emit("userStoppedTyping");
    });

    socket.on("privateMessage", ({ recipient, sender, message }) => {
      const recipientSocketId = [...users.entries()].find(
        ([, name]) => name === recipient
      )?.[0];

      if (recipientSocketId) {
        io.to(recipientSocketId).emit("receivePrivateMessage", {
          sender,
          message,
          timestamp: new Date().toLocaleTimeString(),
        });
      } else {
        io.to(socket.id).emit("receivePrivateMessage", {
          sender: "System",
          message: `❌ User ${recipient} is offline or not found.`,
          timestamp: new Date().toLocaleTimeString(),
        });
      }

        // ALSO send the private message to the sender
        io.to(socket.id).emit("receivePrivateMessage", {
          sender,
          message,
          timestamp: new Date().toLocaleTimeString(),
        });
    });

    socket.on("disconnect", () => {
      const username = users.get(socket.id);
      if (username) {
        users.delete(socket.id);
        io.emit("updateUsers", Array.from(users.values()));
        io.emit("chatNotification", `${username} left the chat.`);
      }
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
