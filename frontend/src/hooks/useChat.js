import { useState, useCallback } from 'react';

// Custom hook for managing multiple chat windows
export const useChat = () => {
  const [activeChats, setActiveChats] = useState([]);
  const [privateChats, setPrivateChats] = useState([]);

  // Open public chat room
  const openChat = useCallback((roomId, modelName) => {
    setActiveChats(prev => {
      // Check if chat is already open
      const existingChat = prev.find(chat => chat.roomId === roomId);
      if (existingChat) {
        return prev; // Already open, don't duplicate
      }
      
      // Add new chat
      return [...prev, { roomId, modelName, isVisible: true }];
    });
  }, []);

  // Close public chat room
  const closeChat = useCallback((roomId) => {
    setActiveChats(prev => prev.filter(chat => chat.roomId !== roomId));
  }, []);

  // Open private chat
  const openPrivateChat = useCallback((recipientId, recipientName) => {
    setPrivateChats(prev => {
      // Check if private chat is already open
      const existingChat = prev.find(chat => chat.recipientId === recipientId);
      if (existingChat) {
        return prev; // Already open, don't duplicate
      }
      
      // Add new private chat
      return [...prev, { recipientId, recipientName, isVisible: true }];
    });
  }, []);

  // Close private chat
  const closePrivateChat = useCallback((recipientId) => {
    setPrivateChats(prev => prev.filter(chat => chat.recipientId !== recipientId));
  }, []);

  // Toggle chat visibility
  const toggleChatVisibility = useCallback((roomId) => {
    setActiveChats(prev => 
      prev.map(chat => 
        chat.roomId === roomId 
          ? { ...chat, isVisible: !chat.isVisible }
          : chat
      )
    );
  }, []);

  // Toggle private chat visibility
  const togglePrivateChatVisibility = useCallback((recipientId) => {
    setPrivateChats(prev => 
      prev.map(chat => 
        chat.recipientId === recipientId 
          ? { ...chat, isVisible: !chat.isVisible }
          : chat
      )
    );
  }, []);

  // Close all chats
  const closeAllChats = useCallback(() => {
    setActiveChats([]);
    setPrivateChats([]);
  }, []);

  return {
    activeChats,
    privateChats,
    openChat,
    closeChat,
    openPrivateChat,
    closePrivateChat,
    toggleChatVisibility,
    togglePrivateChatVisibility,
    closeAllChats
  };
};

// Chat notifications hook
export const useChatNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id, timestamp: new Date() };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
    
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  };
};