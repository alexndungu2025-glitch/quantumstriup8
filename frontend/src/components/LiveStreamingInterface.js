import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Header } from '../components';
import { useResponsive, getResponsiveSpacing, getResponsiveText, getResponsiveLayout } from '../responsive';
import useWebRTCStreaming, { VIDEO_QUALITY_PRESETS } from '../hooks/useWebRTCStreaming';
import useWebRTCViewer from '../hooks/useWebRTCViewer';

// Model Live Streaming Interface
export const ModelLiveStreamingInterface = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [earnings, setEarnings] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);

  const {
    isStreaming,
    localStream,
    viewers,
    streamQuality,
    error,
    isLoading,
    localVideoRef,
    startStreaming,
    stopStreaming,
    changeStreamQuality,
    availableQualities,
    qualityLabels
  } = useWebRTCStreaming();

  // Timer for session duration
  useEffect(() => {
    let interval;
    if (isStreaming) {
      interval = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    } else {
      setSessionDuration(0);
    }
    return () => clearInterval(interval);
  }, [isStreaming]);

  // Calculate earnings (mock calculation)
  useEffect(() => {
    if (isStreaming && viewers.length > 0) {
      const tokensPerMinute = 20; // Base rate
      const bonusMultiplier = Math.max(1, viewers.length * 0.1);
      setEarnings(prev => prev + (tokensPerMinute * bonusMultiplier / 60));
    }
  }, [isStreaming, viewers.length]);

  const handleStartStreaming = async () => {
    try {
      await startStreaming(streamQuality);
    } catch (err) {
      console.error('Failed to start streaming:', err);
    }
  };

  const handleStopStreaming = async () => {
    try {
      await stopStreaming();
      setEarnings(0);
    } catch (err) {
      console.error('Failed to stop streaming:', err);
    }
  };

  const handleQualityChange = async (newQuality) => {
    try {
      await changeStreamQuality(newQuality);
      setShowQualityMenu(false);
    } catch (err) {
      console.error('Failed to change quality:', err);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black">
      <Header 
        userType={user?.role} 
        isAuthenticated={true}
        onLogout={logout}
      />
      
      <div className="flex h-screen pt-16">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-gray-900 relative">
            {/* Video Display */}
            <div className="w-full h-full flex items-center justify-center">
              {localStream ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-16 h-16 text-gray-400" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 13.5v-7l6 3.5-6 3.5z"/>
                    </svg>
                  </div>
                  <p className="text-white text-xl">Camera Offline</p>
                  <p className="text-gray-400">Click "Go Live" to start streaming</p>
                </div>
              )}
            </div>

            {/* Stream Status Overlay */}
            {isStreaming && (
              <div className="absolute top-4 left-4 bg-black bg-opacity-60 rounded-lg p-3">
                <div className="flex items-center text-white">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-red-400 font-semibold">LIVE</span>
                  <span className="ml-3">{formatDuration(sessionDuration)}</span>
                </div>
              </div>
            )}

            {/* Viewer Count */}
            {isStreaming && (
              <div className="absolute top-4 right-4 bg-black bg-opacity-60 rounded-lg p-3">
                <div className="flex items-center text-white">
                  <svg className="w-5 h-5 mr-2" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                  {viewers.length} viewers
                </div>
              </div>
            )}

            {/* Stream Controls */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black bg-opacity-60 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Go Live / End Stream Button */}
                    <button
                      onClick={isStreaming ? handleStopStreaming : handleStartStreaming}
                      disabled={isLoading}
                      className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                        isStreaming 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isLoading ? 'Please wait...' : (isStreaming ? 'End Stream' : 'Go Live')}
                    </button>

                    {/* Quality Selection */}
                    <div className="relative">
                      <button
                        onClick={() => setShowQualityMenu(!showQualityMenu)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
                      >
                        {qualityLabels[streamQuality]}
                      </button>
                      
                      {showQualityMenu && (
                        <div className="absolute bottom-full mb-2 left-0 bg-gray-800 rounded-lg shadow-lg border border-gray-700 min-w-48">
                          {availableQualities.map((quality) => (
                            <button
                              key={quality}
                              onClick={() => handleQualityChange(quality)}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                                quality === streamQuality ? 'text-green-400 bg-gray-700' : 'text-white'
                              }`}
                            >
                              {qualityLabels[quality]}
                              {quality === streamQuality && (
                                <svg className="inline w-4 h-4 ml-2" fill="currentColor">
                                  <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/>
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Earnings Display */}
                  <div className="flex items-center space-x-4 text-white">
                    {isStreaming && (
                      <div className="flex items-center bg-green-600 bg-opacity-20 px-3 py-2 rounded-lg">
                        <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <span className="text-green-400 font-semibold">
                          +{Math.floor(earnings)} tokens earned
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor">
                  <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"/>
                </svg>
                {error}
              </div>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-white font-semibold">Stream Dashboard</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Stream Stats */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">Session Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white">{formatDuration(sessionDuration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Viewers:</span>
                  <span className="text-white">{viewers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Quality:</span>
                  <span className="text-white">{qualityLabels[streamQuality]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tokens Earned:</span>
                  <span className="text-green-400">{Math.floor(earnings)}</span>
                </div>
              </div>
            </div>

            {/* Connected Viewers */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">Connected Viewers</h4>
              {viewers.length === 0 ? (
                <p className="text-gray-400 text-sm">No viewers connected</p>
              ) : (
                <div className="space-y-2">
                  {viewers.map((viewer) => (
                    <div key={viewer.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-white text-sm">Viewer {viewer.id.slice(-6)}</span>
                      </div>
                      <span className="text-green-400 text-xs">Connected</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/model-dashboard')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm transition-colors"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm transition-colors"
                >
                  Change Quality
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Viewer Live Stream Interface  
export const ViewerLiveStreamInterface = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { modelId } = useParams();
  const [selectedQuality, setSelectedQuality] = useState('auto');

  const {
    isConnected,
    remoteStream,
    connectionState,
    error,
    isLoading,
    remoteVideoRef,
    connectToStream,
    disconnectFromStream,
    requestQualityChange,
    isConnecting,
    hasRemoteStream
  } = useWebRTCViewer();

  useEffect(() => {
    if (modelId) {
      connectToStream(modelId);
    }
    
    return () => {
      if (isConnected) {
        disconnectFromStream();
      }
    };
  }, [modelId]);

  const handleQualityChange = (quality) => {
    setSelectedQuality(quality);
    requestQualityChange(quality);
  };

  const handleDisconnect = () => {
    disconnectFromStream();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-black">
      <Header 
        userType={user?.role} 
        isAuthenticated={!!user}
        onLogout={logout}
      />
      
      <div className="flex h-screen pt-16">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-gray-900 relative">
            {/* Video Display */}
            <div className="w-full h-full flex items-center justify-center">
              {hasRemoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  {isConnecting ? (
                    <div>
                      <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-white text-xl">Connecting to stream...</p>
                      <p className="text-gray-400">Please wait</p>
                    </div>
                  ) : (
                    <div>
                      <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-16 h-16 text-gray-400" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 13.5v-7l6 3.5-6 3.5z"/>
                        </svg>
                      </div>
                      <p className="text-white text-xl">Stream Unavailable</p>
                      <p className="text-gray-400">Model is not currently live</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Connection Status */}
            {isConnected && (
              <div className="absolute top-4 left-4 bg-black bg-opacity-60 rounded-lg p-3">
                <div className="flex items-center text-white">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-green-400 font-semibold">LIVE</span>
                  <span className="ml-3 text-sm">{selectedQuality} quality</span>
                </div>
              </div>
            )}

            {/* Quality Selector */}
            {isConnected && (
              <div className="absolute top-4 right-4">
                <select
                  value={selectedQuality}
                  onChange={(e) => handleQualityChange(e.target.value)}
                  className="bg-black bg-opacity-60 text-white rounded-lg p-2 text-sm border border-gray-600"
                >
                  {Object.entries(VIDEO_QUALITY_PRESETS).map(([key, preset]) => (
                    <option key={key} value={key}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black bg-opacity-60 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleDisconnect}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                    >
                      Leave Stream
                    </button>
                    
                    <div className="text-white text-sm">
                      Status: <span className={connectionState === 'connected' ? 'text-green-400' : 'text-yellow-400'}>
                        {connectionState}
                      </span>
                    </div>
                  </div>
                  
                  {user?.role === 'viewer' && (
                    <div className="flex space-x-2">
                      <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">
                        Tip 10 tokens
                      </button>
                      <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm">
                        Private Show
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor">
                  <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"/>
                </svg>
                {error}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default { ModelLiveStreamingInterface, ViewerLiveStreamInterface };