"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function ChatPage() {
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [privateRecipient, setPrivateRecipient] = useState("");
  const [privateMessage, setPrivateMessage] = useState("");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const socketInstance = io("http://localhost:3000");
    setSocket(socketInstance);

    socketInstance.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socketInstance.on("receivePrivateMessage", (msg) => {
      setPrivateMessages((prev) => [
        ...prev,
        {
          sender: msg.sender,
          message: msg.message,
          timestamp: msg.timestamp,
          self: msg.sender === username, // Mark messages sent by the current user
        },
      ]);
    });

    socketInstance.on("chatNotification", (msg) => {
      setMessages((prev) => [...prev, { username: "System", message: msg }]);
    });

    socketInstance.on("updateUsers", (userList) => {
      setUsers(userList);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const handleJoinChat = () => {
    if (socket && username.trim()) {
      socket.emit("userJoined", username);
      setJoined(true);
    }
  };

  const sendMessage = () => {
    if (socket && message.trim()) {
      socket.emit("sendMessage", { username, message });
      setMessage("");
    }
  };

  const sendPrivateMessage = () => {
    if (socket && privateMessage.trim() && privateRecipient.trim()) {
      const newMessage = {
        sender: "You",
        recipient: privateRecipient,
        message: privateMessage,
        timestamp: new Date().toLocaleTimeString(),
      };

      // Update sender's private messages immediately
      setPrivateMessages((prev) => [...prev, newMessage]);

      // Emit the private message to the server
      socket.emit("privateMessage", {
        recipient: privateRecipient,
        sender: username,
        message: privateMessage,
      });

      setPrivateMessage(""); // Clear input
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-4">💬 Real-Time Chat</h1>

      {!joined ? (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Enter your username..."
            className="p-2 border rounded w-80 bg-gray-800 text-white text-center"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button
            className="ml-2 p-2 bg-blue-600 hover:bg-blue-700 rounded"
            onClick={handleJoinChat}
          >
            Join Chat
          </button>
        </div>
      ) : (
        <>
          {/* Online Users */}
          <div className="p-4 bg-gray-800 rounded-lg mb-4">
            <h3 className="text-lg font-semibold">Online Users:</h3>
            <ul>
              {users.map((user, index) => (
                <li key={index} className="text-green-400">
                  🟢 {user}
                </li>
              ))}
            </ul>
          </div>

          {/* Chat Messages */}
          <div className="border p-4 w-96 h-80 overflow-auto bg-gray-800 rounded-lg shadow-lg">
            {messages.map((msg, index) => (
              <div key={index} className="p-2 border-b border-gray-700">
                <span className="font-semibold text-blue-400">
                  {msg.username}
                </span>
                : {msg.message}
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="mt-4 flex">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="p-2 border rounded-l bg-gray-700 text-white w-72"
              placeholder="Type a message..."
            />
            <button
              onClick={sendMessage}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-r"
            >
              Send
            </button>
          </div>

          {/* Private Message */}
          <div className="mt-4">
            <h3 className="text-lg">Send Private Message</h3>
            <select
              onChange={(e) => setPrivateRecipient(e.target.value)}
              className="p-2 border bg-gray-700 text-white rounded"
            >
              <option value="">Select User</option>
              {users
                .filter((user) => user !== username)
                .map((user) => (
                  <option key={user}>{user}</option>
                ))}
            </select>
            <input
              type="text"
              placeholder="Your message..."
              className="p-2 border bg-gray-700 text-white rounded ml-2"
              value={privateMessage}
              onChange={(e) => setPrivateMessage(e.target.value)}
            />
            <button
              onClick={sendPrivateMessage}
              className="ml-2 p-2 bg-purple-600 hover:bg-purple-700 rounded"
            >
              Send DM
            </button>
          </div>

          {/* Private Messages Section */}
          <div className="mt-6 p-4 border w-96 h-40 overflow-auto bg-gray-800 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-2">📩 Private Messages</h3>
            {privateMessages.map((msg, index) => (
              <div
                key={index}
                className={`p-2 border-b border-gray-700 flex ${
                  msg.sender === "You" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    msg.sender === "You"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-white"
                  }`}
                >
                  <span className="font-semibold">{msg.sender}</span>:{" "}
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
