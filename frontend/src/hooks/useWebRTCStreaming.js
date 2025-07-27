import { useState, useEffect, useRef, useCallback } from 'react';
import { streamingAPI } from '../api';

// WebRTC configuration with STUN servers
const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

// Video quality presets
export const VIDEO_QUALITY_PRESETS = {
  low: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 15 },
    label: 'Low Quality (480p)'
  },
  medium: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 24 },
    label: 'Medium Quality (720p)'
  },
  high: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 },
    label: 'High Quality (1080p)'
  },
  auto: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 24 },
    label: 'Auto Quality'
  }
};

export const useWebRTCStreaming = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [viewers, setViewers] = useState([]);
  const [streamQuality, setStreamQuality] = useState('medium');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const localVideoRef = useRef(null);
  const peerConnections = useRef(new Map());
  const streamSessionId = useRef(null);

  // Initialize camera and microphone
  const startLocalStream = useCallback(async (quality = 'medium') => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if we're on HTTPS or localhost (required for getUserMedia)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        throw new Error('Camera access requires HTTPS connection');
      }

      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }

      // Try to get permission status, but don't fail if not supported
      let permissionGranted = false;
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' });
          if (permissionStatus.state === 'denied') {
            throw new Error('Camera permission was permanently denied. Please reset camera permissions in your browser settings and refresh the page.');
          }
          permissionGranted = permissionStatus.state === 'granted';
        }
      } catch (permErr) {
        console.log('Permission API not fully supported, will try direct access');
      }

      const constraints = {
        video: VIDEO_QUALITY_PRESETS[quality],
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      };

      console.log('Requesting camera access with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera access granted successfully');
      
      setLocalStream(stream);
      
      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // Prevent feedback
        localVideoRef.current.playsInline = true; // Important for mobile
        
        // Ensure video starts playing
        try {
          await localVideoRef.current.play();
        } catch (playErr) {
          console.log('Video autoplay blocked, user interaction required');
        }
      }
      
      return stream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      
      let errorMessage = 'Could not access camera/microphone.';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = '🚫 Camera access was denied. Please:\n1. Click the camera icon in your browser address bar\n2. Allow camera access for this site\n3. Refresh the page and try again';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = '📹 No camera found. Please:\n1. Connect a camera to your device\n2. Make sure no other app is using the camera\n3. Try refreshing the page';
      } else if (err.name === 'NotSupportedError' || err.name === 'ConstraintNotSatisfiedError') {
        errorMessage = '⚙️ Camera settings not supported. Try using a different quality setting or browser.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = '🔒 Camera is busy. Please:\n1. Close other apps using the camera\n2. Close other browser tabs with camera access\n3. Try again';
      } else if (err.message.includes('HTTPS')) {
        errorMessage = '🔐 Camera access requires a secure connection (HTTPS).';
      } else if (err.message.includes('not supported')) {
        errorMessage = err.message;
      } else if (err.message.includes('denied')) {
        errorMessage = '🚫 Camera permission denied. Please check your browser settings and allow camera access.';
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Stop local stream
  const stopLocalStream = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
      });
      setLocalStream(null);
    }
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }, [localStream]);

  // Create peer connection for a viewer
  const createPeerConnection = useCallback(async (viewerId) => {
    const peerConnection = new RTCPeerConnection(rtcConfiguration);
    
    // Add local stream tracks to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to viewer via signaling server
        sendSignalingMessage(viewerId, {
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Peer connection state for ${viewerId}:`, peerConnection.connectionState);
      
      if (peerConnection.connectionState === 'disconnected' || 
          peerConnection.connectionState === 'failed') {
        removePeerConnection(viewerId);
      }
    };

    peerConnections.current.set(viewerId, peerConnection);
    return peerConnection;
  }, [localStream]);

  // Remove peer connection
  const removePeerConnection = useCallback((viewerId) => {
    const peerConnection = peerConnections.current.get(viewerId);
    if (peerConnection) {
      peerConnection.close();
      peerConnections.current.delete(viewerId);
    }
    setViewers(prev => prev.filter(v => v.id !== viewerId));
  }, []);

  // Send signaling message (in production, this would use WebSocket)
  const sendSignalingMessage = useCallback(async (targetUserId, message) => {
    if (!streamSessionId.current) return;
    
    try {
      await streamingAPI.sendWebRTCSignal({
        session_id: streamSessionId.current,
        signal_type: message.type,
        signal_data: message,
        target_user_id: targetUserId
      });
    } catch (err) {
      console.error('Error sending signaling message:', err);
    }
  }, []);

  // Handle viewer connection request
  const handleViewerConnection = useCallback(async (viewerId, offer) => {
    try {
      const peerConnection = await createPeerConnection(viewerId);
      
      // Set remote description (offer)
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Create answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      // Send answer back to viewer
      await sendSignalingMessage(viewerId, {
        type: 'answer',
        answer: answer
      });
      
      // Add viewer to list
      setViewers(prev => [...prev, { id: viewerId, connected: true }]);
      
    } catch (err) {
      console.error('Error handling viewer connection:', err);
    }
  }, [createPeerConnection, sendSignalingMessage]);

  // Start streaming session
  const startStreaming = useCallback(async (quality = 'medium') => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Start local camera/microphone
      const stream = await startLocalStream(quality);
      setStreamQuality(quality);
      
      // Get current user's model profile to get model ID
      const userProfile = JSON.parse(localStorage.getItem('user'));
      if (!userProfile || userProfile.role !== 'model') {
        throw new Error('User must be a model to start streaming');
      }
      
      // Update model status to live
      await streamingAPI.updateModelStatus(true, true);
      
      // Create streaming session with user's model ID
      const sessionResponse = await streamingAPI.createStreamingSession({
        model_id: userProfile.id, // Use the actual user ID as model ID
        session_type: 'public'
      });
      
      streamSessionId.current = sessionResponse.session_id;
      setIsStreaming(true);
      
      console.log('Streaming started with session:', sessionResponse.session_id);
      
    } catch (err) {
      console.error('Error starting streaming:', err);
      setError(err.message || 'Failed to start streaming. Please try again.');
      stopLocalStream();
    } finally {
      setIsLoading(false);
    }
  }, [startLocalStream, stopLocalStream]);

  // Stop streaming session
  const stopStreaming = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Close all peer connections
      peerConnections.current.forEach((connection, viewerId) => {
        connection.close();
      });
      peerConnections.current.clear();
      
      // Stop local stream
      stopLocalStream();
      
      // End streaming session
      if (streamSessionId.current) {
        await streamingAPI.endStreamingSession(streamSessionId.current);
      }
      
      // Update model status to offline
      await streamingAPI.updateModelStatus(false, true);
      
      setIsStreaming(false);
      setViewers([]);
      streamSessionId.current = null;
      
    } catch (err) {
      console.error('Error stopping streaming:', err);
      setError('Error stopping stream');
    } finally {
      setIsLoading(false);
    }
  }, [stopLocalStream]);

  // Change stream quality
  const changeStreamQuality = useCallback(async (newQuality) => {
    if (!isStreaming) return;
    
    try {
      // Stop current stream
      stopLocalStream();
      
      // Start with new quality
      const newStream = await startLocalStream(newQuality);
      setStreamQuality(newQuality);
      
      // Update all peer connections with new stream
      peerConnections.current.forEach((connection) => {
        connection.getSenders().forEach((sender) => {
          if (sender.track) {
            const newTrack = newStream.getTracks().find(
              track => track.kind === sender.track.kind
            );
            if (newTrack) {
              sender.replaceTrack(newTrack);
            }
          }
        });
      });
      
    } catch (err) {
      console.error('Error changing stream quality:', err);
      setError('Failed to change stream quality');
    }
  }, [isStreaming, startLocalStream, stopLocalStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isStreaming) {
        stopStreaming();
      }
    };
  }, [isStreaming, stopStreaming]);

  return {
    // State
    isStreaming,
    localStream,
    viewers,
    streamQuality,
    error,
    isLoading,
    
    // Refs
    localVideoRef,
    
    // Methods
    startStreaming,
    stopStreaming,
    changeStreamQuality,
    handleViewerConnection,
    setError, // Export setError for external use
    
    // Utils
    availableQualities: Object.keys(VIDEO_QUALITY_PRESETS),
    qualityLabels: Object.fromEntries(
      Object.entries(VIDEO_QUALITY_PRESETS).map(([key, value]) => [key, value.label])
    )
  };
};

export default useWebRTCStreaming;