'use client';

import { io, Socket } from 'socket.io-client';
import { Participant, LiveCaptionItem, ChatMessageItem, StructuredStage } from '@/types/room';

export type SocketEventHandler = (...args: any[]) => void;

class RealtimeClient {
  private socket: Socket | null = null;
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<SocketEventHandler>> = new Map();
  private isConnected = false;
  private roomId: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        // BroadcastChannel provides cross-tab instant synchronization on the same origin (ideal for Vercel demo & testing multiple users)
        this.channel = new BroadcastChannel('voicesphere_realtime_mesh');
        this.channel.onmessage = (event) => {
          const { type, data } = event.data || {};
          if (type) {
            this.trigger(type, data);
          }
        };
      } catch {
        // ignore
      }

      this.initSocket();
    }
  }

  private initSocket() {
    try {
      // Connect to origin or localhost socket server
      this.socket = io({
        path: '/socket.io',
        reconnectionAttempts: 3,
        timeout: 3000,
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.trigger('connection:change', { connected: true });
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        this.trigger('connection:change', { connected: false });
      });

      // Relay server events
      this.socket.onAny((event, ...args) => {
        this.trigger(event, args[0]);
      });
    } catch {
      // Fallback mode is active
      this.isConnected = true;
    }
  }

  public joinRoom(roomId: string, user: Participant) {
    this.roomId = roomId;
    if (this.socket && this.socket.connected) {
      this.socket.emit('room:join', { roomId, user });
    }
    this.broadcastCrossTab('user:joined', { roomId, user });
  }

  public leaveRoom(roomId: string, userId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('room:leave', { roomId, userId });
    }
    this.broadcastCrossTab('user:left', { roomId, userId });
    this.roomId = null;
  }

  public sendCaption(caption: LiveCaptionItem) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('caption:new', caption);
    }
    this.broadcastCrossTab('caption:new', caption);
  }

  public sendChatMessage(message: ChatMessageItem) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('chat:message', message);
    }
    this.broadcastCrossTab('chat:message', message);
  }

  public toggleMute(userId: string, isMuted: boolean) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('user:mute', { userId, isMuted });
    }
    this.broadcastCrossTab('user:mute', { userId, isMuted });
  }

  public toggleSpeaking(userId: string, isSpeaking: boolean) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('user:speaking', { userId, isSpeaking });
    }
    this.broadcastCrossTab('user:speaking', { userId, isSpeaking });
  }

  public raiseHand(userId: string, isRaised: boolean) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('user:hand', { userId, isRaised });
    }
    this.broadcastCrossTab('user:hand', { userId, isRaised });
  }

  public changeStage(stage: StructuredStage, activeSpeakerId: string | null) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('stage:change', { stage, activeSpeakerId });
    }
    this.broadcastCrossTab('stage:change', { stage, activeSpeakerId });
  }

  public sendModeratorAction(action: {
    type: 'mute' | 'kick' | 'role';
    targetId: string;
    role?: string;
  }) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('moderator:action', action);
    }
    this.broadcastCrossTab('moderator:action', action);
  }

  // Cross-tab broadcast for multi-client testing & Vercel deployment
  private broadcastCrossTab(type: string, data: any) {
    this.trigger(type, data);
    if (this.channel) {
      try {
        this.channel.postMessage({ type, data });
      } catch {
        // ignore
      }
    }
  }

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
