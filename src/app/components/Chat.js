"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function ChatPage() {
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  useEffect(() => {
    const socketInstance = io("http://localhost:3000");
    setSocket(socketInstance);

    socketInstance.on("receiveMessage", (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    socketInstance.on("userTyping", (user) => {
      console.log(`Received typing event: ${user}`); // ✅ Debug log
      setTypingUser(user);
    });

    socketInstance.on("userStoppedTyping", () => {
      console.log("Typing stopped event received"); // ✅ Debug log
      setTypingUser("");
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (socket && message.trim() !== "" && username.trim() !== "") {
      socket.emit("sendMessage", { username, message });
      setMessage("");
      socket.emit("stopTyping");
    }
  };

  const handleTyping = () => {
    if (!isTyping && username.trim() !== "") {
      console.log("Emitting typing event"); // ✅ Debug log
      setIsTyping(true);
      socket.emit("typing", username);
    }

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(() => {
      console.log("Emitting stopTyping event"); // ✅ Debug log
      setIsTyping(false);
      socket.emit("stopTyping");
    }, 2000);

    setTypingTimeout(timeout);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-4">💬 Real-Time Chat</h1>

      {/* Username Input */}
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="p-2 border rounded w-80 mb-4 bg-gray-800 text-white text-center"
        placeholder="Enter your username..."
      />

      {/* Chat Box */}
      <div className="border p-4 w-96 h-80 overflow-auto bg-gray-800 rounded-lg shadow-lg">
        {messages.map((msg, index) => (
          <div
            key={index}
            className="p-2 mb-2 border-b border-gray-700 transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            <span className="font-semibold text-blue-400">{msg.username}</span>:{" "}
            {msg.message}
            <span className="text-gray-400 text-sm ml-2">{msg.timestamp}</span>
          </div>
        ))}
      </div>

      {/* Typing Indicator */}
      {typingUser && (
        <p className="text-sm text-green-400 mt-2">{typingUser} is typing...</p>
      )}

      {/* Message Input */}
      <div className="mt-4 flex">
        <input
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          className="p-2 border rounded-l bg-gray-700 text-white w-72"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-r transition-all duration-200 ease-in-out"
        >
          Send
        </button>
      </div>
    </div>
  );
}
