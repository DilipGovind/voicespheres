'use client';

import { io, Socket } from 'socket.io-client';
import { Participant, LiveCaptionItem, ChatMessageItem, StructuredStage } from '@/types/room';

export type SocketEventHandler = (...args: any[]) => void;

export interface RealtimeEventPayload {
  type: string;
  data: any;
  senderSessionId: string;
  senderUserId?: string;
  timestamp: number;
}

class RealtimeClient {
  private socket: Socket | null = null;
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<SocketEventHandler>> = new Map();
  private isConnected = true;
  private roomId: string | null = null;
  private currentUser: Participant | null = null;
  private sessionId = 'session_' + Math.random().toString(36).substring(2, 11);
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private serverSyncInterval: NodeJS.Timeout | null = null;
  private seenMessageIds: Set<string> = new Set();
  private lastKnownCaptionsCount = 0;
  private lastKnownChatCount = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        // 1. Cross-tab instant synchronization for same browser
        this.channel = new BroadcastChannel('voicesphere_realtime_mesh');
        this.channel.onmessage = (event) => {
          const { type, data, senderSessionId } = event.data || {};
          if (type && senderSessionId !== this.sessionId) {
            this.handleIncomingEvent(type, data);
          }
        };
      } catch {
        // BroadcastChannel unsupported or restricted
      }

      // 2. Standalone Node.js server fallback (for Docker / self-hosted)
      this.initSocketFallback();
    }
  }

  private initSocketFallback() {
    try {
      this.socket = io({
        path: '/socket.io',
        reconnectionAttempts: 2,
        timeout: 2000,
        autoConnect: false, // Don't block if serverless
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.trigger('connection:change', { connected: true, transport: 'socket.io' });
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        this.trigger('connection:change', { connected: false });
      });

      this.socket.onAny((event, ...args) => {
        this.handleIncomingEvent(event, args[0]);
      });
    } catch {
      // Fallback mode active
    }
  }

  /**
   * Internal incoming event processor
   */
  private handleIncomingEvent(type: string, data: any) {
    if (type === 'sync:request') {
      if (this.currentUser && this.roomId && data?.requesterSessionId !== this.sessionId) {
        this.publishMeshEvent('presence:heartbeat', {
          roomId: this.roomId,
          user: this.currentUser,
        });
      }
    }

    this.trigger(type, data);
  }

  /**
   * Publish an event across all active layers:
   * 1. Local BroadcastChannel (cross-tab same machine)
   * 2. Backend HTTP sync (/api/rooms/sync)
   * 3. Socket.io (if self-hosted)
   */
  public publishMeshEvent(type: string, data: any) {
    const isGlobal = type.startsWith('global:');
    if (!this.roomId && !isGlobal) return;

    // Trigger local listeners
    this.trigger(type, data);

    const payload: RealtimeEventPayload = {
      type,
      data,
      senderSessionId: this.sessionId,
      senderUserId: this.currentUser?.id,
      timestamp: Date.now(),
    };

    // 1. BroadcastChannel cross-tab
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch {}
    }

    // 2. Socket.io fallback
    if (this.socket && this.socket.connected) {
      try {
        this.socket.emit(type, data);
      } catch {}
    }
  }

  /**
   * Join Room: registers user, starts presence heartbeat and cross-device sync
   */
  public joinRoom(roomId: string, user: Participant) {
    this.roomId = roomId;
    this.currentUser = user;
    this.lastKnownCaptionsCount = 0;
    this.lastKnownChatCount = 0;

    // Announce join locally and across tabs
    this.publishMeshEvent('user:joined', { roomId, user });

    // Request presence sync from existing participants in the room
    this.publishMeshEvent('sync:request', {
      roomId,
      requesterId: user.id,
      requesterSessionId: this.sessionId,
    });

    // Immediate registration with serverless sync hub
    this.syncRoomStateWithServer();

    // Start periodic presence heartbeat every 1.5 seconds for instant multi-device presence
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      if (this.roomId && this.currentUser) {
        this.publishMeshEvent('presence:heartbeat', {
          roomId: this.roomId,
          user: this.currentUser,
        });
      }
    }, 1500);

    // Fast HTTP room sync: every 1.5 seconds
    if (this.serverSyncInterval) clearInterval(this.serverSyncInterval);
    this.serverSyncInterval = setInterval(() => {
      this.syncRoomStateWithServer();
    }, 1500);
  }

  private async syncRoomStateWithServer() {
    if (!this.roomId || !this.currentUser) return;

    try {
      // 1. Send heartbeat
      const postRes = await fetch('/api/rooms/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: this.roomId,
          user: this.currentUser,
          action: 'heartbeat',
        }),
      });

      if (!postRes.ok) return;
      const syncData = await postRes.json();

      // 2. Sync remote participants
      if (syncData?.participants && Array.isArray(syncData.participants)) {
        for (const remoteP of syncData.participants) {
          if (remoteP.id !== this.currentUser.id) {
            this.trigger('presence:heartbeat', { user: remoteP });
          }
        }
      }

      // 3. Sync recent captions
      if (syncData?.recentCaptions && Array.isArray(syncData.recentCaptions)) {
        const count = syncData.recentCaptions.length;
        if (count > this.lastKnownCaptionsCount) {
          const newCaps = syncData.recentCaptions.slice(this.lastKnownCaptionsCount);
          for (const cap of newCaps) {
            if (cap.speakerId !== this.currentUser.id) {
              this.trigger('caption:new', cap);
            }
          }
          this.lastKnownCaptionsCount = count;
        }
      }

      // 4. Sync recent chat messages
      if (syncData?.recentChat && Array.isArray(syncData.recentChat)) {
        const count = syncData.recentChat.length;
        if (count > this.lastKnownChatCount) {
          const newMsgs = syncData.recentChat.slice(this.lastKnownChatCount);
          for (const msg of newMsgs) {
            if (msg.senderId !== this.currentUser.id) {
              this.trigger('chat:message', msg);
            }
          }
          this.lastKnownChatCount = count;
        }
      }
    } catch {
      // Offline or network error handled gracefully
    }
  }

  public broadcastRoomCreated(room: any) {
    this.publishMeshEvent('global:room_created', { room });

    // Also persist directly to server
    try {
      fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(room),
      }).catch(() => {});
    } catch {}
  }

  public broadcastUserRegistered(user: any) {
    this.publishMeshEvent('global:user_registered', { user });
  }

  public broadcastFeedbackSubmitted(feedback: any) {
    this.publishMeshEvent('global:feedback_submitted', { feedback });
  }

  public leaveRoom(roomId: string, userId: string) {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.serverSyncInterval) {
      clearInterval(this.serverSyncInterval);
      this.serverSyncInterval = null;
    }

    // Broadcast leave
    this.publishMeshEvent('user:left', { roomId, userId });

    // Notify serverless sync hub
    try {
      fetch('/api/rooms/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          user: { id: userId },
          action: 'leave',
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {}

    this.roomId = null;
    this.currentUser = null;
  }

  /**
   * Update current user in memory (e.g. when muted or hand raised)
   */
  public updateCurrentUser(updates: Partial<Participant>) {
    if (this.currentUser) {
      this.currentUser = { ...this.currentUser, ...updates };
    }
  }

  // --- Real-time Actions ---

  public sendCaption(caption: LiveCaptionItem) {
    this.publishMeshEvent('caption:new', caption);

    if (this.roomId) {
      fetch('/api/rooms/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: this.roomId,
          caption,
        }),
      }).catch(() => {});
    }
  }

  public sendChatMessage(message: ChatMessageItem) {
    this.publishMeshEvent('chat:message', message);

    if (this.roomId) {
      fetch('/api/rooms/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: this.roomId,
          chatMessage: message,
        }),
      }).catch(() => {});
    }
  }

  public toggleMute(userId: string, isMuted: boolean) {
    this.updateCurrentUser({ isMuted });
    this.publishMeshEvent('user:mute', { userId, isMuted });
  }

  public toggleSpeaking(userId: string, isSpeaking: boolean) {
    this.updateCurrentUser({ isSpeaking });
    this.publishMeshEvent('user:speaking', { userId, isSpeaking });
  }

  public raiseHand(userId: string, isRaised: boolean) {
    this.updateCurrentUser({ isHandRaised: isRaised });
    this.publishMeshEvent('user:hand', { userId, isRaised });
  }

  public changeStage(stage: StructuredStage, activeSpeakerId: string | null) {
    this.publishMeshEvent('stage:change', { stage, activeSpeakerId });

    if (this.roomId) {
      fetch('/api/rooms/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: this.roomId,
          stage,
          activeSpeakerId,
        }),
      }).catch(() => {});
    }
  }

  public sendModeratorAction(action: {
    type: 'mute' | 'kick' | 'role';
    targetId: string;
    role?: string;
  }) {
    this.publishMeshEvent('moderator:action', action);
  }

  /**
   * WebRTC Peer-to-Peer Signaling (offers, answers, ICE candidates)
   */
  public sendSignal(targetUserId: string, signal: any) {
    if (!this.currentUser) return;
    this.publishMeshEvent('webrtc:signal', {
      senderUserId: this.currentUser.id,
      targetUserId,
      signal,
    });

    if (this.roomId) {
      fetch('/api/rooms/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: this.roomId,
          signal: {
            senderUserId: this.currentUser.id,
            targetUserId,
            signal,
          },
        }),
      }).catch(() => {});
    }
  }

  // --- Event Listener Management ---

  public on(event: string, handler: SocketEventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  public trigger(event: string, ...args: any[]) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(...args);
        } catch (err) {
          console.error(`Error in event handler for ${event}:`, err);
        }
      });
    }
  }

  public emit(event: string, ...args: any[]) {
    this.publishMeshEvent(event, args[0]);
  }
}

export const realtimeClient = new RealtimeClient();
