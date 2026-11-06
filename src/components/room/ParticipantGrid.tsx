'use client';

import React from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { Participant, ParticipantRole } from '@/types/room';
import {
  Mic,
  MicOff,
  Hand,
  MessageSquare,
  Shield,
  Volume2,
  VolumeX,
  MoreVertical,
} from 'lucide-react';

interface ParticipantGridProps {
  participants: Participant[];
  currentUserId: string;
  isHostOrMod: boolean;
  onMuteUser?: (userId: string) => void;
  onChangeRole?: (userId: string, role: ParticipantRole) => void;
  onKickUser?: (userId: string) => void;
  onTogglePersonalMute?: (userId: string) => void;
  personallyMutedUserIds?: Set<string>;
  activeSpeakerId?: string | null;
}

export function ParticipantGrid({
  participants,
  currentUserId,
  isHostOrMod,
  onMuteUser,
  onChangeRole,
  onKickUser,
  onTogglePersonalMute,
  personallyMutedUserIds = new Set(),
  activeSpeakerId,
}: ParticipantGridProps) {
  const { settings, announce } = useAccessibility();

  const speakers = participants.filter((p) => p.role === 'host' || p.role === 'moderator' || p.role === 'speaker');
  const listeners = participants.filter((p) => p.role === 'listener');

  return (
    <div className="space-y-6">
      {/* Speakers Section */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-extrabold tracking-wide uppercase text-zinc-400">
            Speakers on Stage {!settings.hideParticipantCounts && `(${speakers.length})`}
          </h3>
          <span className="text-xs text-zinc-400">
            Microphone and AAC communication enabled
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {speakers.map((participant) => (
            <ParticipantCard
              key={participant.id}
              participant={participant}
              isSelf={participant.id === currentUserId}
              isPersonallyMuted={personallyMutedUserIds.has(participant.id)}
              isActiveSpeaker={participant.id === activeSpeakerId || participant.isSpeaking}
              isHostOrMod={isHostOrMod}
              onMuteUser={onMuteUser}
              onChangeRole={onChangeRole}
              onKickUser={onKickUser}
              onTogglePersonalMute={onTogglePersonalMute}
            />
          ))}
        </div>
      </div>

      {/* Listeners Section */}
      {listeners.length > 0 && (
        <div className="pt-4 border-t border-zinc-800/80">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-extrabold tracking-wide uppercase text-zinc-400">
              Audience & Listeners {!settings.hideParticipantCounts && `(${listeners.length})`}
            </h3>
            <span className="text-xs text-zinc-400">
              Text participation & raise hand to speak
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {listeners.map((participant) => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                isSelf={participant.id === currentUserId}
                isPersonallyMuted={personallyMutedUserIds.has(participant.id)}
                isActiveSpeaker={false}
                isHostOrMod={isHostOrMod}
                onMuteUser={onMuteUser}
                onChangeRole={onChangeRole}
                onKickUser={onKickUser}
                onTogglePersonalMute={onTogglePersonalMute}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ParticipantCardProps {
  participant: Participant;
  isSelf: boolean;
  isPersonallyMuted: boolean;
  isActiveSpeaker: boolean;
  isHostOrMod: boolean;
  onMuteUser?: (userId: string) => void;
  onChangeRole?: (userId: string, role: ParticipantRole) => void;
  onKickUser?: (userId: string) => void;
  onTogglePersonalMute?: (userId: string) => void;
}

function ParticipantCard({
  participant,
  isSelf,
  isPersonallyMuted,
  isActiveSpeaker,
  isHostOrMod,
  onMuteUser,
  onChangeRole,
  onKickUser,
  onTogglePersonalMute,
}: ParticipantCardProps) {
  const { settings } = useAccessibility();
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Audio visual ripple for deaf/HOH
  const showRipple = settings.audioVisualRipple && isActiveSpeaker && !settings.lowStimulationMode;

  const roleBadge = {
    host: { text: 'HOST', class: 'bg-amber-400 text-black border-amber-300' },
    moderator: { text: 'MOD', class: 'bg-blue-500 text-white border-blue-400' },
    speaker: { text: 'SPEAKER', class: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    listener: { text: 'LISTENER', class: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
  }[participant.role];

  return (
    <div
      role="region"
      aria-label={`${participant.name}, ${participant.role}. ${
        participant.isMuted ? 'Muted' : 'Microphone unmuted'
      }. ${participant.isAacUser ? 'Using AAC synthesized speech' : ''}`}
      className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all bg-zinc-900/90 text-center ${
        showRipple
          ? 'border-emerald-400 shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-400/40'
          : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* Hand Raised Banner */}
      {participant.isHandRaised && (
        <div
          aria-label="Hand raised to speak"
          className="absolute -top-2 px-2 py-0.5 rounded-full bg-amber-400 text-black text-[11px] font-black flex items-center space-x-1 shadow-md"
        >
          <Hand className="w-3.5 h-3.5" />
          <span>Hand Raised</span>
        </div>
      )}

      {/* Avatar Container */}
      <div className="relative my-2">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black shadow-inner border-2 ${
            showRipple
              ? 'border-emerald-400 animate-pulse'
              : 'border-zinc-700 bg-zinc-800 text-zinc-100'
          }`}
        >
          {participant.avatar || participant.name.slice(0, 2).toUpperCase()}
        </div>

        {/* Mic Status Icon */}
        <div
          aria-label={participant.isMuted ? 'Microphone muted' : 'Microphone active'}
          className={`absolute bottom-0 right-0 p-1 rounded-full border-2 border-zinc-950 text-white ${
            participant.isMuted ? 'bg-red-500' : 'bg-emerald-500'
          }`}
        >
          {participant.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </div>

        {/* AAC Badge */}
        {participant.isAacUser && (
          <div
            aria-label="User communicates via AAC / Synthesized speech"
            className="absolute top-0 left-0 p-1 rounded-full bg-blue-500 border-2 border-zinc-950 text-white"
            title="AAC Communicator"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Participant Name & Badges */}
      <div className="w-full truncate px-1">
        <div className="font-extrabold text-sm text-zinc-100 truncate">
          {participant.name} {isSelf && <span className="text-zinc-400 font-normal">(You)</span>}
        </div>

        {participant.pronouns && (
          <div className="text-[11px] text-zinc-400 font-medium">
            {participant.pronouns}
          </div>
        )}

        <div className="flex items-center justify-center gap-1 mt-1.5 flex-wrap">
          <span
            className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${roleBadge.class}`}
          >
            {roleBadge.text}
          </span>

          {isPersonallyMuted && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-red-400 border border-red-500/40">
              Muted For You
            </span>
          )}
        </div>
      </div>

      {/* Quick Action Controls (Personal Mute & Mod Actions) */}
      <div className="flex items-center space-x-1.5 rtl:space-x-reverse mt-2">
        {!isSelf && onTogglePersonalMute && (
          <button
            type="button"
            onClick={() => onTogglePersonalMute(participant.id)}
            aria-label={isPersonallyMuted ? `Unmute ${participant.name} for yourself` : `Personal mute for ${participant.name}`}
            className={`p-1.5 rounded-lg border text-xs transition ${
              isPersonallyMuted
                ? 'bg-red-500/20 text-red-400 border-red-500/50'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
            }`}
          >
            {isPersonallyMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        )}

        {isHostOrMod && !isSelf && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={`Moderator options for ${participant.name}`}
              className="p-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 bottom-full mb-1 w-44 rounded-xl border border-zinc-700 bg-zinc-950 p-1.5 shadow-xl z-50 text-xs">
                {onMuteUser && !participant.isMuted && (
                  <button
                    onClick={() => {
                      onMuteUser(participant.id);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 flex items-center space-x-1.5"
                  >
                    <MicOff className="w-3.5 h-3.5 text-red-400" />
                    <span>Mute Speaker</span>
                  </button>
                )}

                {onChangeRole && participant.role === 'listener' && (
                  <button
                    onClick={() => {
                      onChangeRole(participant.id, 'speaker');
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 flex items-center space-x-1.5"
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Invite to Speak</span>
                  </button>
                )}

                {onChangeRole && participant.role === 'speaker' && (
                  <button
                    onClick={() => {
                      onChangeRole(participant.id, 'listener');
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800 flex items-center space-x-1.5"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>Move to Listener</span>
                  </button>
                )}

                {onKickUser && (
                  <button
                    onClick={() => {
                      onKickUser(participant.id);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 flex items-center space-x-1.5"
                  >
                    <span>Remove from Room</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
