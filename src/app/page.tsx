'use client';

import React, { useState, useEffect } from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { useI18n } from '@/lib/i18n-context';
import { useAuth } from '@/lib/auth-context';
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
import { VoiceRoomErrorBoundary } from '@/components/common/VoiceRoomErrorBoundary';
import { UserProfileModal } from '@/components/profile/UserProfileModal';
import { ShareRoomModal } from '@/components/room/ShareRoomModal';
import { PrivacyNoticeModal } from '@/components/safety/PrivacyNoticeModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { FeedbackModal } from '@/components/feedback/FeedbackModal';
import { HeroSection } from '@/components/home/HeroSection';
import { CommunitySupporterSection } from '@/components/home/CommunitySupporterSection';
import { CommunityFeedbackSection } from '@/components/feedback/CommunityFeedbackSection';
import { PlatformFeatures } from '@/components/home/PlatformFeatures';
import { HowItWorks } from '@/components/home/HowItWorks';
import { deserializeRoomFromUrl } from '@/lib/room-serializer';
import { realtimeClient } from '@/lib/socket-client';
import { admobService } from '@/lib/admob-service';
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
  ShieldCheck,
} from 'lucide-react';

export default function Home() {
  const { settings, announce } = useAccessibility();
  const { t } = useI18n();
  const { user, isAuthModalOpen, setIsAuthModalOpen, authModalInitialTab, openAuthModal } = useAuth();

  // Rooms state
  const [rooms, setRooms] = useState<Room[]>(INITIAL_COMMUNITY_ROOMS);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [previewingRoom, setPreviewingRoom] = useState<Room | null>(null);
  const [isRefreshingRooms, setIsRefreshingRooms] = useState(false);

  // User Profile
  const [currentUserId, setCurrentUserId] = useState<string>(user?.id || 'user_' + Math.random().toString(36).substring(2, 9));
  const [currentUserName, setCurrentUserName] = useState<string>(user?.displayName || 'InclusiveVoice');
  const [initialRole, setInitialRole] = useState<'speaker' | 'listener'>('speaker');

  useEffect(() => {
    if (user) {
      setCurrentUserId(user.id);
      setCurrentUserName(user.displayName);
    }
  }, [user]);

  const fetchRoomsFromServer = async (announceUpdate = false) => {
    setIsRefreshingRooms(true);
    try {
      // Announce all locally created and known rooms to server so edge instances learn them
      try {
        const savedUserRooms = localStorage.getItem('voicesphere_user_rooms');
        const savedKnownRooms = localStorage.getItem('voicesphere_known_rooms');
        const customRoomsMap = new Map<string, Room>();
        if (savedUserRooms) {
          const parsed: Room[] = JSON.parse(savedUserRooms);
          parsed.forEach((r) => customRoomsMap.set(r.id, r));
        }
        if (savedKnownRooms) {
          const parsed: Room[] = JSON.parse(savedKnownRooms);
          parsed.forEach((r) => customRoomsMap.set(r.id, r));
        }
        const customList = Array.from(customRoomsMap.values());
        if (customList.length > 0) {
          fetch('/api/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ batch: customList }),
          }).catch(() => {});
        }
      } catch {}

      const res = await fetch('/api/rooms');
      const data = await res.json();
      if (data?.rooms && Array.isArray(data.rooms)) {
        setRooms((prev) => {
          const map = new Map<string, Room>();
          INITIAL_COMMUNITY_ROOMS.forEach((r) => map.set(r.id, r));
          prev.forEach((r) => map.set(r.id, r));
          data.rooms.forEach((r: Room) => map.set(r.id, r));
          const sorted = Array.from(map.values()).sort(
            (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
          );
          try {
            const initialIds = new Set(INITIAL_COMMUNITY_ROOMS.map((ir) => ir.id));
            const customOnly = sorted.filter((cr) => !initialIds.has(cr.id));
            localStorage.setItem('voicesphere_known_rooms', JSON.stringify(customOnly));
          } catch {}
          return sorted;
        });
        if (announceUpdate) {
          announce('Discovered latest community rooms across platforms.', 'polite');
        }
      }
    } catch {
      // ignore
    } finally {
      setIsRefreshingRooms(false);
    }
  };


  // Modals state
  const [isA11yCenterOpen, setIsA11yCenterOpen] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [shareModalRoom, setShareModalRoom] = useState<Room | null>(null);

  // Sync URL query parameter without page reload
  const updateUrlRoomParam = (roomId: string | null) => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      if (roomId) {
        url.searchParams.set('room', roomId);
      } else {
        url.searchParams.delete('room');
      }
      window.history.pushState({}, '', url.toString());
    } catch {
      // Safe fallback for restricted WebViews or Capacitor environments
    }
  };

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('voicesphere_username');
      if (savedUser) setCurrentUserName(savedUser);
      let savedId = localStorage.getItem('voicesphere_user_id');
      if (!savedId) {
        savedId = 'user_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('voicesphere_user_id', savedId);
      }
      setCurrentUserId(savedId);

      // Load user created and known community rooms from localStorage
      let allCombinedRooms = [...INITIAL_COMMUNITY_ROOMS];
      try {
        const savedUserRooms = localStorage.getItem('voicesphere_user_rooms');
        const savedKnownRooms = localStorage.getItem('voicesphere_known_rooms');
        const customRoomsMap = new Map<string, Room>();
        if (savedUserRooms) {
          const parsed: Room[] = JSON.parse(savedUserRooms);
          parsed.forEach((r) => customRoomsMap.set(r.id, r));
        }
        if (savedKnownRooms) {
          const parsed: Room[] = JSON.parse(savedKnownRooms);
          parsed.forEach((r) => customRoomsMap.set(r.id, r));
        }
        allCombinedRooms = [...Array.from(customRoomsMap.values()), ...INITIAL_COMMUNITY_ROOMS];
        setRooms(allCombinedRooms);
      } catch {}

      // Check if user has an active room session to resume on page reload/refresh
      let activeSessionRoomId: string | null = null;
      let activeSessionRole: 'speaker' | 'listener' = 'speaker';
      let activeSessionRoomData: Room | null = null;
      try {
        activeSessionRoomId = sessionStorage.getItem('voicesphere_active_room_id');
        const role = sessionStorage.getItem('voicesphere_active_role');
        if (role === 'listener' || role === 'speaker') activeSessionRole = role;
        const rawData = sessionStorage.getItem('voicesphere_active_room_data');
        if (rawData) activeSessionRoomData = JSON.parse(rawData);
      } catch {}

      // Check if URL contains room parameter
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const urlRoomId = params.get('room');
        if (urlRoomId) {
          const isResumingSession = activeSessionRoomId === urlRoomId;

          // Attempt to find room from cache, active session data, or URL deserialization
          let targetRoom: Room | null =
            allCombinedRooms.find((r) => r.id === urlRoomId) ||
            (activeSessionRoomData && activeSessionRoomData.id === urlRoomId ? activeSessionRoomData : null) ||
            deserializeRoomFromUrl(params, allCombinedRooms);

          if (targetRoom) {
            // Persist discovered room so it remains accessible on the main website directly
            try {
              const existing = localStorage.getItem('voicesphere_known_rooms');
              const parsed: Room[] = existing ? JSON.parse(existing) : [];
              if (!parsed.some((r) => r.id === targetRoom!.id)) {
                localStorage.setItem('voicesphere_known_rooms', JSON.stringify([targetRoom, ...parsed]));
              }
            } catch {}

            setRooms((prev) => {
              if (prev.some((r) => r.id === targetRoom!.id)) return prev;
              return [targetRoom!, ...prev];
            });

            if (isResumingSession) {
              // Seamless active session resumption: immediately re-enter room without modal
              setInitialRole(activeSessionRole);
              setActiveRoom(targetRoom);
              setPreviewingRoom(null);
              announce(`Resumed active session in ${targetRoom.name}`, 'polite');
            } else {
              // External shared invite link from a friend: open preview dialog
              setPreviewingRoom(targetRoom);
              announce(`Loaded shared room: ${targetRoom.name}`, 'polite');
            }
          } else {
            // Room not yet cached locally: fetch from server
            fetch(`/api/rooms?id=${encodeURIComponent(urlRoomId)}`)
              .then((res) => res.json())
              .then((data) => {
                if (data?.room) {
                  try {
                    const existing = localStorage.getItem('voicesphere_known_rooms');
                    const parsed: Room[] = existing ? JSON.parse(existing) : [];
                    if (!parsed.some((r) => r.id === data.room.id)) {
                      localStorage.setItem('voicesphere_known_rooms', JSON.stringify([data.room, ...parsed]));
                    }
                  } catch {}

                  setRooms((prev) => [data.room, ...prev]);
                  if (isResumingSession) {
                    setInitialRole(activeSessionRole);
                    setActiveRoom(data.room);
                    setPreviewingRoom(null);
                    announce(`Resumed active session in ${data.room.name}`, 'polite');
                  } else {
                    setPreviewingRoom(data.room);
                    announce(`Loaded shared room from link: ${data.room.name}`, 'polite');
                  }
                }
              })
              .catch(() => {});
          }
        }
      }

      fetchRoomsFromServer();

      // Fast periodic room sync: every 2 seconds
      const syncInterval = setInterval(() => {
        fetchRoomsFromServer();
      }, 2000);

      // Instant refresh when user returns to tab
      const handleFocus = () => fetchRoomsFromServer();
      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') fetchRoomsFromServer();
      });

      const unsubRoomCreated = realtimeClient.on(
        'global:room_created',
        (payload: { room?: Room } | Room) => {
          const createdRoom = (payload as any)?.room || payload;
          if (createdRoom && createdRoom.id) {
            setRooms((prev) => {
              if (prev.some((r) => r.id === createdRoom.id)) return prev;
              announce(`New community room opened: ${createdRoom.name}`, 'polite');
              return [createdRoom, ...prev];
            });
            try {
              const existing = localStorage.getItem('voicesphere_user_rooms');
              const parsedList: Room[] = existing ? JSON.parse(existing) : [];
              localStorage.setItem(
                'voicesphere_user_rooms',
                JSON.stringify([createdRoom, ...parsedList.filter((r) => r.id !== createdRoom.id)])
              );
            } catch {}
          }
        }
      );

      return () => {
        clearInterval(syncInterval);
        unsubRoomCreated();
      };
    } catch {}
  }, []);

  // AdMob Banner Lifecycle: show on home/discovery, hide when active in a voice room
  useEffect(() => {
    if (activeRoom) {
      admobService.hideBanner().catch(() => {});
    } else {
      admobService.showBanner(false).catch(() => {});
    }
  }, [activeRoom]);

  const handleSelectRoom = (room: Room) => {
    announce(`Opened preview for ${room.name}`, 'polite');
    setPreviewingRoom(room);
  };

  const handleConfirmJoin = ({
    joinAsListener,
    displayName,
    passcode,
  }: {
    joinAsListener: boolean;
    displayName: string;
    passcode?: string;
  }) => {
    if (!previewingRoom) return;
    setCurrentUserName(displayName);
    const chosenRole = joinAsListener ? 'listener' : 'speaker';
    setInitialRole(chosenRole);

    const updatedRoom: Room = {
      ...previewingRoom,
      passcode: passcode || previewingRoom.passcode,
    };

    try {
      sessionStorage.setItem('voicesphere_active_room_id', updatedRoom.id);
      sessionStorage.setItem('voicesphere_active_role', chosenRole);
      sessionStorage.setItem('voicesphere_active_room_data', JSON.stringify(updatedRoom));
    } catch {}

    setActiveRoom(updatedRoom);
    updateUrlRoomParam(previewingRoom.id);
    setPreviewingRoom(null);
  };

  const handleCreateRoom = (newRoom: Room) => {
    const updated = [newRoom, ...rooms];
    setRooms(updated);

    try {
      const existing = localStorage.getItem('voicesphere_user_rooms');
      const parsedList: Room[] = existing ? JSON.parse(existing) : [];
      localStorage.setItem(
        'voicesphere_user_rooms',
        JSON.stringify([newRoom, ...parsedList.filter((r) => r.id !== newRoom.id)])
      );

      sessionStorage.setItem('voicesphere_active_room_id', newRoom.id);
      sessionStorage.setItem('voicesphere_active_role', 'speaker');
      sessionStorage.setItem('voicesphere_active_room_data', JSON.stringify(newRoom));
    } catch {}

    fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRoom),
    }).catch(() => {});

    realtimeClient.broadcastRoomCreated(newRoom);
    setActiveRoom(newRoom);
    updateUrlRoomParam(newRoom.id);
    announce(`Created room: ${newRoom.name}. Accessible across all devices.`, 'polite');
  };

  const handleLeaveRoom = () => {
    if (activeRoom) {
      announce(`Left room ${activeRoom.name}`, 'polite');
    }
    try {
      sessionStorage.removeItem('voicesphere_active_room_id');
      sessionStorage.removeItem('voicesphere_active_role');
      sessionStorage.removeItem('voicesphere_active_room_data');
    } catch {}
    setActiveRoom(null);
    updateUrlRoomParam(null);
    // Show interstitial on natural exit from a room (guarded by 5-minute cooldown)
    admobService.showInterstitial('room_exit').catch(() => {});
  };

  // If currently inside an active room, render VoiceRoomView
  if (activeRoom) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
        <Navbar
          onOpenAccessibility={() => setIsA11yCenterOpen(true)}
          onCreateRoom={() => setIsCreateRoomOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenFeedback={() => setIsFeedbackOpen(true)}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
          onOpenAuth={(tab) => openAuthModal(tab)}
          currentUserName={currentUserName}
          inRoom={true}
        />

        <VoiceRoomErrorBoundary
          roomName={activeRoom.name}
          onLeaveRoom={handleLeaveRoom}
          onOpenAccessibility={() => setIsA11yCenterOpen(true)}
        >
          <VoiceRoomView
            room={activeRoom}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            initialRole={initialRole}
            onLeaveRoom={handleLeaveRoom}
            onOpenAccessibility={() => setIsA11yCenterOpen(true)}
          />
        </VoiceRoomErrorBoundary>

        <AccessibilityCenterModal
          isOpen={isA11yCenterOpen}
          onClose={() => setIsA11yCenterOpen(false)}
        />

        <FeedbackModal
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
        />

        <PrivacyNoticeModal
          isOpen={isPrivacyOpen}
          onClose={() => setIsPrivacyOpen(false)}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialTab={authModalInitialTab}
        />
      </div>
    );
  }

  // Home / Discovery View
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 pb-14 sm:pb-0">
      <Navbar
        onOpenAccessibility={() => setIsA11yCenterOpen(true)}
        onCreateRoom={() => setIsCreateRoomOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenAuth={(tab) => openAuthModal(tab)}
        currentUserName={currentUserName}
        inRoom={false}
      />

      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* 1. Modern Hero Section */}
        <HeroSection
          onOpenAccessibility={() => setIsA11yCenterOpen(true)}
          onCreateRoom={() => setIsCreateRoomOpen(true)}
          onOpenPrivacy={() => setIsPrivacyOpen(true)}
          onOpenFeedback={() => setIsFeedbackOpen(true)}
          totalActiveRooms={rooms.length}
        />

        {/* 1.5 Community Supporter & AdMob Support Section */}
        <CommunitySupporterSection />

        {/* 2. Community Thoughts & Feedback Wall */}
        <CommunityFeedbackSection onOpenFeedback={() => setIsFeedbackOpen(true)} />

        {/* 3. Core Architectural Pillars */}
        <PlatformFeatures />

        {/* 4. Disability-Inclusive Presets (A through J) */}
        <section aria-labelledby="presets-heading" className="space-y-4 pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 text-xs font-bold uppercase tracking-wider">
                WCAG 2.2 AAA Quick Switch
              </span>
              <h2 id="presets-heading" className="text-xl sm:text-2xl font-black text-white mt-1">
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

        {/* 5. How VoiceSphere Works in 3 Steps */}
        <HowItWorks onOpenAccessibility={() => setIsA11yCenterOpen(true)} />

        {/* 6. Discovery & Active Voice Rooms */}
        <section id="rooms-section" aria-labelledby="discovery-heading" className="space-y-6 pt-4 border-t border-zinc-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                Live Spatial Channels
              </span>
              <span className="text-xs text-zinc-400">• WebRTC P2P</span>
            </div>
            <h2 id="discovery-heading" className="text-xl sm:text-2xl font-black text-white mt-1">
              {t('discoverRooms')}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Filter by language, community category, live captioning, and AAC support
            </p>
          </div>

          <RoomDiscovery
            rooms={rooms}
            onSelectRoom={handleSelectRoom}
            onCreateRoom={() => setIsCreateRoomOpen(true)}
            onShareRoom={(room) => setShareModalRoom(room)}
            onRefreshRooms={() => fetchRoomsFromServer(true)}
            isRefreshing={isRefreshingRooms}
          />
        </section>
      </main>

      <Footer />

      {/* VoiceSphere Authentication Modal (Sign In, Free Registration) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalInitialTab}
      />

      {/* Community Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      {/* Share Room Modal */}
      <ShareRoomModal
        room={shareModalRoom}
        isOpen={Boolean(shareModalRoom)}
        onClose={() => setShareModalRoom(null)}
      />

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

      {/* Privacy Notice Modal */}
      <PrivacyNoticeModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </div>
  );
}
