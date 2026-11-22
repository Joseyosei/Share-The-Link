/**
 * useWebRTC Hook
 *
 * P2P WebRTC streaming using Supabase Realtime for signaling.
 * - Broadcaster: captures media, creates peer connections per viewer
 * - Viewer: receives stream from broadcaster via peer connection
 *
 * Features:
 * - STUN + TURN servers (TURN credentials fetched from /api/ice-servers)
 * - ICE candidate buffering (queue candidates until remote description is set)
 * - Exponential backoff retry for connection failures
 * - Connection health monitoring
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ICE configuration with STUN + TURN servers for reliable connectivity.
// TURN relay servers ensure connections work behind symmetric NATs and
// restrictive firewalls where STUN alone fails (~10-15% of users).
const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    // Public STUN servers
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    // Free public TURN relay (openrelay.metered.ca)
    // For production: replace with Cloudflare TURN, Twilio, or Xirsys credentials
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turns:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: "all",
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
};

function getIceConfig(): RTCConfiguration {
  return ICE_CONFIG;
}

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
  const announceIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

      const pc = new RTCPeerConnection(getIceConfig());

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
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Tell any viewers who opened the page before we went live to (re)join.
          announce();
        }
      });

    // Viewers only learn about the broadcaster through signalling, so if a
    // viewer's "viewer-join" was sent before we subscribed it is lost.
    // Re-announcing on an interval lets late and early viewers connect.
    function announce() {
      channel.send({
        type: "broadcast",
        event: "broadcaster-ready",
        payload: { at: Date.now() },
      });
    }
    if (announceIntervalRef.current) clearInterval(announceIntervalRef.current);
    announceIntervalRef.current = setInterval(announce, 8000);

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
      localStreamRef.current = stream;
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
      localStreamRef.current = stream;
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
    if (announceIntervalRef.current) {
      clearInterval(announceIntervalRef.current);
      announceIntervalRef.current = null;
    }

    // Tell every viewer the stream is over so their player can switch state
    channelRef.current?.send({
      type: "broadcast",
      event: "stream-ended",
      payload: { at: Date.now() },
    });

    // Close all peer connections
    peersRef.current.forEach((peer) => peer.connection.close());
    peersRef.current.clear();
    setViewerCount(0);
    setConnectionHealth("good");

    // Stop local stream
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setMediaSource(null);

    // Leave channel (after a short delay so "stream-ended" is delivered)
    if (channelRef.current) {
      const ch = channelRef.current;
      channelRef.current = null;
      setTimeout(() => supabase.removeChannel(ch), 750);
    }
    setIsBroadcasting(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
      if (announceIntervalRef.current) {
        clearInterval(announceIntervalRef.current);
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
 *
 * Signalling flow (all over the Supabase Realtime broadcast channel `stream:<room>`):
 *   viewer  -> "viewer-join"       (on subscribe, on "broadcaster-ready", and on a retry timer)
 *   bcaster -> "offer"             (one fresh RTCPeerConnection per join)
 *   viewer  -> "answer"
 *   both    -> "ice-candidate"
 *   bcaster -> "stream-ended"      (when the creator ends the stream)
 *
 * The viewer builds a fresh RTCPeerConnection for every offer it receives, so a
 * re-join (because the viewer arrived before the creator went live, or the
 * connection dropped) never collides with stale peer state.
 */
export type ViewerConnectionState =
  | "new"
  | "waiting"
  | "connecting"
  | "connected"
  | "failed"
  | "ended";

const VIEWER_REJOIN_INTERVAL = 6000;

export function useViewer(roomName: string) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<ViewerConnectionState>("new");
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const peerStateRef = useRef<ViewerPeerState | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const viewerIdRef = useRef(`viewer-${Math.random().toString(36).substring(2, 10)}`);
  const rejoinTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastOfferAtRef = useRef(0);
  const endedRef = useRef(false);
  const connectedRef = useRef(false);

  const closePeer = useCallback(() => {
    if (peerStateRef.current) {
      peerStateRef.current.connection.close();
      peerStateRef.current = null;
    }
  }, []);

  const sendJoin = useCallback(() => {
    const channel = channelRef.current;
    if (!channel || endedRef.current || connectedRef.current) return;
    // Do not spam joins while an offer is being negotiated
    if (Date.now() - lastOfferAtRef.current < 4000) return;
    channel.send({
      type: "broadcast",
      event: "viewer-join",
      payload: { viewerId: viewerIdRef.current },
    });
  }, []);

  const flushCandidates = useCallback(async (peerState: ViewerPeerState) => {
    if (!peerState.hasRemoteDescription) return;
    const queued = peerState.iceCandidateBuffer;
    peerState.iceCandidateBuffer = [];
    for (const candidate of queued) {
      try {
        await peerState.connection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("Error adding buffered ICE candidate:", err);
      }
    }
  }, []);

  const handleOffer = useCallback(
    async (sdp: RTCSessionDescriptionInit) => {
      const channel = channelRef.current;
      if (!channel) return;
      lastOfferAtRef.current = Date.now();
      setConnectionState("connecting");

      // Fresh peer for every offer: the broadcaster created a fresh one too.
      closePeer();
      const pc = new RTCPeerConnection(getIceConfig());
      const peerState: ViewerPeerState = {
        connection: pc,
        iceCandidateBuffer: [],
        hasRemoteDescription: false,
      };
      peerStateRef.current = peerState;

      pc.ontrack = (event) => {
        const stream = event.streams[0] || new MediaStream([event.track]);
        setRemoteStream(stream);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          channel.send({
            type: "broadcast",
            event: "ice-candidate",
            payload: {
              candidate: event.candidate.toJSON(),
              fromId: viewerIdRef.current,
              targetId: "broadcaster",
            },
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "failed") pc.restartIce();
      };

      pc.onconnectionstatechange = () => {
        if (peerStateRef.current?.connection !== pc) return; // stale peer
        const state = pc.connectionState;
        if (state === "connected") {
          connectedRef.current = true;
          setConnectionState("connected");
          setReconnectAttempts(0);
        } else if (state === "failed" || state === "disconnected") {
          connectedRef.current = false;
          if (endedRef.current) return;
          setReconnectAttempts((n) => n + 1);
          setConnectionState(state === "failed" ? "failed" : "waiting");
          // Ask the broadcaster for a new peer; the rejoin timer keeps trying.
          lastOfferAtRef.current = 0;
          sendJoin();
        }
      };

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        peerState.hasRemoteDescription = true;
        await flushCandidates(peerState);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        channel.send({
          type: "broadcast",
          event: "answer",
          payload: { sdp: pc.localDescription?.toJSON(), fromId: viewerIdRef.current },
        });
      } catch (err) {
        console.error("Error handling offer:", err);
        setConnectionState("failed");
      }
    },
    [closePeer, flushCandidates, sendJoin]
  );

  const connect = useCallback(() => {
    if (!roomName || channelRef.current) return;
    endedRef.current = false;
    connectedRef.current = false;
    setConnectionState("waiting");
    const viewerId = viewerIdRef.current;

    const channel = supabase.channel(`stream:${roomName}`, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "offer" }, (msg) => {
        const { sdp, targetId } = msg.payload || {};
        if (targetId !== viewerId || !sdp) return;
        handleOffer(sdp);
      })
      .on("broadcast", { event: "ice-candidate" }, async (msg) => {
        const { candidate, targetId } = msg.payload || {};
        if (targetId !== viewerId || !candidate) return;
        const peerState = peerStateRef.current;
        if (!peerState) return;
        if (peerState.hasRemoteDescription) {
          try {
            await peerState.connection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.warn("Error adding ICE candidate:", err);
          }
        } else {
          peerState.iceCandidateBuffer.push(candidate);
        }
      })
      .on("broadcast", { event: "broadcaster-ready" }, () => {
        // Creator just went live (or is re-announcing): join if not connected.
        sendJoin();
      })
      .on("broadcast", { event: "stream-ended" }, () => {
        endedRef.current = true;
        connectedRef.current = false;
        closePeer();
        setRemoteStream(null);
        setConnectionState("ended");
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") sendJoin();
      });

    if (rejoinTimerRef.current) clearInterval(rejoinTimerRef.current);
    rejoinTimerRef.current = setInterval(sendJoin, VIEWER_REJOIN_INTERVAL);
  }, [roomName, handleOffer, sendJoin, closePeer]);

  const disconnect = useCallback(() => {
    if (rejoinTimerRef.current) {
      clearInterval(rejoinTimerRef.current);
      rejoinTimerRef.current = null;
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
    closePeer();
    connectedRef.current = false;
    lastOfferAtRef.current = 0;
    setRemoteStream(null);
    setConnectionState("new");
    setReconnectAttempts(0);
  }, [closePeer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rejoinTimerRef.current) clearInterval(rejoinTimerRef.current);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (peerStateRef.current) peerStateRef.current.connection.close();
    };
  }, []);

  return {
    remoteStream,
    connectionState,
    isConnecting: connectionState === "connecting" || connectionState === "waiting",
    reconnectAttempts,
    connect,
    disconnect,
  };
}
