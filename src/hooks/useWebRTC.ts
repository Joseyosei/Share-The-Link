/**
 * useWebRTC Hook
 *
 * P2P WebRTC streaming using Supabase Realtime for signaling.
 * - Broadcaster: captures media, creates peer connections per viewer
 * - Viewer: receives stream from broadcaster via peer connection
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

interface PeerState {
  connection: RTCPeerConnection;
  viewerId: string;
}

/**
 * Broadcaster hook - captures media and streams to viewers
 */
export function useBroadcaster(roomName: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [mediaSource, setMediaSource] = useState<"camera" | "screen" | null>(null);

  const peersRef = useRef<Map<string, PeerState>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Keep ref in sync
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

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

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          peersRef.current.delete(viewerId);
          setViewerCount(peersRef.current.size);
        }
      };

      peersRef.current.set(viewerId, { connection: pc, viewerId });
      setViewerCount(peersRef.current.size);

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      channelRef.current.send({
        type: "broadcast",
        event: "offer",
        payload: {
          sdp: pc.localDescription?.toJSON(),
          targetId: viewerId,
        },
      });
    },
    []
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
          try {
            await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("Error adding ICE candidate:", err);
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
          }
        }
      })
      .subscribe();

    channelRef.current = channel;
    setIsBroadcasting(true);
  }, [roomName, createPeerForViewer]);

  const startCamera = useCallback(async () => {
    try {
      // Stop existing stream
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
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
        video: true,
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
    // Close all peer connections
    peersRef.current.forEach((peer) => peer.connection.close());
    peersRef.current.clear();
    setViewerCount(0);

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
      peersRef.current.forEach((peer) => peer.connection.close());
      peersRef.current.clear();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return {
    localStream,
    viewerCount,
    isBroadcasting,
    mediaSource,
    startCamera,
    startScreenShare,
    startBroadcasting,
    stopBroadcasting,
  };
}

/**
 * Viewer hook - connects to broadcaster and receives stream
 */
export function useViewer(roomName: string) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<string>("new");
  const [isConnecting, setIsConnecting] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const viewerIdRef = useRef(`viewer-${Math.random().toString(36).substring(2, 10)}`);

  const connect = useCallback(() => {
    if (!roomName) return;

    setIsConnecting(true);
    const viewerId = viewerIdRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Receive remote tracks
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        setRemoteStream(stream);
        setIsConnecting(false);
      }
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      if (pc.connectionState === "connected") {
        setIsConnecting(false);
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

        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
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
  }, [roomName]);

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "viewer-leave",
        payload: { viewerId: viewerIdRef.current },
      });
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setRemoteStream(null);
    setConnectionState("new");
    setIsConnecting(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, []);

  return {
    remoteStream,
    connectionState,
    isConnecting,
    connect,
    disconnect,
  };
}
