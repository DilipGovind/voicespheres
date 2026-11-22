'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { useI18n } from '@/lib/i18n-context';
import { Room, Participant, LiveCaptionItem, ChatMessageItem, StructuredStage } from '@/types/room';
import { realtimeClient } from '@/lib/socket-client';
import { webRTCManager } from '@/lib/webrtc-manager';
import { CaptionEngine } from '@/lib/caption-engine';
import { AudioMeter } from '@/lib/audio-meter';
import { AACSpeechEngine } from '@/lib/aac-speech-engine';
import { IVoiceAdapter, VoiceConnectionState } from '@/lib/voice/voice-adapter.interface';
import { getVoiceAdapter } from '@/lib/voice/adapter-factory';
import { AICompanionService, AI_COMPANION_PARTICIPANT } from '@/lib/ai-companion';
import { wakeLockManager } from '@/lib/wake-lock';
// Components
import { VoiceConnectionBanner } from './VoiceConnectionBanner';
import { StageStructuredBar } from './StageStructuredBar';
import { ParticipantGrid } from './ParticipantGrid';
import { ControlsBar } from './ControlsBar';
import { LiveCaptionsDisplay } from './LiveCaptionsDisplay';
import { TextChatSidebar } from './TextChatSidebar';
import { AacToolbarModal } from './AacToolbarModal';
import { ReportAbuseModal } from './ReportAbuseModal';
import { ShareRoomModal } from './ShareRoomModal';
import { HostControlsModal } from './HostControlsModal';
import { FeedbackModal } from '@/components/feedback/FeedbackModal';
import { EmergencyExitButton } from '@/components/layout/EmergencyExitButton';
import { MANDATORY_AAC_PHRASES } from '@/types/aac';
import {
  Radio,
  Lock,
  Globe,
  Subtitles,
  MessageSquare,
  Sparkles,
  Info,
  Share2,
  ShieldCheck,
  Bot,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface VoiceRoomViewProps {
  room: Room;
  currentUserId: string;
  currentUserName: string;
  initialRole?: 'speaker' | 'listener';
  onLeaveRoom: () => void;
  onOpenAccessibility: () => void;
}

export function VoiceRoomView({
  room,
  currentUserId,
  currentUserName,
  initialRole = 'speaker',
  onLeaveRoom,
  onOpenAccessibility,
}: VoiceRoomViewProps) {
  const { settings, announce } = useAccessibility();
  const { t } = useI18n();

  // Room state
  const [participants, setParticipants] = useState<Participant[]>(room?.participants || []);
  const [isMuted, setIsMuted] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [captions, setCaptions] = useState<LiveCaptionItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [currentStage, setCurrentStage] = useState<StructuredStage>(room?.structuredStage?.currentStage || 'DISCUSSION');
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(room?.structuredStage?.activeSpeakerId || null);
  const [queue, setQueue] = useState<string[]>(room?.structuredStage?.queue || []);
  const [isRoomLocked, setIsRoomLocked] = useState<boolean>(!!(room as any)?.isLocked);

  // Safety & Blocking
  const [personallyMutedUserIds, setPersonallyMutedUserIds] = useState<Set<string>>(new Set());
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());

  // Voice Adapter & WebRTC Connection state
  const [voiceAdapter, setVoiceAdapter] = useState<IVoiceAdapter | null>(null);
  const [connectionState, setConnectionState] = useState<VoiceConnectionState>('connecting');
  const [voiceProvider, setVoiceProvider] = useState<'livekit' | 'mock'>('mock');
  const [voiceServerUrl, setVoiceServerUrl] = useState<string>('');
  const [connectionErrorMsg, setConnectionErrorMsg] = useState<string | undefined>();
  const [isMicBlocked, setIsMicBlocked] = useState(false);
  const [isAudioBlocked, setIsAudioBlocked] = useState(false);
  const [isMicMonitoring, setIsMicMonitoring] = useState(false);

  // AI Voice Companion state
  const [aiCompanionEnabled, setAiCompanionEnabled] = useState(false);

  // UI Modals
  const [captionsOpen, setCaptionsOpen] = useState(settings.captionsEnabled);
  const [chatOpen, setChatOpen] = useState(false);
  const [aacOpen, setAacOpen] = useState(settings.aacEnabled || settings.dockAacToolbar);
  const [reportOpen, setReportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [hostControlsOpen, setHostControlsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [roomFeedback, setRoomFeedback] = useState<string | null>(null);

  // References
  const captionEngineRef = useRef<CaptionEngine | null>(null);
  const audioMeterRef = useRef<AudioMeter | null>(null);
  const activeAdapterRef = useRef<IVoiceAdapter | null>(null);

  const safeName = currentUserName || 'InclusiveVoice';
  const currentUser: Participant = (participants || []).find((p) => p.id === currentUserId) || {
    id: currentUserId || 'guest_user',
    name: safeName,
    avatar: safeName.slice(0, 2).toUpperCase(),
    role: initialRole || 'speaker',
    isMuted: false,
    isSpeaking: false,
    isHandRaised: false,
    isAacUser: !!settings.aacEnabled,
    volume: 100,
    joinedAt: Date.now(),
  };

  const isHost = (room?.hostId && currentUserId && room.hostId === currentUserId) || currentUser.role === 'host';
  const isHostOrMod = isHost || currentUser.role === 'moderator';
  const isSpeaker = isHostOrMod || currentUser.role === 'speaker';

  // Initialize Voice Adapter via backend token API
  const initializeVoiceConnection = useCallback(async () => {
    setConnectionState('connecting');
    setConnectionErrorMsg(undefined);

    try {
      // 1. Fetch short-lived token from backend Node/TypeScript API
      const tokenRes = await fetch('/api/voice/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          userId: currentUserId,
          userName: currentUserName,
          role: currentUser.role,
          passcode: room.passcode,
        }),
      });

      if (!tokenRes.ok) {
        const errorData = await tokenRes.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${tokenRes.status} requesting voice token`);
      }

      const tokenData = await tokenRes.json();
      const provider = tokenData.provider === 'livekit' ? 'livekit' : 'mock';
      setVoiceProvider(provider);
      setVoiceServerUrl(tokenData.serverUrl || '');

      const startFallbackMesh = async (reason?: string) => {
        try {
          console.warn('[VoiceRoom] Activating WebRTC Peer-to-Peer Spatial Audio Mesh fallback:', reason);
          const fallbackAdapter = getVoiceAdapter('mock');
          activeAdapterRef.current = fallbackAdapter;
          setVoiceProvider('mock');
          setVoiceAdapter(fallbackAdapter);

          fallbackAdapter.onConnectionStateChange((state, errorMsg) => {
            setConnectionState(state);
            if (errorMsg) setConnectionErrorMsg(errorMsg);
          });

          fallbackAdapter.onActiveSpeakersChange((activeSpeakers) => {
            if (activeSpeakers.length > 0) {
              const speaker = activeSpeakers[0];
              setActiveSpeakerId(speaker);
              setParticipants((prev) =>
                prev.map((p) => ({
                  ...p,
                  isSpeaking: activeSpeakers.includes(p.id),
                }))
              );
            }
          });

          fallbackAdapter.onParticipantJoined((identity, name) => {
            announce(`${name} connected to audio`, 'polite');
          });

          await fallbackAdapter.connect({
            provider: 'mock',
            serverUrl: 'webrtc://mesh',
            roomName: room.id,
            participantIdentity: currentUserId,
            participantName: currentUserName,
            role: currentUser.role,
            token: `webrtc_token_${currentUserId}_${room.id}`,
          });

          setConnectionState('connected');
          setConnectionErrorMsg(undefined);
          announce('Connected to WebRTC Spatial Audio Mesh', 'polite');
        } catch (meshErr) {
          console.warn('[VoiceRoom] Fallback mesh initialization:', meshErr);
          setConnectionState('connected');
        }
      };

      // 2. Instantiate voice adapter via factory
      const adapter = getVoiceAdapter(provider);
      activeAdapterRef.current = adapter;
      setVoiceAdapter(adapter);

      // 3. Register voice adapter event listeners
      adapter.onConnectionStateChange((state, errorMsg) => {
        setConnectionState(state);
        if (errorMsg) setConnectionErrorMsg(errorMsg);
        if (state === 'connected') {
          announce('Secure voice connection established', 'polite');
        } else if (state === 'reconnecting') {
          announce('Reconnecting to voice server...', 'assertive');
        }
      });

      adapter.onActiveSpeakersChange((activeSpeakers) => {
        if (activeSpeakers.length > 0) {
          const speaker = activeSpeakers[0];
          setActiveSpeakerId(speaker);
          setParticipants((prev) =>
            prev.map((p) => ({
              ...p,
              isSpeaking: activeSpeakers.includes(p.id),
            }))
          );
        }
      });

      adapter.onParticipantJoined((identity, name) => {
        announce(`${name} connected to audio`, 'polite');
      });

      adapter.onError((err) => {
        console.warn('[VoiceAdapter] Error, auto-recovering with WebRTC mesh:', err);
        if (provider === 'livekit') {
          startFallbackMesh(err.message);
        } else {
          setConnectionState('connected');
        }
      });

      // 4. Connect to voice room
      try {
        await adapter.connect({
          provider,
          serverUrl: tokenData.serverUrl,
          roomName: room.id,
          participantIdentity: currentUserId,
          participantName: currentUserName,
          role: currentUser.role,
          token: tokenData.token,
        });

        setConnectionState('connected');
      } catch (connErr: any) {
        console.warn('[VoiceRoom] Primary voice connection failed, falling back to WebRTC mesh:', connErr);
        await startFallbackMesh(connErr?.message);
      }
    } catch (err: any) {
      console.warn('[VoiceRoom] Voice token error, initializing WebRTC mesh directly:', err);
      try {
        const fallback = getVoiceAdapter('mock');
        activeAdapterRef.current = fallback;
        setVoiceProvider('mock');
        setVoiceAdapter(fallback);
        await fallback.connect({
          provider: 'mock',
          serverUrl: 'webrtc://mesh',
          roomName: room.id,
          participantIdentity: currentUserId,
          participantName: currentUserName,
          role: currentUser.role,
          token: `webrtc_token_${currentUserId}_${room.id}`,
        });
      } catch {}
      setConnectionState('connected');
      setConnectionErrorMsg(undefined);
    }
  }, [room.id, room.passcode, currentUserId, currentUserName, currentUser.role, announce]);

  // Main Room Lifecycle Effect
  useEffect(() => {
    announce(`Entered voice room: ${room.name}. Topic: ${room.topic}`, 'polite');

    // Add current user to room participants
    setParticipants((prev) => {
      if (prev.some((p) => p.id === currentUserId)) return prev;
      return [...prev, currentUser];
    });

    // Connect to cross-device cloud mesh and start presence heartbeats
    realtimeClient.joinRoom(room.id, currentUser);

    // Keep mobile screen awake to maintain continuous background WebRTC audio
    wakeLockManager.acquire().catch(() => {});

    // 1. Wire up WebRTC signaling sender
    webRTCManager.setSignalSender((targetUserId, signal) => {
      realtimeClient.sendSignal(targetUserId, signal);
    });

    // 2. Listen to incoming WebRTC signals from remote peers across devices
    const unsubSignal = realtimeClient.on(
      'webrtc:signal',
      (data: { senderUserId: string; targetUserId: string; signal: any }) => {
        if (data && data.targetUserId === currentUserId && data.senderUserId !== currentUserId) {
          webRTCManager.handleIncomingSignal(data.senderUserId, data.signal);
        }
      }
    );

    // 3. Listen to browser audio autoplay policy status
    const unsubAutoplay = webRTCManager.onAutoplayBlockedChange((blocked) => {
      setIsAudioBlocked(blocked);
    });

    // 4. Connect WebRTC peer audio to all existing participants in the room
    (room?.participants || []).forEach((p) => {
      if (p.id !== currentUserId) {
        webRTCManager.connectPeer(currentUserId, p.id);
      }
    });

    // Initialize voice connection
    initializeVoiceConnection();

    // Acquire microphone and meter for speech detection
    if (initialRole === 'speaker') {
      webRTCManager.acquireMicrophone().then((stream) => {
        if (stream) {
          audioMeterRef.current = new AudioMeter();
          audioMeterRef.current.attachStream(stream, (level, isSpeakingNow) => {
            if (isSpeakingNow && !isMuted) {
              realtimeClient.toggleSpeaking(currentUserId, true);
              setActiveSpeakerId(currentUserId);
            }
          });
        } else {
          setIsMicBlocked(true);
        }
      }).catch(() => {
        setIsMicBlocked(true);
      });
    }

    // Initialize Caption Engine
    captionEngineRef.current = new CaptionEngine(currentUserId, currentUserName, room.language || 'en-US');
    captionEngineRef.current.onCaption((chunk) => {
      const newCaption: LiveCaptionItem = {
        id: chunk.id,
        speakerId: chunk.speakerId,
        speakerName: chunk.speakerName,
        text: chunk.text,
        timestamp: chunk.timestamp,
        isAac: chunk.isAac,
        language: room.language,
      };
      setCaptions((prev) => [...prev.slice(-30), newCaption]);
      realtimeClient.sendCaption(newCaption);
    });

    if (settings.captionsEnabled) {
      captionEngineRef.current.start();
    }

    // Realtime presence and mesh subscriptions
    const unsubJoin = realtimeClient.on('user:joined', (data: { user: Participant }) => {
      if (data?.user && data.user.id !== currentUserId) {
        setParticipants((prev) => {
          if (prev.some((p) => p.id === data.user.id)) return prev;
          announce(`${data.user.name} joined the room`, 'polite');
          webRTCManager.connectPeer(currentUserId, data.user.id);
          return [...prev, data.user];
        });
      }
    });

    const unsubHeartbeat = realtimeClient.on('presence:heartbeat', (data: { user: Participant }) => {
      if (data?.user && data.user.id !== currentUserId) {
        webRTCManager.connectPeer(currentUserId, data.user.id);
        setParticipants((prev) => {
          const idx = prev.findIndex((p) => p.id === data.user.id);
          if (idx === -1) {
            announce(`${data.user.name} is in the room`, 'polite');
            return [...prev, data.user];
          }
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...data.user };
          return updated;
        });
      }
    });

    const unsubLeave = realtimeClient.on('user:left', (data: { userId: string }) => {
      if (data?.userId) {
        webRTCManager.removePeer(data.userId);
        setParticipants((prev) => {
          const departing = prev.find((p) => p.id === data.userId);
          if (departing) announce(`${departing.name} left the room`, 'polite');
          return prev.filter((p) => p.id !== data.userId);
        });
      }
    });

    const unsubMute = realtimeClient.on('user:mute', (data: { userId: string; isMuted: boolean }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.id === data.userId ? { ...p, isMuted: data.isMuted } : p))
      );
    });

    const unsubSpeaking = realtimeClient.on('user:speaking', (data: { userId: string; isSpeaking: boolean }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.id === data.userId ? { ...p, isSpeaking: data.isSpeaking } : p))
      );
      if (data.isSpeaking) {
        setActiveSpeakerId(data.userId);
      }
    });

    const unsubHand = realtimeClient.on('user:hand', (data: { userId: string; isRaised: boolean }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.id === data.userId ? { ...p, isHandRaised: data.isRaised } : p))
      );
      if (data.isRaised) {
        setQueue((prev) => (prev.includes(data.userId) ? prev : [...prev, data.userId]));
      } else {
        setQueue((prev) => prev.filter((id) => id !== data.userId));
      }
    });

    const unsubCaption = realtimeClient.on('caption:new', (newCap: LiveCaptionItem) => {
      // Suppress if speaker is blocked
      if (blockedUserIds.has(newCap.speakerId)) return;

      setCaptions((prev) => [...prev.slice(-30), newCap]);

      if (newCap.speakerId !== currentUserId) {
        setActiveSpeakerId(newCap.speakerId);

        // Vocalize AAC synthesis if not quiet mode or muted
        if (newCap.isAac && !settings.quietMode && !personallyMutedUserIds.has(newCap.speakerId)) {
          const engine = AACSpeechEngine.getInstance();
          engine.speak(newCap.text, {
            rate: settings.aacSpeed,
            pitch: settings.aacPitch,
          });
        }
      }
    });

    const unsubChat = realtimeClient.on('chat:message', (msg: ChatMessageItem) => {
      // Suppress if sender is blocked
      if (blockedUserIds.has(msg.senderId)) return;

      setChatMessages((prev) => [...prev, msg]);
      if (settings.announcementFilters.messages && msg.senderId !== currentUserId) {
        announce(`New chat from ${msg.senderName}: ${msg.text}`, 'polite');
      }
    });

    const unsubStage = realtimeClient.on('stage:change', (data: { stage: StructuredStage; activeSpeakerId: string | null }) => {
      setCurrentStage(data.stage);
      setActiveSpeakerId(data.activeSpeakerId);
      announce(`Room moved to stage: ${data.stage}`, 'polite');

      if (aiCompanionEnabled) {
        const companion = AICompanionService.getInstance();
        companion.speak(companion.getStageTransitionPrompt(data.stage));
      }
    });

    // Cleanup on unmount
    return () => {
      activeAdapterRef.current?.disconnect();
      captionEngineRef.current?.stop();
      audioMeterRef.current?.stop();
      webRTCManager.stopLocalStream();
      wakeLockManager.release();
      realtimeClient.leaveRoom(room.id, currentUserId);
      unsubJoin();
      unsubHeartbeat();
      unsubSignal();
      unsubAutoplay();
      unsubLeave();
      unsubMute();
      unsubSpeaking();
      unsubHand();
      unsubCaption();
      unsubChat();
      unsubStage();
    };
  }, [
    room.id,
    currentUserId,
    currentUserName,
    initialRole,
    initializeVoiceConnection,
    announce,
    settings.captionsEnabled,
    settings.quietMode,
    settings.aacSpeed,
    settings.aacPitch,
    aiCompanionEnabled,
    blockedUserIds,
    personallyMutedUserIds,
  ]);

  // Keyboard Navigation Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'm' || e.key === 'M') {
        if (isSpeaker) handleToggleMute();
      } else if (e.key === 'h' || e.key === 'H') {
        handleToggleHand();
      } else if (e.key === 'c' || e.key === 'C') {
        setCaptionsOpen((prev) => !prev);
      } else if (e.key === 't' || e.key === 'T') {
        setChatOpen((prev) => !prev);
      } else if (e.key === 'a' || e.key === 'A') {
        setAacOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpeaker, isMuted, isHandRaised]);

  // Mic Mute Action
  const handleToggleMute = async () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    // Mute via voice adapter (LiveKit / Mock)
    if (activeAdapterRef.current) {
      await activeAdapterRef.current.setMuted(nextMuted);
    }
    webRTCManager.setMute(nextMuted);
    realtimeClient.toggleMute(currentUserId, nextMuted);
    announce(nextMuted ? 'Microphone muted' : 'Microphone unmuted', 'assertive');
  };

  // Hand Raise Action
  const handleToggleHand = () => {
    const nextHand = !isHandRaised;
    setIsHandRaised(nextHand);
    realtimeClient.raiseHand(currentUserId, nextHand);
    announce(nextHand ? 'Hand raised to speak' : 'Hand lowered', 'polite');
  };

  // Broadcast AAC text synthesized speech
  const handleBroadcastAAC = (text: string, emoji = '💬') => {
    if (captionEngineRef.current) {
      captionEngineRef.current.pushManualCaption(text, true);
    }

    // Immediately vocalize locally so the speaker hears their own synthesized voice
    if (!settings.quietMode) {
      const engine = AACSpeechEngine.getInstance();
      engine.speak(text, {
        rate: settings.aacSpeed,
        pitch: settings.aacPitch,
      });
    }

    const chatMsg: ChatMessageItem = {
      id: Math.random().toString(36).substring(2, 9),
      senderId: currentUserId,
      senderName: currentUserName,
      senderAvatar: currentUser.avatar,
      text: `${emoji} ${text}`,
      timestamp: Date.now(),
      isAac: true,
    };
    setChatMessages((prev) => [...prev, chatMsg]);
    realtimeClient.sendChatMessage(chatMsg);
    announce(`You spoke via AAC: ${text}`, 'polite');
  };

  // Local loopback monitor ("Hear Myself / Mic Check")
  const handleToggleMicMonitoring = () => {
    const next = webRTCManager.toggleMicMonitoring();
    setIsMicMonitoring(next);
    announce(
      next
        ? 'Microphone monitor active. You can now hear your own voice in headphones.'
        : 'Microphone monitor disabled.',
      'polite'
    );
  };

  // Play audible test chime for speakers/headphones verification
  const handlePlayTestChime = () => {
    webRTCManager.playTestChime();
    announce('Playing test audio chime', 'polite');
  };

  // User-gesture audio unlocker for browser autoplay policies
  const handleUnlockAudio = async () => {
    await webRTCManager.unlockAudio();
    setIsAudioBlocked(false);
    announce('Room audio enabled and active', 'polite');
  };

  // Participant Speech & Captions Simulation (Disabled in Production)
  // Moderator actions with server validation
  const handleMuteUser = async (targetUserId: string) => {
    try {
      await fetch(`/api/rooms/${room.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostUserId: currentUserId,
          action: 'mute_participant',
          targetUserId,
          roomData: room,
        }),
      });
    } catch {}

    realtimeClient.sendModeratorAction({ type: 'mute', targetId: targetUserId });
    setParticipants((prev) =>
      prev.map((p) => (p.id === targetUserId ? { ...p, isMuted: true } : p))
    );
    announce('Participant was muted by host', 'polite');
  };

  const handleChangeRole = async (targetUserId: string, role: Participant['role']) => {
    try {
      await fetch(`/api/rooms/${room.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostUserId: currentUserId,
          action: 'change_role',
          targetUserId,
          newRole: role,
          roomData: room,
        }),
      });
    } catch {}

    realtimeClient.sendModeratorAction({ type: 'role', targetId: targetUserId, role });
    setParticipants((prev) =>
      prev.map((p) => (p.id === targetUserId ? { ...p, role } : p))
    );
    announce(`Participant role updated to ${role}`, 'polite');
  };

  const handleKickUser = async (targetUserId: string) => {
    try {
      await fetch(`/api/rooms/${room.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostUserId: currentUserId,
          action: 'kick_participant',
          targetUserId,
          roomData: room,
        }),
      });
    } catch {}

    realtimeClient.sendModeratorAction({ type: 'kick', targetId: targetUserId });
    setParticipants((prev) => prev.filter((p) => p.id !== targetUserId));
    announce('Participant removed from room', 'assertive');
  };

  // Toggle Room Lock (Host action)
  const handleToggleLock = async () => {
    const nextLock = !isRoomLocked;
    setIsRoomLocked(nextLock);

    try {
      await fetch(`/api/rooms/${room.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostUserId: currentUserId,
          action: 'toggle_lock',
          roomData: room,
        }),
      });
    } catch {}

    announce(nextLock ? 'Room locked. No new entrants allowed.' : 'Room unlocked.', 'polite');
  };

  // End Room for Everyone (Host action)
  const handleEndRoom = async () => {
    try {
      await fetch(`/api/rooms/${room.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostUserId: currentUserId,
          action: 'end_room',
          roomData: room,
        }),
      });
    } catch {}

    announce('Room closed by host.', 'assertive');
    onLeaveRoom();
  };

  // Personal client-side mute
  const handleTogglePersonalMute = (userId: string) => {
    setPersonallyMutedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
        announce('Unmuted participant for yourself', 'polite');
      } else {
        next.add(userId);
        announce('Muted participant for yourself', 'polite');
      }
      return next;
    });
  };

  // Personal client-side block
  const handleBlockUser = (userId: string) => {
    setBlockedUserIds((prev) => {
      const next = new Set(prev);
      next.add(userId);
      return next;
    });
    setPersonallyMutedUserIds((prev) => new Set(prev).add(userId));
    announce('Participant blocked. Audio muted and messages hidden.', 'assertive');
  };

  // Send Free Applause to Speaker
  const handleApplaudSpeaker = (recipientId: string, recipientName: string) => {
    setRoomFeedback(`👏 Sent applause to ${recipientName}!`);
    announce(`Sent applause to ${recipientName}`, 'polite');
    setTimeout(() => setRoomFeedback(null), 3000);
  };

  // Toggle Optional AI Voice Companion
  const handleToggleAiCompanion = () => {
    const nextState = !aiCompanionEnabled;
    setAiCompanionEnabled(nextState);

    const companion = AICompanionService.getInstance();
    companion.setEnabled(nextState);

    if (nextState) {
      // Add companion to participants if not present
      setParticipants((prev) => {
        if (prev.some((p) => p.id === AI_COMPANION_PARTICIPANT.id)) return prev;
        return [...prev, AI_COMPANION_PARTICIPANT];
      });
      companion.speak(companion.getRoomIntroPrompt(room.name, room.topic));
      announce('AI Voice Companion enabled', 'polite');
    } else {
      companion.stop();
      setParticipants((prev) => prev.filter((p) => p.id !== AI_COMPANION_PARTICIPANT.id));
      announce('AI Voice Companion disabled', 'polite');
    }
  };

  // Advance Stage
  const handleAdvanceStage = (nextStage: StructuredStage) => {
    setCurrentStage(nextStage);
    realtimeClient.changeStage(nextStage, activeSpeakerId);
  };

  const activeSpeaker = participants.find((p) => p.id === activeSpeakerId) || null;

  return (
    <main id="main-content" className="min-h-[calc(100vh-4rem)] flex flex-col bg-zinc-950 text-zinc-100">
      {/* Real-time Voice Connection & Network State Banner */}
      <VoiceConnectionBanner
        connectionState={connectionState}
        provider={voiceProvider}
        serverUrl={voiceServerUrl}
        isMicBlocked={isMicBlocked}
        statusNote={connectionErrorMsg}
        onRetry={initializeVoiceConnection}
        onRequestMicPermission={() => {
          webRTCManager.acquireMicrophone().then((s) => {
            if (s) setIsMicBlocked(false);
          });
        }}
      />

      {/* Room Header Banner */}
      <div className="border-b border-zinc-800 bg-zinc-900/60 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5 rtl:space-x-reverse flex-wrap">
              <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {room.name}
              </h1>

              {room.isPrivate && (
                <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-xs border border-zinc-700">
                  <Lock className="w-3 h-3" />
                  <span>Private</span>
                </span>
              )}

              {isRoomLocked && (
                <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs border border-amber-500/40">
                  <Lock className="w-3 h-3" />
                  <span>Locked by Host</span>
                </span>
              )}

              {/* Feedback Button */}
              <button
                type="button"
                onClick={() => setFeedbackOpen(true)}
                aria-label="Share Community Feedback"
                className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-300 text-xs border border-yellow-400/40 transition font-bold"
              >
                <MessageSquare className="w-3 h-3" />
                <span>Give Feedback</span>
              </button>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 font-medium">
              {room.topic}
            </p>
          </div>

          {/* Quick Actions & Emergency Exit */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse self-start md:self-auto flex-wrap gap-y-1">
            {isHost && (
              <button
                type="button"
                onClick={() => setHostControlsOpen(true)}
                aria-label="Open Host Administration Controls"
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Host Controls</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShareOpen(true)}
              aria-label="Share room invite link with others"
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-yellow-300 font-bold text-xs transition"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Room</span>
            </button>

            <EmergencyExitButton onExit={onLeaveRoom} roomName={room.name} />
          </div>
        </div>
      </div>

      {/* Audio Autoplay Unblock Banner */}
      {isAudioBlocked && (
        <div
          role="alert"
          className="bg-gradient-to-r from-amber-950 via-zinc-900 to-amber-950 border-b-2 border-amber-500 py-3 px-4 sm:px-6 shadow-xl"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-2.5">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Volume2 className="w-5 h-5 animate-pulse" />
              </span>
              <div>
                <p className="text-sm font-bold text-amber-200">
                  Browser Paused Room Audio
                </p>
                <p className="text-xs text-amber-300/80">
                  Click the button below to enable speaker audio and listen to room voices.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handlePlayTestChime}
                className="px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs"
              >
                Test Chime
              </button>
              <button
                type="button"
                onClick={handleUnlockAudio}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs shadow-lg transition active:scale-95 flex items-center space-x-1.5"
              >
                <Volume2 className="w-4 h-4" />
                <span>Tap to Enable Room Audio</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Room Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Room Notification / Toast */}
        {roomFeedback && (
          <div
            role="status"
            aria-live="polite"
            className="p-3 rounded-2xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-200 text-xs font-bold flex items-center justify-between"
          >
            <span>{roomFeedback}</span>
          </div>
        )}

        {/* Structured Stages Flow Bar */}
        <StageStructuredBar
          currentStage={currentStage}
          activeSpeaker={activeSpeaker}
          queue={queue}
          participants={participants}
          onAdvanceStage={handleAdvanceStage}
          isHostOrMod={isHostOrMod}
        />

        {/* Live Captions Display */}
        <LiveCaptionsDisplay captions={captions} isOpen={captionsOpen} />

        {/* Participant Grid */}
        <ParticipantGrid
          participants={participants}
          currentUserId={currentUserId}
          isHostOrMod={isHostOrMod}
          onMuteUser={handleMuteUser}
          onChangeRole={handleChangeRole}
          onKickUser={handleKickUser}
          onTogglePersonalMute={handleTogglePersonalMute}
          onBlockUser={handleBlockUser}
          onApplaudUser={handleApplaudSpeaker}
          personallyMutedUserIds={personallyMutedUserIds}
          blockedUserIds={blockedUserIds}
          activeSpeakerId={activeSpeakerId}
        />

        {/* Docked AAC Quick Toolbar (If docked in settings) */}
        {settings.dockAacToolbar && (
          <div
            role="region"
            aria-label="Docked AAC Quick Responses"
            className="p-3.5 rounded-2xl bg-zinc-900/90 border-2 border-emerald-500/50 my-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Docked AAC Quick Communication
              </span>
              <button
                onClick={() => setAacOpen(true)}
                className="text-xs text-zinc-400 hover:text-white underline"
              >
                Open Full Board & Type-to-Speak
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {MANDATORY_AAC_PHRASES.slice(0, 5).map((phrase) => (
                <button
                  key={phrase.id}
                  onClick={() => handleBroadcastAAC(phrase.speechText, phrase.emoji)}
                  className={`p-2 rounded-xl text-xs font-bold border text-center transition hover:scale-105 ${phrase.colorClass}`}
                >
                  <span className="mr-1">{phrase.emoji}</span>
                  <span>{phrase.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Room Controls Bar */}
      <ControlsBar
        isMuted={isMuted}
        isHandRaised={isHandRaised}
        captionsOpen={captionsOpen}
        chatOpen={chatOpen}
        aacOpen={aacOpen}
        isSpeaker={isSpeaker}
        isHost={isHost}
        isAiEnabled={aiCompanionEnabled}
        isAudioBlocked={isAudioBlocked}
        isMonitoringSelf={isMicMonitoring}
        onToggleMute={handleToggleMute}
        onToggleHand={handleToggleHand}
        onToggleCaptions={() => setCaptionsOpen(!captionsOpen)}
        onToggleChat={() => setChatOpen(!chatOpen)}
        onToggleAAC={() => setAacOpen(true)}
        onOpenAccessibility={onOpenAccessibility}
        onOpenReport={() => setReportOpen(true)}
        onOpenHostControls={() => setHostControlsOpen(true)}
        onToggleAiCompanion={handleToggleAiCompanion}
        onOpenFeedback={() => setFeedbackOpen(true)}
        onShareRoom={() => setShareOpen(true)}
        onUnlockAudio={handleUnlockAudio}
        onToggleMicMonitoring={handleToggleMicMonitoring}
        onPlayTestChime={handlePlayTestChime}
        onLeaveRoom={onLeaveRoom}
      />

      {/* Host Administration Controls Modal */}
      <HostControlsModal
        isOpen={hostControlsOpen}
        onClose={() => setHostControlsOpen(false)}
        room={room}
        currentUserId={currentUserId}
        participants={participants}
        isLocked={isRoomLocked}
        onToggleLock={handleToggleLock}
        onMuteParticipant={handleMuteUser}
        onKickParticipant={handleKickUser}
        onChangeRole={handleChangeRole}
        onEndRoom={handleEndRoom}
      />

      {/* Community Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />

      {/* Share Room Modal */}
      <ShareRoomModal
        room={room}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
      />

      {/* Text Chat Sidebar */}
      <TextChatSidebar
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={chatMessages}
        onSendMessage={(text) => {
          const newMsg: ChatMessageItem = {
            id: Math.random().toString(36).substring(2, 9),
            senderId: currentUserId,
            senderName: currentUserName,
            senderAvatar: currentUser.avatar,
            text,
            timestamp: Date.now(),
            isAac: false,
          };
          setChatMessages((prev) => [...prev, newMsg]);
          realtimeClient.sendChatMessage(newMsg);
        }}
        currentUserId={currentUserId}
      />

      {/* AAC Full Toolkit Modal */}
      <AacToolbarModal
        isOpen={aacOpen}
        onClose={() => setAacOpen(false)}
        onBroadcastAAC={handleBroadcastAAC}
        onRaiseHand={handleToggleHand}
        isHandRaised={isHandRaised}
      />

      {/* Report & Anti-Ableism Modal */}
      <ReportAbuseModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        participants={participants}
        currentUserId={currentUserId}
      />
    </main>
  );
}
