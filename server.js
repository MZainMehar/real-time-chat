import { createServer } from "http";
import { Server } from "socket.io";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = 3000;

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

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

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});


// Real-Time-Chat is a simple chat application built with Next.js and Socket.io. It allows users to send messages in real-time and see when other users are typing. The application consists of a front-end and a back-end. The front-end is built with Next.js and includes a chat interface where users can enter their name, send messages, and see messages from other users. The back-end is built with Socket.io and handles the real-time communication between clients. The back-end server listens for incoming messages and broadcasts them to all connected clients. It also listens for typing events and broadcasts them to other clients to show when a user is typing a message. The application demonstrates how to build a real-time chat application using Next.js and Socket.io, and how to handle real-time communication between clients in a web application.