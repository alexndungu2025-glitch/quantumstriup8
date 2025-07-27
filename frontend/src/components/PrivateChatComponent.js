import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { chatAPI, apiUtils } from '../api';
import { useAuth } from '../AuthContext';

// Private Message Component
const PrivateMessage = memo(({ message, isOwnMessage }) => {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isOwnMessage 
          ? 'bg-purple-600 text-white' 
          : 'bg-gray-700 text-gray-100'
      }`}>
        <p className="text-sm break-words">{message.content}</p>
        <p className={`text-xs mt-1 ${
          isOwnMessage ? 'text-purple-200' : 'text-gray-400'
        }`}>
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
});

// Private Chat Component
const PrivateChatComponent = ({ recipientId, recipientName, isVisible, onClose }) => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // Create consistent private room ID
  const roomId = `private_${[user?.id, recipientId].sort().join('_')}`;

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'private_message':
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
        break;
        
      case 'error':
        console.error('Private chat error:', data.message);
        break;
    }
  }, [scrollToBottom]);

  // Connect to WebSocket (using regular chat connection but filtering for private messages)
  const connectWebSocket = useCallback(() => {
    if (!recipientId || !token) return;

    try {
      // For private chat, we'll use a dummy room and handle private messages
      wsRef.current = chatAPI.createWebSocketConnection(
        'private_chat',
        handleWebSocketMessage,
        (error) => {
          console.error('Private chat WebSocket error:', error);
          setIsConnected(false);
          
          // Attempt to reconnect after 3 seconds
          setTimeout(() => {
            if (isVisible) {
              connectWebSocket();
            }
          }, 3000);
        }
      );

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setIsLoading(false);
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Error creating private chat WebSocket:', error);
      setIsLoading(false);
    }
  }, [recipientId, token, handleWebSocketMessage, isVisible]);

  // Load private chat history
  const loadChatHistory = useCallback(async () => {
    try {
      const history = await chatAPI.getChatHistory(roomId, 50);
      // Filter for private messages between these two users
      const privateMessages = history.filter(msg => 
        msg.message_type === 'private' && 
        ((msg.sender_id === user?.id && msg.room_id.includes(recipientId)) ||
         (msg.sender_id === recipientId && msg.room_id.includes(user?.id)))
      );
      setMessages(privateMessages);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error loading private chat history:', error);
    }
  }, [roomId, recipientId, user, scrollToBottom]);

  // Initialize private chat
  useEffect(() => {
    if (isVisible && recipientId) {
      setIsLoading(true);
      loadChatHistory();
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isVisible, recipientId, loadChatHistory, connectWebSocket]);

  // Send private message
  const sendPrivateMessage = useCallback((messageContent) => {
    if (!wsRef.current || !isConnected || !messageContent.trim()) return;

    wsRef.current.send(JSON.stringify({
      type: 'private_message',
      recipient_id: recipientId,
      content: messageContent.trim()
    }));
  }, [isConnected, recipientId]);

  // Handle message submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    sendPrivateMessage(newMessage);
    
    // Add message to local state immediately for better UX
    const newMsg = {
      id: Date.now().toString(),
      sender_id: user?.id,
      content: newMessage.trim(),
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMsg]);
    
    setNewMessage('');
    setTimeout(scrollToBottom, 100);
    
    // Focus back to input
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 100);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 w-80 h-96 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <h3 className="font-semibold text-white truncate">💬 {recipientName}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400 text-center">
              <p>No messages yet.</p>
              <p className="text-sm">Start a conversation!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <PrivateMessage
                key={message.id}
                message={message}
                isOwnMessage={message.sender_id === user?.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            ref={messageInputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a private message..."
            className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={!isConnected}
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!isConnected || !newMessage.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default PrivateChatComponent;