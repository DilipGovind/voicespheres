'use client';

import React, { useState, useEffect } from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { useI18n } from '@/lib/i18n-context';
import { Room } from '@/types/room';
import { INITIAL_COMMUNITY_ROOMS } from '@/lib/mock-rooms';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AccessibilityCenterModal } from '@/components/accessibility/AccessibilityCenterModal';
import { PresetSelector } from '@/components/accessibility/PresetSelector';
import { RoomDiscovery } from '@/components/discovery/RoomDiscovery';
import { CreateRoomModal } from '@/components/discovery/CreateRoomModal';
import { RoomLobbyPreview } from '@/components/room/RoomLobbyPreview';
import { VoiceRoomView } from '@/components/room/VoiceRoomView';
import { UserProfileModal } from '@/components/profile/UserProfileModal';
import {
  Radio,
  Sliders,
  Sparkles,
  Shield,
  Heart,
  Volume2,
  Subtitles,
  MessageSquare,
  MousePointer,
  Ear,
  Eye,
  User,
} from 'lucide-react';

export default function Home() {
  const { settings, announce } = useAccessibility();
  const { t } = useI18n();

  // Rooms state
  const [rooms, setRooms] = useState<Room[]>(INITIAL_COMMUNITY_ROOMS);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [previewingRoom, setPreviewingRoom] = useState<Room | null>(null);

  // User Profile
  const [currentUserId, setCurrentUserId] = useState<string>('user_' + Math.random().toString(36).substring(2, 9));
  const [currentUserName, setCurrentUserName] = useState<string>('InclusiveVoice');
  const [initialRole, setInitialRole] = useState<'speaker' | 'listener'>('speaker');

  // Modals state
  const [isA11yCenterOpen, setIsA11yCenterOpen] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('voicesphere_username');
      if (savedUser) setCurrentUserName(savedUser);

      const savedRooms = localStorage.getItem('voicesphere_user_rooms');
      if (savedRooms) {
        const parsed = JSON.parse(savedRooms);
        setRooms([...parsed, ...INITIAL_COMMUNITY_ROOMS]);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSelectRoom = (room: Room) => {
    announce(`Opened preview for ${room.name}`, 'polite');
    setPreviewingRoom(room);
  };

  const handleConfirmJoin = ({
    joinAsListener,
    displayName,
  }: {
    joinAsListener: boolean;
    displayName: string;
  }) => {
    if (!previewingRoom) return;
    setCurrentUserName(displayName);
    setInitialRole(joinAsListener ? 'listener' : 'speaker');
    setActiveRoom(previewingRoom);
    setPreviewingRoom(null);
  };

  const handleCreateRoom = (newRoom: Room) => {
    const updated = [newRoom, ...rooms];
    setRooms(updated);
    try {
      localStorage.setItem('voicesphere_user_rooms', JSON.stringify([newRoom]));
    } catch {
      // ignore
    }
    setActiveRoom(newRoom);
  };

  const handleLeaveRoom = () => {
    if (activeRoom) {
      announce(`Left room ${activeRoom.name}`, 'polite');
    }
    setActiveRoom(null);
  };

  // If currently inside an active room, render VoiceRoomView
  if (activeRoom) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
        <Navbar
          onOpenAccessibility={() => setIsA11yCenterOpen(true)}
          onCreateRoom={() => setIsCreateRoomOpen(true)}
          inRoom={true}
        />

        <VoiceRoomView
          room={activeRoom}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          initialRole={initialRole}
          onLeaveRoom={handleLeaveRoom}
          onOpenAccessibility={() => setIsA11yCenterOpen(true)}
        />

        <AccessibilityCenterModal
          isOpen={isA11yCenterOpen}
          onClose={() => setIsA11yCenterOpen(false)}
        />
      </div>
    );
  }

  // Home / Discovery View
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar
        onOpenAccessibility={() => setIsA11yCenterOpen(true)}
        onCreateRoom={() => setIsCreateRoomOpen(true)}
        inRoom={false}
      />

      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Hero Section */}
        <div className="relative rounded-3xl border-2 border-zinc-800 bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-zinc-900/80 p-6 sm:p-10 shadow-2xl overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center space-x-2 rtl:space-x-reverse px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Universal Accessibility as Core Architecture</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              A Voice Community Built For{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-yellow-400">
                Every Single Person.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl">
              {t('appTagline')} Participate using your voice, live captions, typed text, or AAC synthesized speech. No barriers, zero tracking, completely free.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsA11yCenterOpen(true)}
                className="flex items-center space-x-2 rtl:space-x-reverse px-5 py-3 rounded-2xl bg-yellow-400 text-black hover:bg-yellow-300 font-extrabold text-sm shadow-xl shadow-yellow-400/20 transition"
              >
                <Sliders className="w-4 h-4 stroke-[3]" />
                <span>One-Click Accessibility Presets</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCreateRoomOpen(true)}
                className="flex items-center space-x-2 rtl:space-x-reverse px-5 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 font-bold text-sm transition"
              >
                <span>{t('createRoom')}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-semibold text-sm transition"
              >
                <User className="w-4 h-4" />
                <span>My Profile ({currentUserName})</span>
              </button>
            </div>
          </div>
        </div>

        {/* 10 Presets Quick Carousel / Bar */}
        <section aria-labelledby="presets-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="presets-heading" className="text-xl sm:text-2xl font-black text-white">
                Disability-Inclusive Presets (A through J)
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Click any preset to instantaneously customize screen reading, captions, AAC tools, or sensory pacing
              </p>
            </div>
            <button
              onClick={() => setIsA11yCenterOpen(true)}
              className="text-xs sm:text-sm font-bold text-yellow-400 hover:underline hidden sm:block"
            >
              Open Full Center &rarr;
            </button>
          </div>

          <PresetSelector />
        </section>

        {/* Discovery & Active Voice Rooms */}
        <section aria-labelledby="discovery-heading" className="space-y-6 pt-4 border-t border-zinc-800">
          <div>
            <h2 id="discovery-heading" className="text-xl sm:text-2xl font-black text-white">
              Discover Inclusive Communities
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Filter by language, community category, live captioning, and AAC support
            </p>
          </div>

          <RoomDiscovery
            rooms={rooms}
            onSelectRoom={handleSelectRoom}
            onCreateRoom={() => setIsCreateRoomOpen(true)}
          />
        </section>
      </main>

      <Footer />

      {/* Lobby Preview Modal */}
      {previewingRoom && (
        <RoomLobbyPreview
          room={previewingRoom}
          onConfirmJoin={handleConfirmJoin}
          onCancel={() => setPreviewingRoom(null)}
        />
      )}

      {/* Universal Accessibility Center Modal */}
      <AccessibilityCenterModal
        isOpen={isA11yCenterOpen}
        onClose={() => setIsA11yCenterOpen(false)}
      />

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateRoomOpen}
        onClose={() => setIsCreateRoomOpen(false)}
        onCreate={handleCreateRoom}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />

      {/* Pseudonymous User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentName={currentUserName}
        onUpdateName={(newName) => setCurrentUserName(newName)}
      />
    </div>
  );
}
