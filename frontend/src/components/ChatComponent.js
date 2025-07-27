import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { chatAPI, apiUtils } from '../api';
import { useAuth } from '../AuthContext';

// Chat Message Component
const ChatMessage = memo(({ message, onDeleteMessage, canDelete }) => {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-red-400';
      case 'model': return 'text-purple-400';
      case 'viewer': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return '👑';
      case 'model': return '⭐';
      default: return '';
    }
  };

  return (
    <div className="flex items-start space-x-3 py-2 px-3 hover:bg-gray-800 rounded-lg group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className={`font-semibold text-sm ${getRoleColor(message.sender_role)}`}>
            {getRoleBadge(message.sender_role)} {message.sender_username}
          </span>
          <span className="text-xs text-gray-500">
            {formatTime(message.created_at)}
          </span>
          {message.tip_amount && (
            <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
              🪙 {message.tip_amount} tokens
            </span>
          )}
        </div>
        
        <div className="mt-1">
          {message.message_type === 'tip' ? (
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black p-2 rounded-lg font-semibold">
              💰 Tipped {message.tip_amount} tokens: {message.content}
            </div>
          ) : (
            <p className="text-gray-200 text-sm break-words">{message.content}</p>
          )}
        </div>
      </div>
      
      {canDelete && (
        <button
          onClick={() => onDeleteMessage(message.id)}
          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
          title="Delete message"
        >
          🗑️
        </button>
      )}
    </div>
  );
});

// Typing Indicator Component
const TypingIndicator = memo(({ typingUsers }) => {
  if (typingUsers.length === 0) return null;

  const typingText = typingUsers.length === 1 
    ? `${typingUsers[0]} is typing...`
    : `${typingUsers.slice(0, -1).join(', ')} and ${typingUsers[typingUsers.length - 1]} are typing...`;

  return (
    <div className="flex items-center space-x-2 px-3 py-2 text-gray-400 text-sm">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span>{typingText}</span>
    </div>
  );
});

// Online Users Component
const OnlineUsers = memo(({ users, isCollapsed, onToggle }) => {
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return '👑';
      case 'model': return '⭐';
      default: return '👤';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="font-semibold text-white">Online ({users.length})</span>
        <span className="text-gray-400">
          {isCollapsed ? '▶️' : '▼'}
        </span>
      </button>
      
      {!isCollapsed && (
        <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
          {users.map((user) => (
            <div key={user.user_id} className="flex items-center space-x-2 text-sm">
              <span>{getRoleIcon(user.role)}</span>
              <span className="text-gray-300">{user.username}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// Main Chat Component
const ChatComponent = ({ roomId, modelName, isVisible, onClose }) => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [tipMessage, setTipMessage] = useState('');
  const [isUsersCollapsed, setIsUsersCollapsed] = useState(false);
  
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageInputRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'chat_message':
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
        break;
        
      case 'private_message':
        // Handle private messages (could show in separate modal)
        console.log('Private message received:', data.message);
        break;
        
      case 'online_users':
        setOnlineUsers(data.users);
        break;
        
      case 'user_connected':
        setOnlineUsers(prev => {
          const exists = prev.find(u => u.user_id === data.user_id);
          if (!exists) {
            return [...prev, { user_id: data.user_id, username: data.username, role: 'viewer' }];
          }
          return prev;
        });
        break;
        
      case 'user_disconnected':
        setOnlineUsers(prev => prev.filter(u => u.user_id !== data.user_id));
        break;
        
      case 'typing':
        if (data.user_id !== user?.id) {
          setTypingUsers(prev => {
            if (data.is_typing) {
              return [...prev.filter(u => u !== data.username), data.username];
            } else {
              return prev.filter(u => u !== data.username);
            }
          });
        }
        break;
        
      case 'message_deleted':
        setMessages(prev => prev.filter(msg => msg.id !== data.message_id));
        break;
        
      case 'moderation_action':
        // Handle moderation actions
        console.log('Moderation action:', data);
        break;
        
      case 'error':
        console.error('Chat error:', data.message);
        break;
    }
  }, [user, scrollToBottom]);

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    if (!roomId || !token) return;

    try {
      wsRef.current = chatAPI.createWebSocketConnection(
        roomId,
        handleWebSocketMessage,
        (error) => {
          console.error('WebSocket connection error:', error);
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
      console.error('Error creating WebSocket connection:', error);
      setIsLoading(false);
    }
  }, [roomId, token, handleWebSocketMessage, isVisible]);

  // Load chat history
  const loadChatHistory = useCallback(async () => {
    try {
      const history = await chatAPI.getChatHistory(roomId, 50);
      setMessages(history);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }, [roomId, scrollToBottom]);

  // Initialize chat
  useEffect(() => {
    if (isVisible && roomId) {
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
  }, [isVisible, roomId, loadChatHistory, connectWebSocket]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!wsRef.current || !isConnected) return;

    wsRef.current.send(JSON.stringify({
      type: 'typing',
      is_typing: true
    }));

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing indicator after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      if (wsRef.current && isConnected) {
        wsRef.current.send(JSON.stringify({
          type: 'typing',
          is_typing: false
        }));
      }
    }, 2000);
  }, [isConnected]);

  // Send message
  const sendMessage = useCallback((messageContent, messageType = 'chat_message', tipAmount = null) => {
    if (!wsRef.current || !isConnected || !messageContent.trim()) return;

    wsRef.current.send(JSON.stringify({
      type: messageType,
      content: messageContent.trim(),
      message_type: tipAmount ? 'tip' : 'text',
      tip_amount: tipAmount
    }));
  }, [isConnected]);

  // Handle message submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    sendMessage(newMessage);
    setNewMessage('');
    
    // Focus back to input
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 100);
  };

  // Handle tip
  const handleTip = () => {
    const amount = parseInt(tipAmount);
    if (!amount || amount <= 0 || !tipMessage.trim()) return;

    sendMessage(tipMessage, 'chat_message', amount);
    setShowTipModal(false);
    setTipAmount('');
    setTipMessage('');
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    try {
      await chatAPI.deleteMessage(messageId);
      // Message will be removed via WebSocket broadcast
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Check if user can delete message
  const canDeleteMessage = (message) => {
    return user?.role === 'admin' || 
           user?.role === 'model' || 
           message.sender_id === user?.id;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <h3 className="font-semibold text-white truncate">{modelName} Chat</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowTipModal(true)}
            className="text-yellow-400 hover:text-yellow-300 transition-colors"
            title="Send Tip"
          >
            🪙
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400">Loading chat...</div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onDeleteMessage={handleDeleteMessage}
                    canDelete={canDeleteMessage(message)}
                  />
                ))}
                <TypingIndicator typingUsers={typingUsers} />
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
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message..."
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

        {/* Online Users Sidebar */}
        <div className="w-24 p-2 border-l border-gray-700">
          <OnlineUsers
            users={onlineUsers}
            isCollapsed={isUsersCollapsed}
            onToggle={() => setIsUsersCollapsed(!isUsersCollapsed)}
          />
        </div>
      </div>

      {/* Tip Modal */}
      {showTipModal && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
          <div className="bg-gray-800 p-6 rounded-lg max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Send Tip</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tip Amount (tokens)
                </label>
                <input
                  type="number"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  value={tipMessage}
                  onChange={(e) => setTipMessage(e.target.value)}
                  placeholder="Enter your message"
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows="3"
                  maxLength={200}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowTipModal(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTip}
                disabled={!tipAmount || !tipMessage.trim()}
                className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 text-black disabled:text-gray-400 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Send Tip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatComponent;