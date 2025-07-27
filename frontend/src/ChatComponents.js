import React from 'react';
import ChatComponent from './components/ChatComponent';
import PrivateChatComponent from './components/PrivateChatComponent';
import { useChat, useChatNotifications } from './hooks/useChat';

// Chat Integration Component - manages all chat windows
export const ChatIntegration = () => {
  const {
    activeChats,
    privateChats,
    openChat,
    closeChat,
    openPrivateChat,
    closePrivateChat,
    toggleChatVisibility,
    togglePrivateChatVisibility,
    closeAllChats
  } = useChat();

  const {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  } = useChatNotifications();

  return (
    <>
      {/* Public Chat Windows */}
      {activeChats.map((chat) => (
        <ChatComponent
          key={chat.roomId}
          roomId={chat.roomId}
          modelName={chat.modelName}
          isVisible={chat.isVisible}
          onClose={() => closeChat(chat.roomId)}
        />
      ))}

      {/* Private Chat Windows */}
      {privateChats.map((chat) => (
        <PrivateChatComponent
          key={chat.recipientId}
          recipientId={chat.recipientId}
          recipientName={chat.recipientName}
          isVisible={chat.isVisible}
          onClose={() => closePrivateChat(chat.recipientId)}
        />
      ))}

      {/* Chat Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="bg-purple-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{notification.title}</p>
                <p className="text-sm opacity-90">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-3 text-white hover:text-gray-300 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Control Panel (for development/testing) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-gray-800 p-4 rounded-lg border border-gray-700 z-40">
          <h3 className="text-white font-semibold mb-2">Chat Controls</h3>
          <div className="space-y-2">
            <button
              onClick={() => openChat('test-room', 'Test Model')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Test Chat
            </button>
            <button
              onClick={() => openPrivateChat('test-user', 'Test User')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Test Private
            </button>
            <button
              onClick={closeAllChats}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Close All
            </button>
            <button
              onClick={() => addNotification({
                title: 'Test Notification',
                message: 'This is a test notification'
              })}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Test Notification
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// Export chat management functions for use in other components
export const useChatManager = () => {
  const {
    activeChats,
    privateChats,
    openChat,
    closeChat,
    openPrivateChat,
    closePrivateChat,
    toggleChatVisibility,
    togglePrivateChatVisibility,
    closeAllChats
  } = useChat();

  const {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  } = useChatNotifications();

  return {
    // Chat management
    activeChats,
    privateChats,
    openChat,
    closeChat,
    openPrivateChat,
    closePrivateChat,
    toggleChatVisibility,
    togglePrivateChatVisibility,
    closeAllChats,
    
    // Notifications
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  };
};

export default ChatIntegration;