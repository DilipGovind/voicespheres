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
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<SocketEventHandler>> = new Map();
  private isConnected = false;
  private roomId: string | null = null;
  private currentUser: Participant | null = null;
  private sessionId = 'session_' + Math.random().toString(36).substring(2, 11);
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private serverSyncInterval: NodeJS.Timeout | null = null;
  private seenMessageIds: Set<string> = new Set();

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

      // 2. Global cross-device HTTPS mesh (Windows, Mac, Android, iOS)
      this.initGlobalMesh();

      // 3. Standalone Node.js server fallback (for Docker / self-hosted)
      this.initSocketFallback();
    }
  }

  private initGlobalMesh() {
    if (typeof window === 'undefined') return;
    try {
      const globalSource = new EventSource('https://ntfy.sh/voicesphere_v2_global_rooms/sse');
      globalSource.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          if (raw.event === 'message' && raw.message) {
            const parsed = JSON.parse(raw.message);
            if (parsed && parsed.senderSessionId !== this.sessionId) {
              const msgKey = `${parsed.type}_${parsed.timestamp}_${parsed.senderSessionId}`;
              if (!this.seenMessageIds.has(msgKey)) {
                this.seenMessageIds.add(msgKey);
                this.handleIncomingEvent(parsed.type, parsed.data);
              }
            }
          }
        } catch {}
      };
      globalSource.onerror = () => {};

      // Hydrate recent global events from past 24 hours
      fetch('https://ntfy.sh/voicesphere_v2_global_rooms/json?poll=1&since=24h')
        .then((res) => res.text())
        .then((text) => {
          const lines = text.trim().split('\n');
          for (const line of lines) {
            try {
              const raw = JSON.parse(line);
              if (raw.event === 'message' && raw.message) {
                const parsed = JSON.parse(raw.message);
                if (parsed && parsed.senderSessionId !== this.sessionId) {
                  const msgKey = `${parsed.type}_${parsed.timestamp}_${parsed.senderSessionId}`;
                  if (!this.seenMessageIds.has(msgKey)) {
                    this.seenMessageIds.add(msgKey);
                    this.handleIncomingEvent(parsed.type, parsed.data);
                  }
                }
              }
            } catch {}
          }
        })
        .catch(() => {});
    } catch {}
  }

  private getCleanTopicName(roomId: string): string {
    const cleanId = roomId.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    return `voicesphere_v2_${cleanId}`;
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
   * Connect to global real-time cloud mesh (works cross-device Windows <-> Android <-> iOS)
   */
  private connectCloudMesh(roomId: string) {
    if (typeof window === 'undefined') return;

    // Close previous EventSource if any
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {}
      this.eventSource = null;
    }

    const topic = this.getCleanTopicName(roomId);
    const sseUrl = `https://ntfy.sh/${topic}/sse`;

    try {
      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.trigger('connection:change', { connected: true, transport: 'cloud-mesh' });
      };

      this.eventSource.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          if (raw.event === 'message' && raw.message) {
            const parsed: RealtimeEventPayload = JSON.parse(raw.message);
            if (parsed && parsed.senderSessionId !== this.sessionId) {
              const msgKey = `${parsed.type}_${parsed.timestamp}_${parsed.senderSessionId}`;
              if (!this.seenMessageIds.has(msgKey)) {
                this.seenMessageIds.add(msgKey);
                if (this.seenMessageIds.size > 200) {
                  // Keep cache size bounded
                  const first = this.seenMessageIds.values().next().value;
                  if (first) this.seenMessageIds.delete(first);
                }
                this.handleIncomingEvent(parsed.type, parsed.data);
              }
            }
          }
        } catch {
          // ignore malformed payloads
        }
      };

      this.eventSource.onerror = () => {
        // EventSource will auto-reconnect natively
      };
    } catch (err) {
      console.warn('Could not establish cloud SSE connection:', err);
    }

    // Pre-fetch recent messages from the past 5 minutes to hydrate existing participants
    fetch(`https://ntfy.sh/${topic}/json?poll=1&since=5m`)
      .then((res) => res.text())
      .then((text) => {
        const lines = text.trim().split('\n');
        for (const line of lines) {
          try {
            const raw = JSON.parse(line);
            if (raw.event === 'message' && raw.message) {
              const parsed: RealtimeEventPayload = JSON.parse(raw.message);
              if (parsed && parsed.senderSessionId !== this.sessionId) {
                if (parsed.type === 'user:joined' || parsed.type === 'presence:heartbeat') {
                  this.handleIncomingEvent(parsed.type, parsed.data);
                }
              }
            }
          } catch {}
        }
      })
      .catch(() => {});
  }

  /**
   * Internal incoming event processor
   */
  private handleIncomingEvent(type: string, data: any) {
    // If a new peer asks for sync or joined, reply immediately with our presence
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
   * 1. Cloud mesh (cross-platform Android, Windows, iOS)
   * 2. Local BroadcastChannel (cross-tab same machine)
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

    // 1. Publish to global cloud mesh (port 443 HTTPS)
    const topic = isGlobal ? 'voicesphere_v2_global_rooms' : this.getCleanTopicName(this.roomId!);
    try {
      fetch(`https://ntfy.sh/${topic}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    } catch {}

    // 2. BroadcastChannel cross-tab
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch {}
    }

    // 3. Socket.io fallback
    if (this.socket && this.socket.connected) {
      try {
        this.socket.emit(type, data);
      } catch {}
    }
  }

  /**
   * Join Room: registers user, connects cloud mesh, starts presence heartbeat
   */
  public joinRoom(roomId: string, user: Participant) {
    this.roomId = roomId;
    this.currentUser = user;

    // Connect cloud mesh for cross-platform devices
    this.connectCloudMesh(roomId);

    // Announce join
    this.publishMeshEvent('user:joined', { roomId, user });

    // Request presence sync from existing participants in the room
    this.publishMeshEvent('sync:request', {
      roomId,
      requesterId: user.id,
      requesterSessionId: this.sessionId,
    });

    // Start periodic presence heartbeat every 3.5 seconds
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      if (this.roomId && this.currentUser) {
        this.publishMeshEvent('presence:heartbeat', {
          roomId: this.roomId,
          user: this.currentUser,
        });
      }
    }, 3500);

    // Serverless HTTP Sync fallback ping
    if (this.serverSyncInterval) clearInterval(this.serverSyncInterval);
    this.serverSyncInterval = setInterval(() => {
      if (this.roomId && this.currentUser) {
        fetch('/api/rooms/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: this.roomId,
            user: this.currentUser,
            action: 'heartbeat',
          }),
        })
          .then((res) => res.json())
          .then((syncData) => {
            if (syncData?.participants && Array.isArray(syncData.participants)) {
              for (const remoteP of syncData.participants) {
                if (remoteP.id !== this.currentUser?.id) {
                  this.trigger('presence:heartbeat', { user: remoteP });
                }
              }
            }
          })
          .catch(() => {});
      }
    }, 4000);
  }

  /**
   * Leave Room: disconnects from cloud mesh and notifies peers
   */
  public broadcastRoomCreated(room: any) {
    this.publishMeshEvent('global:room_created', { room });
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

    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {}
      this.eventSource = null;
    }

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
  }

  public sendChatMessage(message: ChatMessageItem) {
    this.publishMeshEvent('chat:message', message);
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

  private trigger(event: string, data: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(data);
        } catch (err) {
          console.error(`Error in event handler for ${event}:`, err);
        }
      });
    }
  }
}

export const realtimeClient = new RealtimeClient();
