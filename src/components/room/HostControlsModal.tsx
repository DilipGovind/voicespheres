'use client';

import React, { useState } from 'react';
import { Participant, Room } from '@/types/room';
import { useAccessibility } from '@/lib/accessibility-context';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import {
  ShieldAlert,
  Lock,
  Unlock,
  MicOff,
  UserX,
  Volume2,
  StopCircle,
  X,
  CheckCircle,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

interface HostControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  currentUserId: string;
  participants: Participant[];
  isLocked: boolean;
  onToggleLock: () => void;
  onMuteParticipant: (userId: string) => void;
  onKickParticipant: (userId: string) => void;
  onChangeRole: (userId: string, role: Participant['role']) => void;
  onEndRoom: () => void;
}

export function HostControlsModal({
  isOpen,
  onClose,
  room,
  currentUserId,
  participants,
  isLocked,
  onToggleLock,
  onMuteParticipant,
  onKickParticipant,
  onChangeRole,
  onEndRoom,
}: HostControlsModalProps) {
  const { announce } = useAccessibility();
  const [confirmEndRoom, setConfirmEndRoom] = useState(false);

  useModalDismiss(isOpen, onClose);

  if (!isOpen) return null;

  const otherParticipants = participants.filter((p) => p.id !== currentUserId);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="host-controls-title"
        className="bg-zinc-900 border-2 border-zinc-700 w-full max-w-[calc(100vw-1.5rem)] sm:max-w-xl rounded-3xl p-4 sm:p-8 space-y-6 shadow-2xl relative text-zinc-100 max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close host controls"
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition focus-visible:ring-2 focus-visible:ring-yellow-400"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="space-y-1 pr-8">
          <div className="flex items-center space-x-2 text-yellow-400">
            <ShieldAlert className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-yellow-400/20 border border-yellow-400/40">
              Host Administration
            </span>
          </div>
          <h2 id="host-controls-title" className="text-2xl font-black text-white">
            Room Host Controls
          </h2>
          <p className="text-xs text-zinc-400">
            Manage room privacy, participant speaking privileges, and room lifecycle.
          </p>
        </div>

        {/* Room Security Toggles */}
        <div className="p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                {isLocked ? (
                  <Lock className="w-4 h-4 text-amber-400" />
                ) : (
                  <Unlock className="w-4 h-4 text-emerald-400" />
                )}
                <span className="text-sm font-bold text-white">
                  {isLocked ? 'Room is Locked' : 'Room is Open'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {isLocked
                  ? 'New participants cannot join until you unlock the room.'
                  : 'Anyone with the link or code can join (subject to capacity).' }
              </p>
            </div>

            <button
              type="button"
              onClick={onToggleLock}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                isLocked
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {isLocked ? (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Unlock Room</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Lock Room</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Participant Management List */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-zinc-300">
            Manage Participants ({otherParticipants.length})
          </h3>

          <div
            tabIndex={0}
            role="region"
            aria-label="Room Participants List"
            className="space-y-2 max-h-52 overflow-y-auto pr-1"
          >
            {otherParticipants.length === 0 ? (
              <p className="text-xs text-zinc-500 p-3 text-center bg-zinc-950/60 rounded-xl border border-zinc-800">
                No other participants currently in room.
              </p>
            ) : (
              otherParticipants.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-between gap-2 flex-wrap"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-7 h-7 rounded-full bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center justify-center">
                      {p.avatar}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                        <span>{p.name}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-zinc-700 text-zinc-300">
                          {p.role}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {p.isMuted ? 'Muted' : 'Unmuted'} {p.isHandRaised ? '• Hand Raised' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1.5">
                    {!p.isMuted && (
                      <button
                        type="button"
                        onClick={() => onMuteParticipant(p.id)}
                        aria-label={`Mute ${p.name}`}
                        className="p-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs transition"
                        title="Mute Participant"
                      >
                        <MicOff className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {p.role === 'listener' ? (
                      <button
                        type="button"
                        onClick={() => onChangeRole(p.id, 'speaker')}
                        aria-label={`Promote ${p.name} to speaker`}
                        className="px-2 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition flex items-center space-x-1"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Make Speaker</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onChangeRole(p.id, 'listener')}
                        aria-label={`Demote ${p.name} to listener`}
                        className="px-2 py-1 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-[11px] font-bold transition"
                      >
                        Make Listener
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onKickParticipant(p.id)}
                      aria-label={`Remove ${p.name} from room`}
                      className="p-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/60 text-rose-300 border border-rose-500/40 text-xs transition"
                      title="Remove Participant"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Danger Zone: End Room */}
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/50 space-y-3">
          <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center space-x-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Danger Zone</span>
          </h4>

          {confirmEndRoom ? (
            <div className="space-y-2">
              <p className="text-xs text-rose-200">
                Are you sure? This will disconnect all participants and close the room for everyone.
              </p>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onEndRoom}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
                >
                  Yes, End Room Now
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmEndRoom(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                End the room immediately for all participants.
              </span>
              <button
                type="button"
                onClick={() => setConfirmEndRoom(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs transition flex items-center space-x-1.5"
              >
                <StopCircle className="w-4 h-4" />
                <span>End Room</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Done and close host controls"
            className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
