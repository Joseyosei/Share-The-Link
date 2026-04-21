/**
 * useWebRTC Hook
 *
 * P2P WebRTC streaming using Supabase Realtime for signaling.
 * - Broadcaster: captures media, creates peer connections per viewer
 * - Viewer: receives stream from broadcaster via peer connection
 * 
 * Improvements:
 * - Multiple STUN servers for reliability
 * - ICE candidate buffering (queue candidates until remote description is set)
 * - Exponential backoff retry for connection failures
 * - Connection health monitoring
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// Enhanced ICE configuration with multiple STUN servers for reliability
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    // Additional reliable STUN servers
    { urls: "stun:stun.cloudflare.com:3478" },
    { urls: "stun:stun.stunprotocol.org:3478" },
  ],
  iceCandidatePoolSize: 10,
  // Prioritize UDP for lower latency
  iceTransportPolicy: "all",
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
};

// Retry configuration
const MAX_RECONNECT_ATTEMPTS = 3;
const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const HEALTH_CHECK_INTERVAL = 5000; // 5 seconds

// Adaptive quality presets
export type QualityPreset = "auto" | "1080p" | "720p" | "480p" | "360p";
export const QUALITY_PRESETS: Record<QualityPreset, { width: number; height: number; bitrate: number; fps: number; label: string }> = {
  auto: { width: 1280, height: 720, bitrate: 2500000, fps: 30, label: "Auto" },
  "1080p": { width: 1920, height: 1080, bitrate: 4500000, fps: 30, label: "1080p HD" },
  "720p": { width: 1280, height: 720, bitrate: 2500000, fps: 30, label: "720p" },
  "480p": { width: 854, height: 480, bitrate: 1000000, fps: 30, label: "480p" },
  "360p": { width: 640, height: 360, bitrate: 500000, fps: 24, label: "360p" },
};

interface PeerState {
  connection: RTCPeerConnection;
  viewerId: string;
  iceCandidateBuffer: RTCIceCandidateInit[];
  hasRemoteDescription: boolean;
  reconnectAttempts: number;
}

interface ViewerPeerState {
  connection: RTCPeerConnection;
  iceCandidateBuffer: RTCIceCandidateInit[];
  hasRemoteDescription: boolean;
}

/**
 * Broadcaster hook - captures media and streams to viewers
 */
export function useBroadcaster(roomName: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [mediaSource, setMediaSource] = useState<"camera" | "screen" | null>(null);
  const [connectionHealth, setConnectionHealth] = useState<"good" | "degraded" | "poor">("good");
  const [quality, setQuality] = useState<QualityPreset>("auto");
  const [currentBitrate, setCurrentBitrate] = useState(2500000);

  const peersRef = useRef<Map<string, PeerState>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Adaptive bitrate: adjust encoding based on viewer count and connection quality
  const adaptBitrate = useCallback(() => {
    const peers = peersRef.current;
    const basePreset = QUALITY_PRESETS[quality];
    let targetBitrate = basePreset.bitrate;

    // Reduce bitrate as viewer count grows (P2P bandwidth sharing)
    if (peers.size > 5) targetBitrate = Math.floor(targetBitrate * 0.7);
    if (peers.size > 10) targetBitrate = Math.floor(targetBitrate * 0.5);
    if (peers.size > 20) targetBitrate = Math.floor(targetBitrate * 0.4);

    setCurrentBitrate(targetBitrate);

    // Apply bitrate constraint to all peer connections
    peers.forEach((peer) => {
      const senders = peer.connection.getSenders();
      senders.forEach((sender) => {
        if (sender.track?.kind === "video") {
          const params = sender.getParameters();
          if (!params.encodings) params.encodings = [{}];
          params.encodings[0].maxBitrate = targetBitrate;
          sender.setParameters(params).catch(() => {});
        }
      });
    });
  }, [quality]);

  // Keep ref in sync
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Process buffered ICE candidates once remote description is set
  const processBufferedCandidates = useCallback(async (peer: PeerState) => {
    if (!peer.hasRemoteDescription) return;
    
    for (const candidate of peer.iceCandidateBuffer) {
      try {
        await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding buffered ICE candidate:", err);
      }
    }
    peer.iceCandidateBuffer = [];
  }, []);

  // Monitor connection health
  const checkConnectionHealth = useCallback(() => {
    const peers = Array.from(peersRef.current.values());
    if (peers.length === 0) {
      setConnectionHealth("good");
      return;
    }

    let goodConnections = 0;
    let failedConnections = 0;

    peers.forEach((peer) => {
      const state = peer.connection.connectionState;
      if (state === "connected") goodConnections++;
      if (state === "failed" || state === "disconnected") failedConnections++;
    });

    const healthRatio = goodConnections / peers.length;
    if (healthRatio >= 0.8) setConnectionHealth("good");
    else if (healthRatio >= 0.5) setConnectionHealth("degraded");
    else setConnectionHealth("poor");
  }, []);

  const createPeerForViewer = useCallback(
    async (viewerId: string) => {
      const stream = localStreamRef.current;
      if (!stream || !channelRef.current) return;

      // Clean up existing peer for this viewer if any
      const existing = peersRef.current.get(viewerId);
      if (existing) {
        existing.connection.close();
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);

      const peerState: PeerState = {
        connection: pc,
        viewerId,
        iceCandidateBuffer: [],
        hasRemoteDescription: false,
        reconnectAttempts: 0,
      };

      // Add all local tracks to the peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Send ICE candidates to the viewer
      pc.onicecandidate = (event) => {
        if (event.candidate && channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "ice-candidate",
            payload: {
              candidate: event.candidate.toJSON(),
              targetId: viewerId,
              fromId: "broadcaster",
            },
          });
        }
      };

      pc.onicecandidateerror = (event) => {
        console.warn("ICE candidate error for viewer", viewerId, event);
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        if (state === "failed") {
          // Try ICE restart
          console.log("ICE connection failed, attempting restart for viewer", viewerId);
          pc.restartIce();
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        
        if (state === "disconnected") {
          // Give it a moment to recover
          setTimeout(() => {
            if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
              const peer = peersRef.current.get(viewerId);
              if (peer && peer.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                peer.reconnectAttempts++;
                console.log(`Attempting reconnect ${peer.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} for viewer`, viewerId);
                // Try to recreate the peer connection
                setTimeout(() => {
                  createPeerForViewer(viewerId);
                }, INITIAL_RECONNECT_DELAY * Math.pow(2, peer.reconnectAttempts - 1));
              } else {
                // Give up, remove the peer
                peersRef.current.delete(viewerId);
                setViewerCount(peersRef.current.size);
              }
            }
          }, 3000);
        } else if (state === "failed") {
          peersRef.current.delete(viewerId);
          setViewerCount(peersRef.current.size);
        } else if (state === "connected") {
          // Reset reconnect attempts on successful connection
          const peer = peersRef.current.get(viewerId);
          if (peer) peer.reconnectAttempts = 0;
        }
        
        checkConnectionHealth();
      };

      peersRef.current.set(viewerId, peerState);
      setViewerCount(peersRef.current.size);

      // Create and send offer
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: false,
          offerToReceiveVideo: false,
        });
        await pc.setLocalDescription(offer);

        channelRef.current.send({
          type: "broadcast",
          event: "offer",
          payload: {
            sdp: pc.localDescription?.toJSON(),
            targetId: viewerId,
          },
        });
      } catch (err) {
        console.error("Error creating offer for viewer", viewerId, err);
      }
    },
    [checkConnectionHealth]
  );

  const startBroadcasting = useCallback(() => {
    if (!roomName) return;

    const channel = supabase.channel(`stream:${roomName}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "viewer-join" }, (msg) => {
        const viewerId = msg.payload?.viewerId;
        if (viewerId) {
          createPeerForViewer(viewerId);
        }
      })
      .on("broadcast", { event: "answer" }, async (msg) => {
        const { sdp, fromId } = msg.payload || {};
        const peer = peersRef.current.get(fromId);
        if (peer && sdp) {
          try {
            await peer.connection.setRemoteDescription(new RTCSessionDescription(sdp));
            peer.hasRemoteDescription = true;
            // Process any buffered ICE candidates
            await processBufferedCandidates(peer);
          } catch (err) {
            console.error("Error setting remote description:", err);
          }
        }
      })
      .on("broadcast", { event: "ice-candidate" }, async (msg) => {
        const { candidate, fromId, targetId } = msg.payload || {};
        if (targetId !== "broadcaster") return;
        const peer = peersRef.current.get(fromId);
        if (peer && candidate) {
          if (peer.hasRemoteDescription) {
            try {
              await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error("Error adding ICE candidate:", err);
            }
          } else {
            // Buffer the candidate until remote description is set
            peer.iceCandidateBuffer.push(candidate);
          }
        }
      })
      .on("broadcast", { event: "viewer-leave" }, (msg) => {
        const viewerId = msg.payload?.viewerId;
        if (viewerId) {
          const peer = peersRef.current.get(viewerId);
          if (peer) {
            peer.connection.close();
            peersRef.current.delete(viewerId);
            setViewerCount(peersRef.current.size);
            checkConnectionHealth();
          }
        }
      })
      .subscribe();

    channelRef.current = channel;
    setIsBroadcasting(true);

    // Start health check interval (also adapts bitrate)
    healthCheckIntervalRef.current = setInterval(() => {
      checkConnectionHealth();
      adaptBitrate();
    }, HEALTH_CHECK_INTERVAL);
  }, [roomName, createPeerForViewer, processBufferedCandidates, checkConnectionHealth, adaptBitrate]);

  const startCamera = useCallback(async () => {
    try {
      // Stop existing stream
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      setLocalStream(stream);
      setMediaSource("camera");
      return stream;
    } catch (err) {
      console.error("Camera access denied:", err);
      return null;
    }
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });
      // Handle browser stop-sharing
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        setLocalStream(null);
        setMediaSource(null);
      });
      setLocalStream(stream);
      setMediaSource("screen");
      return stream;
    } catch (err) {
      console.error("Screen share denied:", err);
      return null;
    }
  }, []);

  const stopBroadcasting = useCallback(() => {
    // Clear health check interval
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
      healthCheckIntervalRef.current = null;
    }

    // Close all peer connections
    peersRef.current.forEach((peer) => peer.connection.close());
    peersRef.current.clear();
    setViewerCount(0);
    setConnectionHealth("good");

    // Stop local stream
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setMediaSource(null);

    // Leave channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setIsBroadcasting(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
      peersRef.current.forEach((peer) => peer.connection.close());
      peersRef.current.clear();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Change quality preset on the fly
  const changeQuality = useCallback(async (preset: QualityPreset) => {
    setQuality(preset);
    const q = QUALITY_PRESETS[preset];

    // If camera is active, apply new constraints
    if (localStreamRef.current && mediaSource === "camera") {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        try {
          await videoTrack.applyConstraints({
            width: { ideal: q.width },
            height: { ideal: q.height },
            frameRate: { ideal: q.fps },
          });
        } catch (err) {
          console.warn("Could not apply quality constraints:", err);
        }
      }
    }

    // Update bitrate on all peers
    setCurrentBitrate(q.bitrate);
    peersRef.current.forEach((peer) => {
      const senders = peer.connection.getSenders();
      senders.forEach((sender) => {
        if (sender.track?.kind === "video") {
          const params = sender.getParameters();
          if (!params.encodings) params.encodings = [{}];
          params.encodings[0].maxBitrate = q.bitrate;
          sender.setParameters(params).catch(() => {});
        }
      });
    });
  }, [mediaSource]);

  return {
    localStream,
    viewerCount,
    isBroadcasting,
    mediaSource,
    connectionHealth,
    quality,
    currentBitrate,
    startCamera,
    startScreenShare,
    startBroadcasting,
    stopBroadcasting,
    changeQuality,
  };
}

/**
 * Viewer hook - connects to broadcaster and receives stream
 */
export function useViewer(roomName: string) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<string>("new");
  const [isConnecting, setIsConnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const peerStateRef = useRef<ViewerPeerState | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const viewerIdRef = useRef(`viewer-${Math.random().toString(36).substring(2, 10)}`);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Process buffered ICE candidates
  const processBufferedCandidates = useCallback(async () => {
    const peerState = peerStateRef.current;
    if (!peerState || !peerState.hasRemoteDescription) return;
    
    for (const candidate of peerState.iceCandidateBuffer) {
      try {
        await peerState.connection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error adding buffered ICE candidate:", err);
      }
    }
    peerState.iceCandidateBuffer = [];
  }, []);

  const connect = useCallback(() => {
    if (!roomName) return;

    setIsConnecting(true);
    const viewerId = viewerIdRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    
    const peerState: ViewerPeerState = {
      connection: pc,
      iceCandidateBuffer: [],
      hasRemoteDescription: false,
    };
    peerStateRef.current = peerState;

    // Receive remote tracks
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        setRemoteStream(stream);
        setIsConnecting(false);
        setReconnectAttempts(0);
      }
    };

    pc.onicecandidateerror = (event) => {
      console.warn("ICE candidate error:", event);
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      if (state === "failed") {
        console.log("ICE connection failed, attempting restart");
        pc.restartIce();
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      setConnectionState(state);
      
      if (state === "connected") {
        setIsConnecting(false);
        setReconnectAttempts(0);
      } else if (state === "failed" || state === "disconnected") {
        // Attempt reconnection with exponential backoff
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
          console.log(`Connection ${state}, attempting reconnect in ${delay}ms (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            disconnect();
            connect();
          }, delay);
        } else {
          setIsConnecting(false);
          setRemoteStream(null);
        }
      }
    };

    const channel = supabase.channel(`stream:${roomName}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "offer" }, async (msg) => {
        const { sdp, targetId } = msg.payload || {};
        if (targetId !== viewerId || !sdp) return;

        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          peerState.hasRemoteDescription = true;
          
          // Process any buffered ICE candidates
          await processBufferedCandidates();
          
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          channel.send({
            type: "broadcast",
            event: "answer",
            payload: {
              sdp: pc.localDescription?.toJSON(),
              fromId: viewerId,
            },
          });
        } catch (err) {
          console.error("Error handling offer:", err);
        }
      })
      .on("broadcast", { event: "ice-candidate" }, async (msg) => {
        const { candidate, targetId } = msg.payload || {};
        if (targetId !== viewerId || !candidate) return;

        if (peerState.hasRemoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("Error adding ICE candidate:", err);
          }
        } else {
          // Buffer the candidate until remote description is set
          peerState.iceCandidateBuffer.push(candidate);
        }
      })
      .on("broadcast", { event: "stream-ended" }, () => {
        // Broadcaster ended the stream
        setRemoteStream(null);
        setConnectionState("closed");
        setIsConnecting(false);
      })
      .subscribe(() => {
        // Once subscribed, signal the broadcaster that we joined
        channel.send({
          type: "broadcast",
          event: "viewer-join",
          payload: { viewerId },
        });
      });

    // Send ICE candidates to broadcaster
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channel.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: {
            candidate: event.candidate.toJSON(),
            fromId: viewerId,
            targetId: "broadcaster",
          },
        });
      }
    };

    channelRef.current = channel;
  }, [roomName, reconnectAttempts, processBufferedCandidates]);

  const disconnect = useCallback(() => {
    // Clear any pending reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "viewer-leave",
        payload: { viewerId: viewerIdRef.current },
      });
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (peerStateRef.current) {
      peerStateRef.current.connection.close();
      peerStateRef.current = null;
    }
    setRemoteStream(null);
    setConnectionState("new");
    setIsConnecting(false);
    setReconnectAttempts(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (peerStateRef.current) {
        peerStateRef.current.connection.close();
      }
    };
  }, []);

  return {
    remoteStream,
    connectionState,
    isConnecting,
    reconnectAttempts,
    connect,
    disconnect,
  };
}
