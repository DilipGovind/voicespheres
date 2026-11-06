'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { useI18n } from '@/lib/i18n-context';
import { Room, Participant, LiveCaptionItem, ChatMessageItem, StructuredStage } from '@/types/room';
import { realtimeClient } from '@/lib/socket-client';
import { webRTCManager } from '@/lib/webrtc-manager';
import { CaptionEngine } from '@/lib/caption-engine';
import { AudioMeter } from '@/lib/audio-meter';
import { StageStructuredBar } from './StageStructuredBar';
import { ParticipantGrid } from './ParticipantGrid';
import { ControlsBar } from './ControlsBar';
import { LiveCaptionsDisplay } from './LiveCaptionsDisplay';
import { TextChatSidebar } from './TextChatSidebar';
import { AacToolbarModal } from './AacToolbarModal';
import { ReportAbuseModal } from './ReportAbuseModal';
import { ShareRoomModal } from './ShareRoomModal';
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

  // State
  const [participants, setParticipants] = useState<Participant[]>(room.participants);
  const [isMuted, setIsMuted] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [captions, setCaptions] = useState<LiveCaptionItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [currentStage, setCurrentStage] = useState<StructuredStage>(room.structuredStage.currentStage);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(room.structuredStage.activeSpeakerId);
  const [queue, setQueue] = useState<string[]>(room.structuredStage.queue);
  const [personallyMutedUserIds, setPersonallyMutedUserIds] = useState<Set<string>>(new Set());

  // UI Modals
  const [captionsOpen, setCaptionsOpen] = useState(settings.captionsEnabled);
  const [chatOpen, setChatOpen] = useState(false);
  const [aacOpen, setAacOpen] = useState(settings.aacEnabled || settings.dockAacToolbar);
  const [reportOpen, setReportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // References
  const captionEngineRef = useRef<CaptionEngine | null>(null);
  const audioMeterRef = useRef<AudioMeter | null>(null);

  const currentUser = participants.find((p) => p.id === currentUserId) || {
    id: currentUserId,
    name: currentUserName,
    avatar: currentUserName.slice(0, 2).toUpperCase(),
    role: initialRole,
    isMuted: false,
    isSpeaking: false,
    isHandRaised: false,
    isAacUser: settings.aacEnabled,
    volume: 100,
    joinedAt: Date.now(),
  };

  const isSpeaker = currentUser.role === 'host' || currentUser.role === 'moderator' || currentUser.role === 'speaker';
  const isHostOrMod = currentUser.role === 'host' || currentUser.role === 'moderator';

  // Initialize WebRTC, Socket, and Audio on Room Enter
  useEffect(() => {
    announce(`Entered voice room: ${room.name}. Topic: ${room.topic}`, 'polite');

    // Add current user to room participants if not present
    setParticipants((prev) => {
      if (prev.some((p) => p.id === currentUserId)) return prev;
      return [...prev, currentUser];
    });

    realtimeClient.joinRoom(room.id, currentUser);

    // Acquire microphone if joining as speaker
    if (initialRole === 'speaker') {
      webRTCManager.acquireMicrophone().then((stream) => {
        if (stream) {
          audioMeterRef.current = new AudioMeter();
          audioMeterRef.current.attachStream(stream, (level, isSpeaking) => {
            if (isSpeaking && !isMuted) {
              realtimeClient.toggleSpeaking(currentUserId, true);
              setActiveSpeakerId(currentUserId);
            }
          });
        }
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

    // Subscribe to realtime socket events
    const unsubJoin = realtimeClient.on('user:joined', (data: { user: Participant }) => {
      if (data?.user) {
        setParticipants((prev) => {
          if (prev.some((p) => p.id === data.user.id)) return prev;
          announce(`${data.user.name} joined the room`, 'polite');
          return [...prev, data.user];
        });
      }
    });

    const unsubLeave = realtimeClient.on('user:left', (data: { userId: string }) => {
      if (data?.userId) {
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
      setCaptions((prev) => [...prev.slice(-30), newCap]);
      if (settings.announcementFilters.speaking && newCap.speakerId !== currentUserId) {
        announce(`${newCap.speakerName}: ${newCap.text}`, 'polite');
      }
    });

    const unsubChat = realtimeClient.on('chat:message', (msg: ChatMessageItem) => {
      setChatMessages((prev) => [...prev, msg]);
      if (settings.announcementFilters.messages && msg.senderId !== currentUserId) {
        announce(`New chat from ${msg.senderName}: ${msg.text}`, 'polite');
      }
    });

    const unsubStage = realtimeClient.on('stage:change', (data: { stage: StructuredStage; activeSpeakerId: string | null }) => {
      setCurrentStage(data.stage);
      setActiveSpeakerId(data.activeSpeakerId);
      announce(`Room moved to stage: ${data.stage}`, 'polite');
    });

    return () => {
      captionEngineRef.current?.stop();
      audioMeterRef.current?.stop();
      webRTCManager.stopLocalStream();
      realtimeClient.leaveRoom(room.id, currentUserId);
      unsubJoin();
      unsubLeave();
      unsubMute();
      unsubSpeaking();
      unsubHand();
      unsubCaption();
      unsubChat();
      unsubStage();
    };
  }, [room.id, currentUserId, currentUserName, initialRole, announce, settings.captionsEnabled]);

  // Mic Mute Action
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
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

  // Send AAC text synthesized speech
  const handleBroadcastAAC = (text: string, emoji = '💬') => {
    // Push into Live Captions
    if (captionEngineRef.current) {
      captionEngineRef.current.pushManualCaption(text, true);
    }

    // Push into Text Chat alongside voice
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

    // Announce
    announce(`You spoke via AAC: ${text}`, 'polite');
  };

  // Moderator actions
  const handleMuteUser = (targetUserId: string) => {
    realtimeClient.sendModeratorAction({ type: 'mute', targetId: targetUserId });
    setParticipants((prev) =>
      prev.map((p) => (p.id === targetUserId ? { ...p, isMuted: true } : p))
    );
    announce('Participant was muted by moderator', 'polite');
  };

  const handleChangeRole = (targetUserId: string, role: Participant['role']) => {
    realtimeClient.sendModeratorAction({ type: 'role', targetId: targetUserId, role });
    setParticipants((prev) =>
      prev.map((p) => (p.id === targetUserId ? { ...p, role } : p))
    );
    announce(`Participant role updated to ${role}`, 'polite');
  };

  const handleKickUser = (targetUserId: string) => {
    realtimeClient.sendModeratorAction({ type: 'kick', targetId: targetUserId });
    setParticipants((prev) => prev.filter((p) => p.id !== targetUserId));
    announce('Participant removed from room', 'assertive');
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

  // Stage change
  const handleAdvanceStage = (nextStage: StructuredStage) => {
    setCurrentStage(nextStage);
    realtimeClient.changeStage(nextStage, activeSpeakerId);
  };

  const activeSpeaker = participants.find((p) => p.id === activeSpeakerId) || null;

  return (
    <main id="main-content" className="min-h-[calc(100vh-4rem)] flex flex-col bg-zinc-950 text-zinc-100">
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
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 font-medium">
              {room.topic}
            </p>
          </div>

          {/* Quick Actions & Emergency Exit */}
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse self-start md:self-auto">
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

      {/* Main Room Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Structured Stages Flow Bar (If enabled) */}
        <StageStructuredBar
          currentStage={currentStage}
          activeSpeaker={activeSpeaker}
          queue={queue}
          participants={participants}
          onAdvanceStage={handleAdvanceStage}
          isHostOrMod={isHostOrMod}
        />

        {/* Live Captions Display */}
        <LiveCaptionsDisplay captions={captions} />

        {/* Participant Grid */}
        <ParticipantGrid
          participants={participants}
          currentUserId={currentUserId}
          isHostOrMod={isHostOrMod}
          onMuteUser={handleMuteUser}
          onChangeRole={handleChangeRole}
          onKickUser={handleKickUser}
          onTogglePersonalMute={handleTogglePersonalMute}
          personallyMutedUserIds={personallyMutedUserIds}
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
        onToggleMute={handleToggleMute}
        onToggleHand={handleToggleHand}
        onToggleCaptions={() => setCaptionsOpen(!captionsOpen)}
        onToggleChat={() => setChatOpen(!chatOpen)}
        onToggleAAC={() => setAacOpen(true)}
        onOpenAccessibility={onOpenAccessibility}
        onOpenReport={() => setReportOpen(true)}
        onShareRoom={() => setShareOpen(true)}
        onLeaveRoom={onLeaveRoom}
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
