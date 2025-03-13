import { Server } from "socket.io";

let io;

export async function GET(req) {
  if (!io) {
    console.log("Initializing Socket.io...");

    io = new Server(3001, {
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

      // Log and Broadcast Typing Event
      socket.on("typing", (username) => {
        console.log(`${username} is typing...`);
        socket.broadcast.emit("userTyping", username);
      });

      socket.on("stopTyping", () => {
        console.log("User stopped typing");
        socket.broadcast.emit("userStoppedTyping");
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });
  }

  return new Response("Socket.io Server is running", { status: 200 });
}
